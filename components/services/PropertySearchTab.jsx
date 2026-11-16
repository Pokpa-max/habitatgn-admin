import { useCallback } from 'react'
import ServiceRequestsPanel from './ServiceRequestsPanel'
import {
  deleteServiceRequest,
  getServiceRequestsByCategory,
  updateServiceRequestStatus,
} from '@/lib/services/serviceRequests'

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

const columns = [
  {
    header: 'Formule',
    render: serviceLevelLabel,
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
