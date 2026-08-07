import { useCallback } from 'react'
import ServiceRequestsPanel from './ServiceRequestsPanel'
import { getServiceRequestsByCategory, updateServiceRequestStatus } from '@/lib/services/serviceRequests'

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
  { label: 'Étage & accès départ', accessor: 'floorAccessDeparture' },
  { label: 'Étage & accès arrivée', accessor: 'floorAccessArrival' },
  { label: 'Date de déménagement', accessor: 'movingDate' },
  { label: 'Nombre de pièces', accessor: 'rooms' },
  { label: 'Objets fragiles à signaler', render: (r) => (r.fragileItems ? 'Oui' : null) },
  { label: 'Description', accessor: 'description' },
]

export default function MovingTab() {
  const fetchRequests = useCallback(() => getServiceRequestsByCategory('demenagement'), [])

  return (
    <ServiceRequestsPanel
      description="Demandes envoyées depuis le formulaire de déménagement du site public"
      fetchRequests={fetchRequests}
      updateStatus={updateServiceRequestStatus}
      columns={columns}
      detailFields={detailFields}
      searchFn={(r, lower) =>
        r.departure?.toLowerCase().includes(lower) || r.arrival?.toLowerCase().includes(lower)
      }
      searchPlaceholder="Rechercher par nom, téléphone, ville..."
    />
  )
}
