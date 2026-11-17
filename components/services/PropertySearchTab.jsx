import { useCallback, useEffect, useState } from 'react'
import { useUser } from 'next-firebase-auth'
import ServiceRequestsPanel from './ServiceRequestsPanel'
import {
  deleteServiceRequest,
  getServiceRequestsByCategory,
  updateServiceRequestPayment,
  updateServiceRequestStatus,
} from '@/lib/services/serviceRequests'
import { ModalSection, whatsappUrl } from '@/components/ui/AdminModal'
import { RiWhatsappLine } from 'react-icons/ri'
import StatusPill from '@/components/ui/StatusPill'
import { useCanManage } from '@/hooks/useCanManage'
import { notify } from '@/utils/toast'

const searchTypeLabel = (value) => {
  if (value === 'buy') return 'Achat'
  if (value === 'rent') return 'Location'
  return null
}

// Formule choisie sur le site (rien n'est payé en ligne : le conseiller confirme le prix)
const SERVICE_LEVELS = {
  classic: 'Classique · Gratuit',
  assisted: 'Assistée · 50 000 GNF',
  full: 'Accompagnement complet · 100 000 à 200 000 GNF',
}

const serviceLevelLabel = (request) => {
  if (request.serviceLevel && SERVICE_LEVELS[request.serviceLevel]) return SERVICE_LEVELS[request.serviceLevel]
  if (request.serviceLevelLabel) return [request.serviceLevelLabel, request.servicePrice].filter(Boolean).join(' · ')
  // Demandes envoyées avant l'ajout des formules
  return 'Classique · Gratuit'
}

// ─── Paiement des formules payantes (noté à la main : rien n'est payé en ligne) ───

/** Numéro de dépôt donné au client pour le paiement mobile */
const DEPOSIT_NUMBER = '628 610 357'
const SIGNATURE = ['Service client BâtiMoo', 'Cherchez moins. Trouvez mieux.']
const FIRST_RESULTS_DELAY = '3 à 7 jours ouvrables'

/**
 * Versements prévus par formule. Montants modifiables dans la fiche
 * (l'accompagnement complet peut aller de 100 000 à 200 000 GNF).
 */
const PAYMENT_PLANS = {
  assisted: [
    { key: 'launch', label: 'Paiement au lancement du dossier', amount: 50000, terms: 'à la confirmation et au lancement de votre dossier' },
  ],
  full: [
    { key: 'deposit', label: 'Acompte au lancement du dossier', amount: 50000, terms: 'à la confirmation et au lancement de votre dossier' },
    { key: 'balance', label: "Solde après identification d'un logement, avant les visites", amount: 100000, terms: "après identification d'un logement correspondant à vos critères, avant l'organisation des visites" },
  ],
}
const isPaidSearch = (request) => Boolean(PAYMENT_PLANS[request.serviceLevel])

const PAYMENT_METHODS = ['Orange Money', 'MTN Mobile Money', 'Espèces', 'Virement bancaire']

const gnf = (amount) => `${Number(amount || 0).toLocaleString('fr-FR').replace(/[  ]/g, ' ')} GNF`

/** Versements de la demande : enregistrés, sinon ceux de la formule (anciens paiements uniques repris). */
const installmentsOf = (request) => {
  if (Array.isArray(request.installments) && request.installments.length) return request.installments
  if (request.paymentStatus === 'paid' && Number(request.paymentAmount) > 0) {
    return [{ key: 'legacy', label: 'Paiement', amount: Number(request.paymentAmount), paid: true, method: request.paymentMethod || '', paidOn: request.paidOn || '' }]
  }
  return (PAYMENT_PLANS[request.serviceLevel] || []).map((item) => ({ ...item, paid: false, method: '', paidOn: '' }))
}

/** Résumé enregistré avec les versements : liste, revenus et anciens écrans s'en servent. */
const paymentSummary = (installments) => {
  const paid = installments.filter((item) => item.paid)
  const paidAmount = paid.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const total = installments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return {
    installments,
    paymentTotal: total,
    paymentAmount: paidAmount,
    paymentStatus: paid.length === 0 ? 'pending' : paid.length === installments.length ? 'paid' : 'partial',
    paymentMethod: paid.length ? paid[paid.length - 1].method : null,
    paidOn: paid.length ? paid[paid.length - 1].paidOn : null,
  }
}

const paymentPill = (request) => {
  if (!isPaidSearch(request)) return null
  if (request.paymentStatus === 'paid') return <StatusPill tone="success">Payé</StatusPill>
  if (request.paymentStatus === 'partial') return <StatusPill tone="primary">Acompte reçu</StatusPill>
  return <StatusPill tone="warning">À encaisser</StatusPill>
}

