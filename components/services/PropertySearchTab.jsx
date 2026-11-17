import { useCallback, useEffect, useState } from 'react'
import { useUser } from 'next-firebase-auth'
import ServiceRequestsPanel from './ServiceRequestsPanel'
import {
  deleteServiceRequest,
  getServiceRequestsByCategory,
  updateServiceRequestPayment,
  updateServiceRequestStatus,
} from '@/lib/services/serviceRequests'
import { ModalSection } from '@/components/ui/AdminModal'
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

// Formules payantes : montant de départ proposé dans la fiche
const PAID_LEVELS = { assisted: 50000, full: 100000 }
const isPaidSearch = (request) => Boolean(PAID_LEVELS[request.serviceLevel])

const PAYMENT_METHODS = ['Espèces', 'Orange Money', 'MTN Mobile Money', 'Virement bancaire']

const paymentPill = (request) =>
  isPaidSearch(request) ? (
    request.paymentStatus === 'paid' ? (
      <StatusPill tone="success">Payé</StatusPill>
    ) : (
      <StatusPill tone="warning">À encaisser</StatusPill>
    )
  ) : null

const todayInput = () => new Date().toISOString().slice(0, 10)

/** Paiement noté à la main (formules payantes uniquement) : rien n'est payé en ligne. */
function PaymentSection({ request, onUpdated }) {
  const canProcess = useCanManage('services', 'process')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')
  const [paidOn, setPaidOn] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setAmount(String(request.paymentAmount || PAID_LEVELS[request.serviceLevel] || ''))
    setMethod(request.paymentMethod || '')
    setPaidOn(request.paidOn || '')
  }, [request.id, request.paymentAmount, request.paymentMethod, request.paidOn, request.serviceLevel])

  if (!isPaidSearch(request)) return null
  const paid = request.paymentStatus === 'paid'
  const amountNumber = Number(String(amount).replace(/\D/g, ''))

  const save = async (status) => {
    if (!canProcess) return
    if (status === 'paid' && (!amountNumber || !method)) {
      notify('Indiquez le montant et le mode de paiement', 'error')
      return
    }
    const changes = {
      paymentStatus: status,
      paymentAmount: amountNumber || null,
      paymentMethod: method || null,
      paidOn: status === 'paid' ? paidOn || todayInput() : null,
    }
    setSaving(true)
    try {
      await updateServiceRequestPayment(request.id, changes)
      onUpdated?.(request.id, changes)
      notify(status === 'paid' ? 'Paiement enregistré' : 'Paiement remis « à encaisser »', 'success')
    } catch (e) {
      notify("Le paiement n'a pas pu être enregistré", 'error')
    } finally {
      setSaving(false)
    }
  }

  const field = 'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none disabled:bg-gray-50'

  return (
    <ModalSection title="Paiement">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          Formule {request.serviceLevelLabel || ''} · {request.servicePrice || ''}. Rien n'est payé en ligne : notez ici l'encaissement.
        </p>
        {paymentPill(request)}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-gray-600">Montant (GNF)</span>
          <input
            inputMode="numeric"
            value={amountNumber ? amountNumber.toLocaleString('fr-FR') : ''}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 9))}
            disabled={!canProcess || saving}
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-gray-600">Mode de paiement</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)} disabled={!canProcess || saving} className={field}>
            <option value="">Choisir…</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-gray-600">Date du paiement</span>
          <input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} disabled={!canProcess || saving} className={field} />
        </label>
      </div>
      {canProcess && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => save('paid')}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {paid ? 'Mettre à jour le paiement' : 'Marquer comme payé'}
          </button>
          {paid && (
            <button
              type="button"
              onClick={() => save('pending')}
              disabled={saving}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Remettre « à encaisser »
            </button>
          )}
        </div>
      )}
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
  { label: 'Critères et précisions', accessor: 'description' },
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
