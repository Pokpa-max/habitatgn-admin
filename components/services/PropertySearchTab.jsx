import { useCallback } from 'react'
import ServiceRequestsPanel from './ServiceRequestsPanel'
import {
  getServiceRequestsByCategory,
  updateServiceRequestStatus,
} from '@/lib/services/serviceRequests'

const searchTypeLabel = (value) => {
  if (value === 'buy') return 'Achat'
  if (value === 'rent') return 'Location'
  return null
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
      columns={columns}
      detailFields={detailFields}
      searchFn={(request, lower) =>
        [
          request.searchType,
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
