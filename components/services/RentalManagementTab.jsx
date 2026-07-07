import { useCallback } from 'react'
import ServiceRequestsPanel from './ServiceRequestsPanel'
import {
  getRentalManagementRequests,
  updateRentalManagementRequestStatus,
} from '@/lib/services/rentalManagementRequests'

const columns = [
  {
    header: 'Bien',
    render: (r) => r.propertyType || null,
  },
  {
    header: 'Loyer mensuel',
    render: (r) => (r.monthlyRent ? `${r.monthlyRent} GNF` : null),
  },
]

const detailFields = [
  { label: 'Adresse du bien', accessor: 'propertyAddress' },
  { label: 'Type de bien', accessor: 'propertyType' },
  { label: 'Nombre de pièces', accessor: 'rooms' },
  { label: 'Loyer mensuel', render: (r) => (r.monthlyRent ? `${r.monthlyRent} GNF` : null) },
  { label: 'Offre sélectionnée', accessor: 'selectedPackage' },
  { label: 'Notes', accessor: 'notes' },
]

export default function RentalManagementTab() {
  const fetchRequests = useCallback(() => getRentalManagementRequests(), [])

  return (
    <ServiceRequestsPanel
      description="Demandes envoyées depuis le formulaire de gestion locative du site public"
      fetchRequests={fetchRequests}
      updateStatus={updateRentalManagementRequestStatus}
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
