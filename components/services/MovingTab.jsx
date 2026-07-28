import { useCallback } from 'react'
import ServiceRequestsPanel from './ServiceRequestsPanel'
import { getMovingRequests, updateMovingRequestStatus } from '@/lib/services/movingRequests'

const columns = [
  {
    header: 'Trajet',
    render: (r) => (r.departure || r.arrival ? `${r.departure || '—'} → ${r.arrival || '—'}` : null),
  },
  {
    header: 'Date prévue',
    render: (r) => r.movingDate || null,
  },
]

const detailFields = [
  { label: 'Départ', accessor: 'departure' },
  { label: 'Arrivée', accessor: 'arrival' },
  { label: 'Date de déménagement', accessor: 'movingDate' },
  { label: 'Offre sélectionnée', accessor: 'selectedPackage' },
  { label: 'Notes', accessor: 'notes' },
]

export default function MovingTab() {
  const fetchRequests = useCallback(() => getMovingRequests(), [])

  return (
    <ServiceRequestsPanel
      description="Demandes envoyées depuis le formulaire de déménagement du site public"
      fetchRequests={fetchRequests}
      updateStatus={updateMovingRequestStatus}
      columns={columns}
      detailFields={detailFields}
      searchFn={(r, lower) =>
        r.departure?.toLowerCase().includes(lower) || r.arrival?.toLowerCase().includes(lower)
      }
      searchPlaceholder="Rechercher par nom, téléphone, ville..."
    />
  )
}
