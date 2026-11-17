import { useCallback, useEffect, useState } from 'react'
import { useUser } from 'next-firebase-auth'
import ServiceRequestsPanel from './ServiceRequestsPanel'
import NewSearchRequestModal from './NewSearchRequestModal'
import SearchMatchesSection from './SearchMatchesSection'
import {
  deleteServiceRequest,
  getServiceRequestsByCategory,
  updateServiceRequest,
  updateServiceRequestPayment,
  updateServiceRequestStatus,
} from '@/lib/services/serviceRequests'
import { ModalSection, whatsappUrl } from '@/components/ui/AdminModal'
import { RiWhatsappLine } from 'react-icons/ri'
import StatusPill from '@/components/ui/StatusPill'
import { useCanManage } from '@/hooks/useCanManage'
import { useColors } from '@/contexts/ColorContext'
import { bedroomsText, wantedFeaturesText } from '@/lib/constants/searchRequest'
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
const DEPOSIT_NUMBER = '628610357'
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
  // Neutre : le jaune reste réservé au statut de la demande (« En attente »)
  return <StatusPill tone="gray">À encaisser</StatusPill>
}

const todayInput = () => new Date().toISOString().slice(0, 10)
const readableDate = (value) => {
  const date = new Date(`${value || todayInput()}T12:00:00`)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
const levelName = (request) => request.serviceLevelLabel || serviceLevelLabel(request).split(' · ')[0]

/** Reçu d'un versement : numéro, montant, mode, total réglé et reste à payer. */
const receiptNumber = (request, index) => `BM-${String(request.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}-${index + 1}`
const receiptMessage = (request, installments, index) => {
  const item = installments[index]
  const { paymentTotal } = paymentSummary(installments)
  // Réglé jusqu'à ce versement inclus (un reçu renvoyé plus tard reste exact)
  const paidSoFar = installments
    .slice(0, index + 1)
    .filter((it) => it.paid)
    .reduce((sum, it) => sum + (Number(it.amount) || 0), 0)
  const remaining = Math.max(0, paymentTotal - paidSoFar)
  return [
    '*REÇU DE PAIEMENT*',
    `N° ${receiptNumber(request, index)} · ${readableDate(item.paidOn)}`,
    '',
    `Client : ${request.name || '—'}`,
    `Formule : ${levelName(request)} (${gnf(paymentTotal)})`,
    `Objet : ${item.label}`,
    `Mode de paiement : ${item.method || '—'}`,
    '',
    `*Montant reçu : ${gnf(item.amount)}*`,
    `Total réglé : ${gnf(paidSoFar)}`,
    remaining > 0 ? `Reste à payer : ${gnf(remaining)}` : 'Solde : formule entièrement réglée',
    '',
    'Nous vous remercions pour votre règlement.',
    '',
    `*${SIGNATURE[0]}*`,
    `_${SIGNATURE[1]}_`,
  ].join('\n')
}

/** Note interne du dossier (non visible du client) : où en est la recherche. */
function NotesSection({ request, onUpdated }) {
  const canProcess = useCanManage('services', 'process')
  const [text, setText] = useState(request.internalNotes || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setText(request.internalNotes || '')
  }, [request.id, request.internalNotes])

  const changed = text.trim() !== String(request.internalNotes || '').trim()
  const save = async () => {
    setSaving(true)
    try {
      const changes = { internalNotes: text.trim(), internalNotesUpdatedAt: new Date().toISOString() }
      await updateServiceRequest(request.id, changes)
      onUpdated?.(request.id, changes)
      notify('Note enregistrée', 'success')
    } catch (e) {
      notify("La note n'a pas pu être enregistrée", 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalSection title="Note interne">
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 1500))}
        disabled={!canProcess || saving}
        placeholder="Ex. Appelé le 18/11 : préfère Kipé, près de la route. Rappeler vendredi."
        className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none disabled:bg-gray-50"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[11px] text-gray-500">
          Visible uniquement par l&apos;équipe
          {request.internalNotesUpdatedAt ? ` · modifiée le ${readableDate(String(request.internalNotesUpdatedAt).slice(0, 10))}` : ''}
        </p>
        {canProcess && (
          <button
            type="button"
            onClick={save}
            disabled={!changed || saving}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer la note'}
          </button>
        )}
      </div>
    </ModalSection>
  )
}