const todayInput = () => new Date().toISOString().slice(0, 10)
const readableDate = (value) => {
  const date = new Date(`${value || todayInput()}T12:00:00`)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
const levelName = (request) => request.serviceLevelLabel || serviceLevelLabel(request).split(' · ')[0]

/** Message des modalités de paiement, à envoyer une fois la formule confirmée. */
const termsMessage = (request, installments) => {
  const total = installments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const firstName = firstNameOf(request.name)
  const lines = [
    `Bonjour${firstName ? ` ${firstName}` : ''},`,
    '',
    `Pour votre information, la formule *${levelName(request)}* est proposée au tarif de *${gnf(total)}*.`,
    '',
  ]
  if (installments.length > 1) {
    lines.push('Les modalités de paiement sont les suivantes :', '')
    installments.forEach((item) => {
      const when = item.terms || PAYMENT_PLANS[request.serviceLevel]?.find((plan) => plan.key === item.key)?.terms || item.label.toLowerCase()
      lines.push(`- *${gnf(item.amount)}* ${when}.`)
    })
    lines.push('', `Le premier versement peut être effectué au numéro de dépôt suivant : *${DEPOSIT_NUMBER}*.`)
  } else {
    lines.push(`Le paiement se fait à la confirmation et au lancement de votre dossier, au numéro de dépôt suivant : *${DEPOSIT_NUMBER}*.`)
  }
  lines.push(
    '',
    `Le délai estimatif pour les premières propositions est de *${FIRST_RESULTS_DELAY}*, selon la disponibilité des logements correspondant à vos critères.`,
    '',
    "Notre équipe s'engage à assurer un suivi sérieux de votre recherche.",
    '',
    `*${SIGNATURE[0]}*`,
    `_${SIGNATURE[1]}_`
  )
  return lines.join('\n')
}

/** Reçu d'un versement : numéro, montant, mode, reste à payer. */
const receiptNumber = (request, index) => `BM-${String(request.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}-${index + 1}`
const receiptMessage = (request, installments, index) => {
  const item = installments[index]
  const { paymentTotal, paymentAmount } = paymentSummary(installments)
  const remaining = paymentTotal - paymentAmount
  const firstName = firstNameOf(request.name)
  return [
    `*Reçu de paiement N° ${receiptNumber(request, index)}*`,
    '',
    `Client : ${request.name || firstName || '—'}`,
    `Formule : ${levelName(request)} (${gnf(paymentTotal)})`,
    `Objet : ${item.label}`,
    `Montant reçu : *${gnf(item.amount)}*`,
    `Mode de paiement : ${item.method || '—'}`,
    `Date : ${readableDate(item.paidOn)}`,
    '',
    remaining > 0 ? `Reste à payer : ${gnf(remaining)}` : 'Formule entièrement réglée. Merci !',
    '',
    `*${SIGNATURE[0]}*`,
    `_${SIGNATURE[1]}_`,
  ].join('\n')
}

/** Fiche : versements prévus, encaissement de chacun, messages WhatsApp (modalités, reçus). */
function PaymentSection({ request, onUpdated }) {
  const canProcess = useCanManage('services', 'process')
  const [items, setItems] = useState(() => installmentsOf(request))
  const [savingIndex, setSavingIndex] = useState(null)

  useEffect(() => {
    setItems(installmentsOf(request))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.id, request.installments, request.paymentStatus, request.serviceLevel])

  if (!isPaidSearch(request)) return null

  const summary = paymentSummary(items)
  const remaining = summary.paymentTotal - summary.paymentAmount
  const editItem = (index, patch) => setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))

  const persist = async (next, index, okMessage) => {
    setSavingIndex(index)
    try {
      const changes = paymentSummary(next)
      await updateServiceRequestPayment(request.id, changes)
      setItems(next)
      onUpdated?.(request.id, changes)
      notify(okMessage, 'success')
    } catch (e) {
      notify("Le paiement n'a pas pu être enregistré", 'error')
    } finally {
      setSavingIndex(null)
    }
  }

  const markPaid = (index) => {
    const item = items[index]
    if (!(Number(item.amount) > 0) || !item.method) {
      notify('Indiquez le montant et le mode de paiement', 'error')
      return
    }
    const next = items.map((it, i) => (i === index ? { ...it, paid: true, paidOn: it.paidOn || todayInput() } : it))
    persist(next, index, 'Versement enregistré : envoyez le reçu au client')
  }
  const cancelPaid = (index) => {
    const next = items.map((it, i) => (i === index ? { ...it, paid: false, paidOn: '' } : it))
    persist(next, index, 'Versement remis « à encaisser »')
  }

  const termsHref = whatsappUrl(request.phone, termsMessage(request, items))
  const field = 'h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none disabled:bg-gray-50'
  const waButton = 'inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50'

  return (
    <ModalSection title="Paiement">
      {/* Résumé : total, encaissé, reste */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span className="text-gray-500">Total <strong className="text-gray-900">{gnf(summary.paymentTotal)}</strong></span>
          <span className="text-gray-500">Encaissé <strong className="text-emerald-700">{gnf(summary.paymentAmount)}</strong></span>
          {remaining > 0 && <span className="text-gray-500">Reste <strong className="text-gray-900">{gnf(remaining)}</strong></span>}
        </div>
        {paymentPill({ ...request, paymentStatus: summary.paymentStatus })}
      </div>

      {termsHref && (
        <a href={termsHref} target="_blank" rel="noopener noreferrer" className={`${waButton} mb-3`}>
          <RiWhatsappLine className="h-4 w-4 text-[#25D366]" />
          Envoyer les modalités de paiement
        </a>
      )}

      <ol className="space-y-2.5">
        {items.map((item, index) => {
          const saving = savingIndex === index
          const receiptHref = item.paid ? whatsappUrl(request.phone, receiptMessage(request, items, index)) : null
          return (
            <li key={item.key || index} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">
                  {items.length > 1 ? `${index + 1}. ` : ''}{item.label}
                </p>
                {item.paid ? <StatusPill tone="success">Payé</StatusPill> : <StatusPill tone="warning">À encaisser</StatusPill>}
              </div>

              {item.paid ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-gray-600">
                    <strong className="text-gray-900">{gnf(item.amount)}</strong> reçus le {readableDate(item.paidOn)} · {item.method}
                    <span className="text-gray-400"> · Reçu {receiptNumber(request, index)}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {receiptHref && (
                      <a href={receiptHref} target="_blank" rel="noopener noreferrer" className={waButton}>
                        <RiWhatsappLine className="h-4 w-4 text-[#25D366]" />
                        Envoyer le reçu
                      </a>
                    )}
                    {canProcess && (
                      <button type="button" onClick={() => cancelPaid(index)} disabled={saving} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-60">
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold text-gray-500">Montant (GNF)</span>
                    <input
                      inputMode="numeric"
                      value={Number(item.amount) ? Number(item.amount).toLocaleString('fr-FR') : ''}
                      onChange={(e) => editItem(index, { amount: Number(e.target.value.replace(/\D/g, '').slice(0, 9)) || 0 })}
                      disabled={!canProcess || saving}
                      className={field}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold text-gray-500">Mode</span>
                    <select value={item.method || ''} onChange={(e) => editItem(index, { method: e.target.value })} disabled={!canProcess || saving} className={field}>
                      <option value="">Choisir…</option>
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold text-gray-500">Date</span>
                    <input type="date" value={item.paidOn || ''} onChange={(e) => editItem(index, { paidOn: e.target.value })} disabled={!canProcess || saving} className={field} />
                  </label>
                  {canProcess && (
                    <button
                      type="button"
                      onClick={() => markPaid(index)}
                      disabled={saving}
                      className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Marquer payé
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <p className="mt-2 text-[11px] text-gray-500">
        Rien n'est payé en ligne : notez chaque versement reçu, puis envoyez le reçu au client sur WhatsApp.
      </p>
    </ModalSection>
  )
}

const PROPERTY_TYPE_LABELS = {
  apartment: 'Appartement',
  house: 'Maison',
  villa: 'Villa',
  studio: 'Studio',
  duplex: 'Duplex',
  commercial: 'Local commercial',
  land: 'Terrain',
  daily: 'Séjour à la nuitée',
}

const propertyTypesLabel = (request) => {
  if (Array.isArray(request.propertyTypes) && request.propertyTypes.length) {
    return request.propertyTypes
      .map((type) => PROPERTY_TYPE_LABELS[type] || type)
      .join(', ')
  }
  return request.propertyType || 'Tous types'
}

const locationsLabel = (request) =>
  Array.isArray(request.preferredLocations) && request.preferredLocations.length
    ? request.preferredLocations.join(', ')
    : request.address || null

const budgetLabel = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0
    ? `${amount.toLocaleString('fr-FR')} GNF`
    : null
}

const firstNameOf = (name) => String(name || '').trim().split(/\s+/)[0]

/**
 * Premier message WhatsApp au client : reprend sa demande pour qu'il la
 * reconnaisse, puis la suite selon la formule (gratuite ou payante).
 * Signé du prénom du conseiller connecté (on répond plus volontiers à une
 * personne) ; sans nom renseigné, « l'équipe BâtiMoo ».
 */
const whatsappMessage = (request, senderName) => {
  const firstName = firstNameOf(request.name)
  const sender = firstNameOf(senderName)
  const criteria = [
    searchTypeLabel(request.searchType),
    propertyTypesLabel(request),
    request.bedrooms ? `${request.bedrooms} chambre${Number(request.bedrooms) > 1 ? 's' : ''} minimum` : null,
    locationsLabel(request) ? `à ${locationsLabel(request)}` : null,
    budgetLabel(request.maxPrice) ? `budget max ${budgetLabel(request.maxPrice)}` : null,
  ].filter(Boolean)

  const lines = [
    `Bonjour${firstName ? ` ${firstName}` : ''}, ${sender ? `je suis ${sender}, de l'équipe BâtiMoo.` : "ici l'équipe BâtiMoo."}`,
    '',
    `Nous avons bien reçu votre recherche : ${criteria.join(' · ')}.`,
    '',
  ]
  if (isPaidSearch(request)) {
    const level = request.serviceLevelLabel || serviceLevelLabel(request).split(' · ')[0]
    lines.push(
      `Vous avez choisi la formule « ${level} »${request.servicePrice ? ` (${request.servicePrice})` : ''}. ${sender ? 'Je m\'occupe personnellement de votre recherche.' : 'Un conseiller va s\'occuper de votre recherche.'}`,
      'Avant de commencer, nous vous confirmons le montant et le mode de paiement (Orange Money, MTN Mobile Money ou espèces).',
      '',
      'Êtes-vous disponible pour un court appel ?'
    )
  } else {
    lines.push(
      'Nous vous envoyons ici les biens qui correspondent dès que nous en trouvons.',
      '',
      "Avez-vous d'autres précisions (quartier exact, date d'emménagement) ?"
    )
  }
  if (sender) lines.push('', 'Merci de votre confiance.')
  else lines.push('', 'Merci de votre confiance,', "L'équipe BâtiMoo")
  return lines.join('\n')
}

/**
 * Le site recopie tous les critères dans `description` (formule, projet,
 * types…), déjà affichés au-dessus : on ne garde que les précisions écrites
 * par le client. Ancienne demande sans critères structurés : texte complet.
 */
const clientNotes = (request) => {
  const text = String(request.description || '').trim()
  if (!text) return null
  const structured = Array.isArray(request.propertyTypes) || request.serviceLevel
  if (!structured) return text
  const notes = text.split('\n').find((line) => /^(Précisions|Notes)\s*:/.test(line))
  return notes ? notes.replace(/^(Précisions|Notes)\s*:\s*/, '') : null
}

const columns = [
  {
    header: 'Formule',
    render: (request) => (
      <span className="flex flex-col items-start gap-1">
        <span>{serviceLevelLabel(request)}</span>
        {paymentPill(request)}
      </span>
    ),
  },
  {
    header: 'Projet',
    render: (request) => searchTypeLabel(request.searchType),
  },
  {
    header: 'Bien recherché',
    render: propertyTypesLabel,
  },
  {
    header: 'Budget maximum',
    mono: true,
    render: (request) => budgetLabel(request.maxPrice),
  },
]

const detailFields = [
  { label: 'Formule', render: serviceLevelLabel },
  { label: 'Projet', render: (request) => searchTypeLabel(request.searchType) },
  { label: 'Types de bien', render: propertyTypesLabel },
  {
    label: 'Chambres minimum',
    render: (request) => (request.bedrooms ? `${request.bedrooms}+` : null),
  },
  { label: 'Zones souhaitées', render: locationsLabel },
  {
    label: 'Budget maximum',
    render: (request) => budgetLabel(request.maxPrice),
  },
  { label: 'Précisions du client', render: (request) => clientNotes(request), long: true },
]

export default function PropertySearchTab() {
  const AuthUser = useUser()
  const fetchRequests = useCallback(
    () => getServiceRequestsByCategory('recherche-bien'),
    []
  )

  return (
    <ServiceRequestsPanel
      title="Recherche immobilière"
      description="Demandes d'achat et de location envoyées depuis le site public"
      fetchRequests={fetchRequests}
      updateStatus={updateServiceRequestStatus}
      deleteRequest={deleteServiceRequest}
      renderDetailExtra={(request, onUpdated) => <PaymentSection request={request} onUpdated={onUpdated} />}
      whatsappMessage={(request) => whatsappMessage(request, AuthUser?.displayName)}
      columns={columns}
      detailFields={detailFields}
      searchFn={(request, lower) =>
        [
          request.searchType,
          serviceLevelLabel(request),
          request.propertyType,
          ...(Array.isArray(request.propertyTypes)
            ? request.propertyTypes
            : []),
          locationsLabel(request),
          request.description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(lower)
      }
      searchPlaceholder="Rechercher par projet, bien, zone, critères..."
    />
  )
}
