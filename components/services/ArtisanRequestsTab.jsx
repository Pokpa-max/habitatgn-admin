import { useCallback } from 'react'
import ServiceRequestsPanel from './ServiceRequestsPanel'
import { getArtisanServiceRequests, updateServiceRequestStatus } from '@/lib/services/serviceRequests'

const columns = [
  {
    header: 'Service',
    render: (r) => r.serviceType || null,
  },
  {
    header: 'Créneau',
    mono: true,
    render: (r) =>
      r.scheduledDate ? `${r.scheduledDate}${r.scheduledTime ? ' · ' + r.scheduledTime : ''}` : null,
  },
]

const detailFields = [
  { label: 'Service demandé', accessor: 'serviceType' },
  { label: 'Adresse', accessor: 'address' },
  { label: 'Date souhaitée', accessor: 'scheduledDate' },
  { label: 'Créneau', accessor: 'scheduledTime' },
  { label: 'Description', accessor: 'description' },
]

export default function ArtisanRequestsTab() {
  const fetchRequests = useCallback(() => getArtisanServiceRequests(), [])

  return (
    <ServiceRequestsPanel
      description="Demandes d'artisan (plomberie, électricité...) ou d'intervention ponctuelle envoyées depuis le site public"
      fetchRequests={fetchRequests}
      updateStatus={updateServiceRequestStatus}
      columns={columns}
      detailFields={detailFields}
      searchFn={(r, lower) =>
        r.serviceType?.toLowerCase().includes(lower) || r.address?.toLowerCase().includes(lower)
      }
      searchPlaceholder="Rechercher par nom, téléphone, service..."
    />
  )
}
