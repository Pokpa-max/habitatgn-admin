import { useCallback } from 'react'
import ServiceRequestsPanel from './ServiceRequestsPanel'
import { getServiceRequestsByCategory, updateServiceRequestStatus } from '@/lib/services/serviceRequests'

const columns = [
  {
    header: 'Bien',
    render: (r) => r.propertyType || null,
  },
  {
    header: 'Loyer mensuel',
    mono: true,
    render: (r) => (r.monthlyRent ? `${r.monthlyRent} GNF` : null),
  },
]

const detailFields = [
  { label: 'Adresse du bien', accessor: 'propertyAddress' },
  { label: 'Type de bien', accessor: 'propertyType' },
  { label: 'Nombre de pièces', accessor: 'rooms' },
  { label: 'Loyer mensuel', render: (r) => (r.monthlyRent ? `${r.monthlyRent} GNF` : null) },
  { label: 'Description', accessor: 'description' },
]

export default function RentalManagementTab() {
  const fetchRequests = useCallback(() => getServiceRequestsByCategory('gestion-locative'), [])

  return (
    <ServiceRequestsPanel
      description="Demandes envoyées depuis le formulaire de gestion locative du site public"
      fetchRequests={fetchRequests}
      updateStatus={updateServiceRequestStatus}
      columns={columns}
      detailFields={detailFields}
      searchFn={(r, lower) =>
        r.propertyAddress?.toLowerCase().includes(lower) ||
        r.propertyType?.toLowerCase().includes(lower)
      }
      searchPlaceholder="Rechercher par nom, téléphone, bien..."
    />
  )
}
