import { useCallback } from 'react'
import ServiceRequestsPanel from './ServiceRequestsPanel'
import {
  getLegalSecurityRequests,
  updateLegalSecurityRequestStatus,
} from '@/lib/services/legalSecurityRequests'

const columns = [
  {
    header: 'Offre demandée',
    render: (r) => r.serviceType || null,
  },
  {
    header: 'Adresse du bien',
    render: (r) => r.propertyAddress || null,
  },
]

const detailFields = [
  { label: 'Offre demandée', accessor: 'serviceType' },
  { label: 'Adresse du bien', accessor: 'propertyAddress' },
  { label: 'Email', accessor: 'email' },
  { label: 'Notes', accessor: 'notes' },
]

export default function LegalSecurityTab() {
  const fetchRequests = useCallback(() => getLegalSecurityRequests(), [])

  return (
    <ServiceRequestsPanel
      description="Demandes envoyées depuis le formulaire de sécurisation foncière du site public"
      fetchRequests={fetchRequests}
      updateStatus={updateLegalSecurityRequestStatus}
      columns={columns}
      detailFields={detailFields}
      searchFn={(r, lower) =>
        r.serviceType?.toLowerCase().includes(lower) ||
        r.propertyAddress?.toLowerCase().includes(lower) ||
        r.email?.toLowerCase().includes(lower)
      }
      searchPlaceholder="Rechercher par nom, téléphone, offre..."
    />
  )
}