/** Fiche : versements prévus, encaissement de chacun, messages WhatsApp (modalités, reçus). */
function PaymentSection({ request, onUpdated }) {
  const colors = useColors()
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

  const field = 'h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none disabled:bg-gray-50'
  // Sobre : bouton blanc, seule l'icône rappelle WhatsApp
  const waButton = 'inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50'
  const waStyle = undefined
  const waIcon = { color: colors.whatsapp }

  return (
    <ModalSection title="Paiement">
      {/* Résumé : total, encaissé, reste */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span className="text-gray-500">Total <strong className="text-gray-900">{gnf(summary.paymentTotal)}</strong></span>
          <span className="text-gray-500">Encaissé <strong className="text-gray-900">{gnf(summary.paymentAmount)}</strong></span>
          {remaining > 0 && <span className="text-gray-500">Reste <strong className="text-gray-900">{gnf(remaining)}</strong></span>}
        </div>
        {paymentPill({ ...request, paymentStatus: summary.paymentStatus })}
      </div>

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
                {/* Une seule pastille « À encaisser » (dans le résumé) : ici seulement « Payé » */}
                {item.paid && <StatusPill tone="success">Payé</StatusPill>}
              </div>

              {item.paid ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-gray-600">
                    <strong className="text-gray-900">{gnf(item.amount)}</strong> reçus le {readableDate(item.paidOn)} · {item.method}
                    <span className="text-gray-400"> · Reçu {receiptNumber(request, index)}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {receiptHref && (
                      <a href={receiptHref} target="_blank" rel="noopener noreferrer" className={waButton} style={waStyle}>
                        <RiWhatsappLine className="h-4 w-4" style={waIcon} />
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
                      className="h-9 rounded-lg px-3 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: colors.primary }}
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
const clientNameOf = (name) => String(name || '').trim().replace(/\s+/g, ' ').slice(0, 50)

/**
 * Premier message WhatsApp au client : reprend sa demande pour qu'il la
 * reconnaisse, puis la suite selon la formule (gratuite ou payante).
 * Signé du prénom du conseiller connecté (on répond plus volontiers à une
 * personne) ; sans nom renseigné, « l'équipe BâtiMoo ».
 */
const whatsappMessage = (request, senderName) => {
  const name = clientNameOf(request.name)
  // Compte au nom générique (« BâtiMoo Admin »…) : pas un prénom
  const senderFirst = firstNameOf(senderName)
  const sender = /^(b[aâ]ti ?moo|admin|administrateur|manager|équipe|equipe|service)$/i.test(senderFirst) ? '' : senderFirst
  const paid = isPaidSearch(request)

  // Tout est déjà détaillé sur le site : un message court, réception + suite
  const lines = [
    `Bonjour${name ? ` ${name}` : ''},`,
    '',
    `Merci pour votre confiance. Nous avons bien reçu votre demande de recherche${paid ? ` (formule *${levelName(request)}*)` : ''}.`,
    '',
  ]
  if (paid) {
    const items = installmentsOf(request)
    const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    lines.push(`*Tarif : ${gnf(total)}*`)
    if (items.length > 1) {
      items.forEach((item, index) => {
        const when = item.terms || PAYMENT_PLANS[request.serviceLevel]?.find((plan) => plan.key === item.key)?.terms || item.label.toLowerCase()
        lines.push(`• ${gnf(item.amount)} ${when}${index === items.length - 1 ? '.' : ' ;'}`)
      })
    }
    lines.push(
      '',
      `Pour lancer votre recherche, effectuez ${items.length > 1 ? 'le premier versement' : 'le paiement'} au numéro de dépôt *${DEPOSIT_NUMBER}*, puis envoyez-nous la capture du dépôt ici.`,
      '',
      `Dès réception, ${sender ? 'je commence' : 'votre conseiller commence'} la recherche : premières propositions sous *${FIRST_RESULTS_DELAY}*.`
    )
  } else {
    lines.push('Nous commençons la recherche dès maintenant et vous enverrons ici les biens correspondant à vos critères.')
  }
  lines.push(
    '',
    'Cordialement,',
    sender ? `${sender} · *${SIGNATURE[0]}*` : `*${SIGNATURE[0]}*`,
    `_${SIGNATURE[1]}_`
  )
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
  { label: 'Chambres', render: bedroomsText },
  { label: 'Souhaits', render: wantedFeaturesText },
  { label: 'Zones souhaitées', render: locationsLabel },
  {
    label: 'Budget maximum',
    render: (request) => budgetLabel(request.maxPrice),
  },
  { label: 'Précisions du client', render: (request) => clientNotes(request), long: true },
  {
    label: 'Origine',
    render: (request) =>
      request.source === 'admin'
        ? `${request.channel || 'Saisie par l’équipe'}${request.createdByName ? ` · saisie par ${request.createdByName}` : ''}`
        : 'Formulaire du site',
  },
]

export default function PropertySearchTab() {
  const AuthUser = useUser()
  const canProcess = useCanManage('services', 'process')
  const fetchRequests = useCallback(
    () => getServiceRequestsByCategory('recherche-bien'),
    []
  )

  return (
    <ServiceRequestsPanel
      title="Recherche immobilière"
      description="Demandes d'achat et de location reçues sur le site ou par téléphone"
      fetchRequests={fetchRequests}
      updateStatus={updateServiceRequestStatus}
      deleteRequest={deleteServiceRequest}
      // Ordre du traitement : paiement (formules payantes), biens à proposer, note du dossier
      renderDetailExtra={(request, onUpdated) => (
        <>
          <PaymentSection request={request} onUpdated={onUpdated} />
          <SearchMatchesSection request={request} onUpdated={onUpdated} />
          <NotesSection request={request} onUpdated={onUpdated} />
        </>
      )}
      whatsappMessage={(request) => whatsappMessage(request, AuthUser?.displayName)}
      headerAction={canProcess ? (onCreated) => <NewSearchRequestModal onCreated={onCreated} /> : undefined}
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
