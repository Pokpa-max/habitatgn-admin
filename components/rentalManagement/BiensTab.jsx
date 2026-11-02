import { useEffect, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiHome4Line,
  RiArrowRightSLine,
  RiEyeLine,
  RiEyeOffLine,
  RiMore2Fill,
  RiShieldCheckLine,
  RiRocketLine,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import { formatGNF } from '@/utils/format'
import { firebaseDateFormat } from '@/utils/date'
import Loader from '@/components/Loader'
import StatusPill from '@/components/ui/StatusPill'
import SimpleDrawer from '@/components/SimpleDrawer'
import PaginationButton from '@/components/Orders/PaginationButton'
import PropertyDrawerForm from './PropertyDrawerForm'
import {
  getManagedProperties,
  getPropertiesByOwner,
  editManagedProperty,
  deleteManagedProperty,
} from '@/lib/services/managedProperties'
import { getPropertyOwners } from '@/lib/services/propertyOwners'
import { getLeasesByProperty } from '@/lib/services/leases'
import { getPaymentsByProperty } from '@/lib/services/rentPayments'
import { getTicketsByProperty } from '@/lib/services/maintenanceTickets'
import { getExpensesByProperty } from '@/lib/services/propertyExpenses'
import { updateProperty } from '@/lib/services/propertyService'
import { isListingOnline, notifyFavoritesOfChange, notifySiteUser } from '@/lib/services/accountNotifications'
import { useCanManage } from '@/hooks/useCanManage'

const STATUS_CONFIG = {
  vacant: { label: 'Vacant', tone: 'warning' },
  occupied: { label: 'Occupé', tone: 'success' },
  inactive: { label: 'Inactif', tone: 'gray' },
}

const PAGE_SIZE = 10

const DETAIL_LABELS = {
  bedrooms: 'Chambres',
  bathrooms: 'Salles de bain',
  floor: 'Étage',
  condition: 'État du bien',
  furnished: 'Meublé',
  livingRooms: 'Salons',
  selfContainedRooms: 'Chambres autonomes',
  externalBathrooms: 'Douches extérieures',
  kitchens: 'Cuisines',
  maxGuests: 'Voyageurs maximum',
  maxGuestsCount: 'Voyageurs maximum',
  totalParcels: 'Nombre de parcelles',
  parcelCount: 'Nombre de parcelles',
  availableParcels: 'Parcelles disponibles',
  areaPerParcel: 'Surface par parcelle',
  parcelArea: 'Surface par parcelle',
  pricePerParcel: 'Prix par parcelle',
  hasLandTitle: 'Titre foncier',
  landTitle: 'Titre foncier',
  negotiable: 'Prix négociable',
  deposit: 'Caution',
  depositMonths: 'Mois de caution',
  advanceMonths: "Mois d'avance",
  agencyFeeMonths: "Mois de frais d'agence",
  agencyFeePercent: "Frais d'agence",
  notaryFeePercent: 'Frais de notaire',
  minStay: 'Séjour minimum (nuits)',
  maxStay: 'Séjour maximum (nuits)',
  checkInHour: "Heure d'arrivée",
  checkOutHour: 'Heure de départ',
  rating: 'Note moyenne',
  reviews: "Nombre d'avis",
  weekly: 'Tarif semaine',
  monthly: 'Tarif mois',
  agencyName: "Nom de l'agence",
  whatsapp: 'WhatsApp',
  phone: 'Téléphone',
  name: 'Nom du contact',
  municipality: 'Commune',
  neighborhood: 'Quartier',
  landmark: 'Repère',
  region: 'Région',
}

const formatDetailLabel = (key) =>
  DETAIL_LABELS[key] ||
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase())

const formatDetailValue = (value) => {
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (Array.isArray(value)) {
    return value.map((item) => formatDetailValue(item)).filter(Boolean).join(', ')
  }
  if (value && typeof value === 'object') {
    if (value.label || value.name || value.value) {
      return value.label || value.name || formatDetailValue(value.value)
    }
    return Object.entries(value)
      .filter(([, item]) => item !== undefined && item !== null && item !== '')
      .map(([key, item]) => `${formatDetailLabel(key)} : ${formatDetailValue(item)}`)
      .join(' · ')
  }
  return value === undefined || value === null || value === '' ? '' : String(value)
}

function DetailFields({ fields }) {
  const visibleFields = fields.filter((field) => field.value !== undefined && field.value !== null && field.value !== '')
  if (!visibleFields.length) return null

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {visibleFields.map(({ label, value }) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-gray-500">{label}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-gray-900">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function DetailSection({ title, children }) {
  if (!children) return null
  return (
    <section className="border-t border-gray-100 pt-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">{title}</h3>
      {children}
    </section>
  )
}

// Si ownerId est fourni, la liste est restreinte aux biens de ce propriétaire
// et le formulaire d'ajout/édition lui verrouille automatiquement le propriétaire.
export default function BiensTab({ ownerId, onPropertiesChange }) {
  const colors = useColors()
  const canProcess = useCanManage('properties', 'process')
  const canDelete = useCanManage('properties', 'delete')
  const [properties, setProperties] = useState([])
  const [owners, setOwners] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detailProperty, setDetailProperty] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkActing, setBulkActing] = useState(false)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [propertiesData, ownersData] = await Promise.all([
          ownerId ? getPropertiesByOwner(ownerId) : getManagedProperties(),
          ownerId ? Promise.resolve([]) : getPropertyOwners(),
        ])
        setProperties(propertiesData)
        setOwners(ownersData)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [ownerId])

  useEffect(() => {
    onPropertiesChange?.(properties)
  }, [properties]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuOpenId) return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        !target.closest('[data-menu-root]')
      ) {
        setMenuOpenId(null)
        setMenuAnchor(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

  const ownerById = (id) => owners.find((o) => o.id === id)

  const openAdd = () => {
    if (!canProcess) return
    setSelected(null)
    setDrawerOpen(true)
  }

  const openEdit = (property) => {
    if (!canProcess) return
    setDetailProperty(null)
    setSelected(property)
    setDrawerOpen(true)
  }

  const openDetail = (property) => {
    setDeleteConfirm(null)
    setDetailProperty(property)
  }

  const openMenu = (event, propertyId) => {
    event.stopPropagation()
    if (menuOpenId === propertyId) {
      setMenuOpenId(null)
      setMenuAnchor(null)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const left = Math.max(
      16,
      Math.min(rect.right - 224, window.innerWidth - 240 - 16)
    )
    const top = Math.min(rect.bottom + 8, window.innerHeight - 220 - 16)

    setMenuOpenId(propertyId)
    setMenuAnchor({ left, top })
  }

  const handleSaved = (saved) => {
    setProperties((prev) => {
      const exists = prev.some((p) => p.id === saved.id)
      return exists
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [saved, ...prev]
    })
  }

  const handleOwnerCreated = (owner) => {
    setOwners((prev) => [owner, ...prev])
  }

  const handleDelete = async (property) => {
    if (!canDelete) return
    const targetColl = property._collection || 'managed_properties'
    try {
      const [leases, payments, tickets, expenses] = await Promise.all([
        getLeasesByProperty(property.id),
        getPaymentsByProperty(property.id),
        getTicketsByProperty(property.id),
        getExpensesByProperty(property.id),
      ])
      if (
        leases.length > 0 ||
        payments.length > 0 ||
        tickets.length > 0 ||
        expenses.length > 0
      ) {
        notify(
          'Impossible de supprimer : ce bien a un historique (bail, paiement, entretien ou dépense) rattaché',
          'error'
        )
        setDeleteConfirm(null)
        return
      }
      await deleteManagedProperty(property.id, targetColl)
      setProperties((prev) => prev.filter((p) => p.id !== property.id))
      setDeleteConfirm(null)
      setDetailProperty(null)
      notify('Bien supprimé avec succès', 'success')
    } catch (e) {
      notify('Une erreur est survenue lors de la suppression', 'error')
    }
  }

  const handleToggleStatus = async (property) => {
    if (!property || !canProcess) return
    const isInactive = property.status === 'inactive'
    const targetColl = property._collection || 'managed_properties'
    // Annonce publique réactivée : « available » (le site n'affiche que ce
    // statut) ; « vacant » ne concerne que la gestion locative interne.
    const newStatus = isInactive ? (isPublicListing(property) ? 'available' : 'vacant') : 'inactive'
    try {
      const updateData = { status: newStatus }
      if (targetColl === 'houses' || targetColl === 'daily_rentals') {
        updateData.active = isInactive
        updateData.isAvailable = isInactive
        updateData.published = isInactive
      }
      if (targetColl === 'lands') {
        updateData.active = isInactive
        updateData.published = isInactive
      }
      if (targetColl === 'managed_properties') {
        await editManagedProperty(property.id, updateData, targetColl)
      } else {
        await updateProperty(property.id, updateData, targetColl)
        // Annonce publique : son auteur est prévenu (désactivée / de nouveau en ligne),
        // et les personnes qui l'ont en favori si elle est retirée
        void notifySiteUser('listing_status', { collection: targetColl, id: property.id })
        void notifyFavoritesOfChange(targetColl, property.id, {
          price: Number(property.price?.amount ?? property.price) || 0,
          visible: isListingOnline(property),
        })
      }
      setProperties((prev) =>
        prev.map((p) =>
          p.id === property.id
            ? { ...p, status: newStatus, active: isInactive }
            : p
        )
      )
      setDetailProperty((prev) =>
        prev ? { ...prev, status: newStatus, active: isInactive } : null
      )
      notify(
        isInactive ? 'Bien réactivé avec succès' : 'Bien désactivé avec succès',
        'success'
      )
    } catch (e) {
      notify('Erreur lors du changement de statut du bien', 'error')
    }
  }

  // Vérification/mise en avant : uniquement pour les vraies annonces publiques
  // (houses/lands/daily_rentals), pas la gestion locative interne.
  const isPublicListing = (property) =>
    ['houses', 'lands', 'daily_rentals'].includes(property?._collection)

  const handleToggleVerified = async (property) => {
    if (!property || !isPublicListing(property) || !canProcess) return
    const nextVerified = !property.verified
    try {
      await updateProperty(property.id, { verified: nextVerified }, property._collection)
      setProperties((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, verified: nextVerified } : p))
      )
      setDetailProperty((prev) =>
        prev && prev.id === property.id ? { ...prev, verified: nextVerified } : prev
      )
      notify(nextVerified ? 'Annonce vérifiée' : 'Vérification retirée', 'success')
    } catch (e) {
      notify('Erreur lors de la mise à jour de la vérification', 'error')
    }
  }

  const handleSetBoost = async (property, days) => {
    if (!property || !isPublicListing(property) || !canProcess) return
    try {
      const boostedUntil = days
        ? Timestamp.fromDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000))
        : null
      await updateProperty(property.id, { boostedUntil }, property._collection)
      if (days) void notifySiteUser('listing_boost', { collection: property._collection, id: property.id })
      setProperties((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, boostedUntil } : p))
      )
      setDetailProperty((prev) =>
        prev && prev.id === property.id ? { ...prev, boostedUntil } : prev
      )
      notify(days ? `Annonce mise en avant pour ${days} jours` : 'Mise en avant retirée', 'success')
    } catch (e) {
      notify('Erreur lors de la mise à jour de la mise en avant', 'error')
    }
  }

  const isCurrentlyBoosted = (property) => {
    const until = property?.boostedUntil
    if (!until) return false
    const untilDate = typeof until?.toDate === 'function' ? until.toDate() : new Date(until)
    return untilDate.getTime() > Date.now()
  }

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase()
    if (!q) return true
    const owner = ownerById(p.ownerId)
    return (
      p.reference?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.unitLabel?.toLowerCase().includes(q) ||
      owner?.name?.toLowerCase().includes(q)
    )
  })
  const visible = filtered.slice(0, visibleCount)

  // Sélection multiple : tout bien géré ou toute annonce publique, dès lors
  // qu'au moins une action groupée est possible (traiter et/ou supprimer).
  // Chaque action groupée filtre ensuite elle-même sa cible réelle (ex: la
  // mise en avant et la vérification ne s'appliquent qu'aux vraies annonces).
  const selectableIds = canProcess || canDelete ? filtered.map((p) => p.id) : []
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))
  const selectedPublicCount = filtered.filter(
    (p) => selectedIds.has(p.id) && isPublicListing(p)
  ).length

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(selectableIds))
  }

  const handleBulkBoost = async (days) => {
    if (!canProcess) return
    const targets = filtered.filter((p) => selectedIds.has(p.id) && isPublicListing(p))
    if (targets.length === 0) return
    setBulkActing(true)
    try {
      const boostedUntil = days
        ? Timestamp.fromDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000))
        : null
      await Promise.all(
        targets.map((p) => updateProperty(p.id, { boostedUntil }, p._collection))
      )
      if (days) {
        targets.forEach((p) => void notifySiteUser('listing_boost', { collection: p._collection, id: p.id }))
      }
      const targetIds = new Set(targets.map((p) => p.id))
      setProperties((prev) =>
        prev.map((p) => (targetIds.has(p.id) ? { ...p, boostedUntil } : p))
      )
      notify(
        days
          ? `${targets.length} annonce(s) mise(s) en avant pour ${days} jours`
          : `Mise en avant retirée sur ${targets.length} annonce(s)`,
        'success'
      )
      setSelectedIds(new Set())
    } catch (e) {
      notify('Erreur lors de la mise en avant groupée', 'error')
    }
    setBulkActing(false)
  }

  const handleBulkToggleStatus = async (makeInactive) => {
    if (!canProcess) return
    const targets = filtered.filter((p) => selectedIds.has(p.id))
    if (targets.length === 0) return
    setBulkActing(true)
    try {
      // Annonce publique réactivée : « available » (seul statut affiché par le site)
      const statusFor = (p) => (makeInactive ? 'inactive' : isPublicListing(p) ? 'available' : 'vacant')
      await Promise.all(
        targets.map((p) => {
          const targetColl = p._collection || 'managed_properties'
          const updateData = { status: statusFor(p) }
          if (targetColl === 'houses' || targetColl === 'daily_rentals') {
            updateData.active = !makeInactive
            updateData.isAvailable = !makeInactive
            updateData.published = !makeInactive
          }
          if (targetColl === 'lands') {
            updateData.active = !makeInactive
            updateData.published = !makeInactive
          }
          return targetColl === 'managed_properties'
            ? editManagedProperty(p.id, updateData, targetColl)
            : updateProperty(p.id, updateData, targetColl)
        })
      )
      targets
        .filter(isPublicListing)
        .forEach((p) => {
          void notifySiteUser('listing_status', { collection: p._collection, id: p.id })
          void notifyFavoritesOfChange(p._collection, p.id, {
            price: Number(p.price?.amount ?? p.price) || 0,
            visible: isListingOnline(p),
          })
        })
      const targetIds = new Set(targets.map((p) => p.id))
      setProperties((prev) =>
        prev.map((p) => (targetIds.has(p.id) ? { ...p, status: statusFor(p), active: !makeInactive } : p))
      )
      notify(
        `${targets.length} bien${targets.length > 1 ? 's' : ''} ${makeInactive ? 'désactivé(s)' : 'réactivé(s)'}`,
        'success'
      )
      setSelectedIds(new Set())
    } catch (e) {
      notify('Erreur lors de la mise à jour groupée du statut', 'error')
    }
    setBulkActing(false)
  }

  const handleBulkVerify = async (verified) => {
    if (!canProcess) return
    const targets = filtered.filter((p) => selectedIds.has(p.id) && isPublicListing(p))
    if (targets.length === 0) return
    setBulkActing(true)
    try {
      await Promise.all(targets.map((p) => updateProperty(p.id, { verified }, p._collection)))
      const targetIds = new Set(targets.map((p) => p.id))
      setProperties((prev) =>
        prev.map((p) => (targetIds.has(p.id) ? { ...p, verified } : p))
      )
      notify(
        `${targets.length} annonce${targets.length > 1 ? 's' : ''} ${verified ? 'vérifiée(s)' : 'dé-vérifiée(s)'}`,
        'success'
      )
      setSelectedIds(new Set())
    } catch (e) {
      notify('Erreur lors de la vérification groupée', 'error')
    }
    setBulkActing(false)
  }

  const handleBulkDelete = async () => {
    if (!canDelete) return
    const targets = filtered.filter((p) => selectedIds.has(p.id))
    if (targets.length === 0) return
    setBulkActing(true)
    try {
      const checks = await Promise.all(
        targets.map(async (p) => {
          const [leases, payments, tickets, expenses] = await Promise.all([
            getLeasesByProperty(p.id),
            getPaymentsByProperty(p.id),
            getTicketsByProperty(p.id),
            getExpensesByProperty(p.id),
          ])
          const hasHistory =
            leases.length > 0 || payments.length > 0 || tickets.length > 0 || expenses.length > 0
          return { property: p, hasHistory }
        })
      )
      const deletable = checks.filter((c) => !c.hasHistory).map((c) => c.property)
      const blockedCount = checks.length - deletable.length
      if (deletable.length > 0) {
        await Promise.all(
          deletable.map((p) => deleteManagedProperty(p.id, p._collection || 'managed_properties'))
        )
        const deletedIds = new Set(deletable.map((p) => p.id))
        setProperties((prev) => prev.filter((p) => !deletedIds.has(p.id)))
      }
      if (blockedCount > 0) {
        notify(
          `${deletable.length} bien(s) supprimé(s), ${blockedCount} ignoré(s) (historique rattaché)`,
          deletable.length > 0 ? 'success' : 'error'
        )
      } else {
        notify(`${deletable.length} bien${deletable.length > 1 ? 's' : ''} supprimé(s)`, 'success')
      }
      setSelectedIds(new Set())
      setBulkDeleteConfirm(false)
    } catch (e) {
      notify('Erreur lors de la suppression groupée', 'error')
    }
    setBulkActing(false)
  }

  return (
    <>
      <div className="rounded-xl bg-white p-3 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white pb-3 sm:mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Biens gérés</h2>
            <p className="mt-1 text-sm text-gray-500">
              {properties.length} bien{properties.length !== 1 ? 's' : ''}{' '}
              enregistré
              {properties.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un bien..."
              className="w-full rounded-xl border-0 bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary sm:w-56"
            />
            {canProcess && (
              <button
                onClick={openAdd}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md sm:w-auto"
                style={{ backgroundColor: colors.primary }}
              >
                <RiAddLine className="h-4 w-4" />
                Ajouter un bien
              </button>
            )}
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div
            className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3"
            style={{ borderColor: colors.primary, backgroundColor: colors.primaryVeryLight }}
          >
            <span className="text-sm font-semibold" style={{ color: colors.primary }}>
              {selectedIds.size} bien{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>

            {canProcess && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={bulkActing}
                  onClick={() => handleBulkToggleStatus(true)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                >
                  Désactiver
                </button>
                <button
                  type="button"
                  disabled={bulkActing}
                  onClick={() => handleBulkToggleStatus(false)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                >
                  Réactiver
                </button>
              </div>
            )}

            {canProcess && selectedPublicCount > 0 && (
              <>
                <div className="flex items-center gap-1.5">
                  <RiShieldCheckLine className="h-4 w-4" style={{ color: colors.primary }} />
                  <button
                    type="button"
                    disabled={bulkActing}
                    onClick={() => handleBulkVerify(true)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Vérifier
                  </button>
                  <button
                    type="button"
                    disabled={bulkActing}
                    onClick={() => handleBulkVerify(false)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Retirer vérif.
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <RiRocketLine className="h-4 w-4" style={{ color: colors.primary }} />
                  <span className="text-xs font-semibold text-gray-600">Mettre en avant :</span>
                  {[7, 15, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      disabled={bulkActing}
                      onClick={() => handleBulkBoost(days)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                    >
                      {days}j
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={bulkActing}
                    onClick={() => handleBulkBoost(null)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Retirer
                  </button>
                </div>
              </>
            )}

            {canDelete && (
              <div className="flex items-center gap-2">
                {bulkDeleteConfirm ? (
                  <>
                    <span className="text-xs font-semibold text-gray-500">Confirmer ?</span>
                    <button
                      type="button"
                      disabled={bulkActing}
                      onClick={handleBulkDelete}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      style={{ backgroundColor: colors.error }}
                    >
                      Oui, supprimer
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkDeleteConfirm(false)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Non
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBulkDeleteConfirm(true)}
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-red-50"
                    style={{ borderColor: colors.error, color: colors.error }}
                  >
                    <RiDeleteBinLine className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedIds(new Set())
                setBulkDeleteConfirm(false)
              }}
              className="ml-auto text-xs font-semibold text-gray-400 hover:text-gray-600"
            >
              Annuler
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
            <RiHome4Line className="h-6 w-6 text-gray-300" />
            <p className="text-sm text-gray-400">Aucun bien enregistré</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="divide-y divide-gray-200 lg:hidden">
              {visible.map((property) => {
                const statusCfg = STATUS_CONFIG[property.status] || STATUS_CONFIG.vacant
                const typeLabel = typeof property.type === 'string'
                  ? property.type
                  : property.type?.property || property.type?.transaction || 'Bien'
                return (
                  <article key={property.id} className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      {(canProcess || canDelete) && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(property.id)}
                          onChange={() => toggleSelect(property.id)}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Sélectionner le bien ${property.reference || ''}`}
                          className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded"
                          style={{ accentColor: colors.primary }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => openDetail(property)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block break-words text-sm font-semibold text-gray-900">
                          {property.reference || 'Bien sans référence'}
                        </span>
                        <span className="mt-1 block break-words text-xs text-gray-600">
                          {property.address}{property.city ? `, ${property.city}` : ''}
                          {property.unitLabel ? ` · ${property.unitLabel}` : ''}
                        </span>
                        <span className="mt-1 block text-xs text-gray-400">
                          {typeLabel}{property.surface ? ` · ${property.surface} m²` : ''}{property.nbRooms ? ` · ${property.nbRooms} pièces` : ''}
                        </span>
                      </button>
                      {property.imageUrl ? (
                        <img src={property.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pl-7">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={statusCfg.tone}>{statusCfg.label}</StatusPill>
                        <span className="font-mono text-xs font-semibold" style={{ color: colors.primary }}>
                          {formatGNF(property.rentAmount)}
                        </span>
                      </div>
                      <div data-menu-root>
                        <button
                          type="button"
                          onClick={(event) => openMenu(event, property.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500"
                          aria-label={`Actions pour ${property.reference || 'ce bien'}`}
                        >
                          <RiMore2Fill className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead style={{ backgroundColor: colors.gray50 }}>
                  <tr>
                    <th className="w-8 py-3 pl-4 pr-2">
                      {selectableIds.length > 0 && (
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 cursor-pointer rounded"
                          style={{ accentColor: colors.primary }}
                          title="Tout sélectionner"
                        />
                      )}
                    </th>
                    <th className="hidden px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700 lg:table-cell">Photo</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700">Référence</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700">Adresse</th>
                    {!ownerId && <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700">Propriétaire</th>}
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700">Loyer</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700">Statut</th>
                    <th className="hidden px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700 lg:table-cell">Mise en avant</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {visible.map((property) => {
                    const statusCfg =
                      STATUS_CONFIG[property.status] || STATUS_CONFIG.vacant
                    const owner = ownerById(property.ownerId)
                    const mainImage = property.imageUrl

                    return (
                      <tr
                        key={property.id}
                        onClick={() => openDetail(property)}
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                      >
                        <td className="w-8 py-4 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                          {(canProcess || canDelete) && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(property.id)}
                              onChange={() => toggleSelect(property.id)}
                              className="h-4 w-4 cursor-pointer rounded"
                              style={{ accentColor: colors.primary }}
                            />
                          )}
                        </td>
                        <td className="hidden px-4 py-2 lg:table-cell">
                          {mainImage ? (
                            <div
                              className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-sm"
                              style={{ width: 56, height: 56 }}
                            >
                              <img
                                src={mainImage}
                                alt={property.reference || 'Bien'}
                                className="h-full w-full object-cover"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ) : (
                            <div
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400"
                              style={{ width: 56, height: 56 }}
                            >
                              <RiHome4Line className="h-6 w-6" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 font-semibold text-gray-900">
                          {property.reference}
                        </td>
                        <td className="max-w-[360px] px-4 py-2 text-gray-700">
                          <div className="max-w-[360px] min-w-0 space-y-0.5">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="truncate font-semibold text-gray-900">
                                {property.address}
                                {property.city ? `, ${property.city}` : ''}
                              </span>
                              {property.unitLabel && (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                  style={{
                                    backgroundColor: colors.primaryVeryLight,
                                    color: colors.primary,
                                  }}
                                >
                                  {property.unitLabel}
                                </span>
                              )}
                            </div>
                            <div className="flex min-w-0 items-center gap-2 truncate text-[11px] text-gray-500">
                              <span className="shrink-0">
                                {typeof property.type === 'string'
                                  ? property.type
                                  : String(
                                      property.type?.property ||
                                        property.type?.transaction ||
                                        'Bien'
                                    )}
                              </span>
                              {property.surface ? (
                                <span className="shrink-0">{property.surface} m²</span>
                              ) : null}
                              {property.nbRooms ? (
                                <span className="shrink-0">
                                  {property.nbRooms} pièce
                                  {property.nbRooms > 1 ? 's' : ''}
                                </span>
                              ) : null}
                            </div>
                            {property.description && (
                              <p
                                className="truncate text-xs text-gray-400"
                                title={property.description}
                              >
                                {property.description}
                              </p>
                            )}
                          </div>
                        </td>
                        {!ownerId && (
                          <td className="px-4 py-2 text-gray-700">
                            {owner?.name || '—'}
                            <p className="font-mono text-xs text-gray-400">
                              {owner?.phone}
                            </p>
                          </td>
                        )}
                        <td
                          className="whitespace-nowrap px-4 py-2 font-mono font-semibold"
                          style={{ color: colors.primary }}
                        >
                          {formatGNF(property.rentAmount)}
                        </td>
                        <td className="px-4 py-2">
                          <StatusPill tone={statusCfg.tone}>{statusCfg.label}</StatusPill>
                        </td>
                        <td className="hidden px-4 py-2 lg:table-cell">
                          {isCurrentlyBoosted(property) ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                              style={{ backgroundColor: colors.primaryVeryLight, color: colors.primary }}
                            >
                              <RiRocketLine className="h-3 w-3" />
                              Jusqu'au <span className="font-mono">{firebaseDateFormat(property.boostedUntil)}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td
                          className="px-4 py-2 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-end" data-menu-root>
                            <button
                              type="button"
                              onClick={(event) => openMenu(event, property.id)}
                              className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                              title="Actions"
                            >
                              <RiMore2Fill className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {!isLoading && filtered.length > 0 && visibleCount < filtered.length && (
          <PaginationButton
            className="!mt-3"
            getmoreData={() => setVisibleCount((c) => c + PAGE_SIZE)}
          />
        )}
      </div>

      {menuOpenId && menuAnchor && (
        <div
          className="fixed z-[100] w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-2xl"
          style={{ left: menuAnchor.left, top: menuAnchor.top }}
          data-menu-root
        >
          <button
            type="button"
            onClick={() => {
              setMenuOpenId(null)
              setMenuAnchor(null)
              openDetail(
                properties.find((property) => property.id === menuOpenId) ||
                  null
              )
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RiEyeLine className="h-4 w-4 text-gray-400" />
            Voir les détails
          </button>
          {canProcess && (
            <button
              type="button"
              onClick={() => {
                setMenuOpenId(null)
                setMenuAnchor(null)
                openEdit(
                  properties.find((property) => property.id === menuOpenId)
                )
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <RiEditLine className="h-4 w-4 text-gray-400" />
              Modifier l'annonce
            </button>
          )}
          {canProcess && (
            <button
              type="button"
              onClick={() => {
                setMenuOpenId(null)
                setMenuAnchor(null)
                handleToggleStatus(
                  properties.find((property) => property.id === menuOpenId)
                )
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <RiEyeOffLine className="h-4 w-4 text-gray-400" />
              {properties.find((property) => property.id === menuOpenId)
                ?.status === 'inactive'
                ? "Réactiver l'annonce"
                : 'Désactiver / Masquer'}
            </button>
          )}
          {canProcess && isPublicListing(
            properties.find((property) => property.id === menuOpenId)
          ) && (
            <>
              <button
                type="button"
                onClick={() => {
                  const property = properties.find((p) => p.id === menuOpenId)
                  setMenuOpenId(null)
                  setMenuAnchor(null)
                  handleToggleVerified(property)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <RiShieldCheckLine className="h-4 w-4 text-gray-400" />
                {properties.find((property) => property.id === menuOpenId)
                  ?.verified
                  ? 'Retirer la vérification'
                  : 'Marquer comme vérifiée'}
              </button>
              {isCurrentlyBoosted(
                properties.find((property) => property.id === menuOpenId)
              ) ? (
                <button
                  type="button"
                  onClick={() => {
                    const property = properties.find((p) => p.id === menuOpenId)
                    setMenuOpenId(null)
                    setMenuAnchor(null)
                    handleSetBoost(property, null)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <RiRocketLine className="h-4 w-4 text-gray-400" />
                  Retirer la mise en avant
                </button>
              ) : (
                <div className="px-3 py-1.5">
                  <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <RiRocketLine className="h-3.5 w-3.5" />
                    Mettre en avant
                  </p>
                  <div className="flex gap-1.5">
                    {[7, 15, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          const property = properties.find((p) => p.id === menuOpenId)
                          setMenuOpenId(null)
                          setMenuAnchor(null)
                          handleSetBoost(property, days)
                        }}
                        className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      >
                        {days}j
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => {
                setMenuOpenId(null)
                setMenuAnchor(null)
                const selectedProperty = properties.find(
                  (property) => property.id === menuOpenId
                )
                openDetail(selectedProperty)
                setDeleteConfirm(selectedProperty?.id)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold hover:bg-red-50"
              style={{ color: colors.error }}
            >
              <RiDeleteBinLine className="h-4 w-4" />
              Supprimer l'annonce
            </button>
          )}
        </div>
      )}

      <PropertyDrawerForm
        open={drawerOpen}
        setOpen={setDrawerOpen}
        selected={selected}
        owners={owners}
        lockedOwnerId={ownerId}
        onSaved={handleSaved}
        onOwnerCreated={handleOwnerCreated}
      />

      <SimpleDrawer
        open={!!detailProperty}
        setOpen={(open) => !open && setDetailProperty(null)}
        title={detailProperty?.title || detailProperty?.reference}
        description={
          detailProperty
            ? `${detailProperty.address}${
                detailProperty.city ? `, ${detailProperty.city}` : ''
              }`
            : ''
        }
        footerButtons={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            {canDelete ? (
              <button
                type="button"
                onClick={() => setDeleteConfirm(detailProperty?.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-red-50"
                style={{ borderColor: colors.error, color: colors.error }}
              >
                <RiDeleteBinLine className="h-3.5 w-3.5" />
                Supprimer l'annonce
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              {canProcess && (
                <button
                  type="button"
                  onClick={() => handleToggleStatus(detailProperty)}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:opacity-80"
                  style={
                    detailProperty?.status === 'inactive'
                      ? { borderColor: colors.success, backgroundColor: '#F0FDF4', color: colors.success }
                      : { borderColor: colors.warning, backgroundColor: '#FFFBEB', color: colors.warning }
                  }
                >
                  {detailProperty?.status === 'inactive'
                    ? "Réactiver l'annonce"
                    : 'Désactiver / Masquer'}
                </button>
              )}
              {canProcess && (
                <button
                  type="button"
                  onClick={() => openEdit(detailProperty)}
                  className="shadow-xs inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white"
                  style={{ backgroundColor: colors.primary }}
                >
                  <RiEditLine className="h-3.5 w-3.5" />
                  Modifier l'annonce
                </button>
              )}
            </div>
          </div>
        }
      >
        {detailProperty && (
          <div className="space-y-5 px-6 py-6 sm:p-8">
            {(() => {
              const statusCfg =
                STATUS_CONFIG[detailProperty.status] || STATUS_CONFIG.vacant
              const owner = ownerById(detailProperty.ownerId)
              const mainImage = detailProperty.imageUrl
              const isLand = detailProperty._collection === 'lands'
              const isDailyRental = detailProperty._collection === 'daily_rentals'
              const location = detailProperty.location || {}
              const features = detailProperty.features || {}
              const priceInfo =
                detailProperty.price && typeof detailProperty.price === 'object'
                  ? detailProperty.price
                  : {}
              const rawPrice =
                priceInfo.amount ??
                (typeof detailProperty.price === 'number' || typeof detailProperty.price === 'string'
                  ? detailProperty.price
                  : detailProperty.rentAmount)
              const priceAmount = Number(rawPrice) || 0
              const currency = priceInfo.currency || detailProperty.currency || 'GNF'
              const pricePeriod = priceInfo.period || detailProperty.period
              const transaction = detailProperty.type?.transaction || detailProperty.transactionType
              const isSale = transaction === 'sale'
              const propertyType =
                detailProperty.type?.property || detailProperty.propertyType ||
                (typeof detailProperty.type === 'string' ? detailProperty.type : '')
              const transactionLabels = {
                rent: 'Location',
                sale: 'Vente',
                daily_rent: 'Location journalière',
                bail: 'Bail',
              }
              const periodLabels = {
                monthly: 'par mois',
                mensuel: 'par mois',
                yearly: 'par an',
                annuel: 'par an',
                nightly: 'par nuit',
                daily: 'par jour',
                weekly: 'par semaine',
                total: 'prix total',
              }
              const formattedAmount = priceAmount
                ? `${Number(priceAmount).toLocaleString('fr-FR')} ${currency}`
                : 'Prix sur demande'
              const gallery = Array.isArray(detailProperty.images)
                ? detailProperty.images
                : detailProperty.images?.gallery ||
                  (Array.isArray(detailProperty.imageUrls) ? detailProperty.imageUrls : [])
              const uniqueGallery = Array.from(new Set([mainImage, ...gallery].filter(Boolean)))
              const addField = (fields, label, value, suffix = '') => {
                if (value === undefined || value === null || value === '') return
                fields.push({ label, value: `${formatDetailValue(value)}${suffix}` })
              }

              const featureFields = []
              addField(featureFields, 'Surface', features.area ?? detailProperty.surface, ' m²')
              addField(
                featureFields,
                'Chambres',
                features.bedrooms ?? detailProperty.bedrooms
              )
              addField(featureFields, 'Salles de bain', features.bathrooms ?? detailProperty.bathrooms)
              if (features.bedrooms === undefined && detailProperty.bedrooms === undefined && detailProperty.nbRooms) {
                addField(featureFields, 'Pièces', detailProperty.nbRooms)
              }
              addField(featureFields, 'Étage', features.floor ?? detailProperty.floor)
              addField(featureFields, 'État du bien', features.condition ?? detailProperty.condition)
              const furnished = features.furnished ?? detailProperty.furnished
              if (furnished !== undefined) addField(featureFields, 'Meublé', furnished)
              addField(
                featureFields,
                'Voyageurs maximum',
                detailProperty.maxGuests ?? detailProperty.maxGuestsCount ?? detailProperty.capacity
              )
              addField(featureFields, 'Note moyenne', detailProperty.rating, ' / 5')
              addField(featureFields, "Nombre d'avis", detailProperty.reviews)
              const standardFeatureKeys = new Set([
                'area', 'bedrooms', 'bathrooms', 'floor', 'condition', 'furnished', 'amenities',
              ])
              Object.entries(features)
                .filter(([key, value]) => !standardFeatureKeys.has(key) && value !== undefined && value !== null && value !== '' && value !== 0 && value !== false)
                .forEach(([key, value]) => addField(featureFields, formatDetailLabel(key), value))

              const priceFields = []
              addField(priceFields, isDailyRental ? 'Tarif par nuit' : isSale ? 'Prix de vente' : isLand ? 'Prix du terrain' : 'Loyer', formattedAmount)
              addField(priceFields, 'Devise', currency)
              addField(priceFields, 'Période', periodLabels[pricePeriod] || pricePeriod)
              const negotiable = priceInfo.negotiable ?? priceInfo.isNegotiable ?? detailProperty.negociable
              if (isDailyRental) {
                addField(priceFields, 'Caution de séjour', priceInfo.deposit ?? detailProperty.deposit, ` ${currency}`)
                addField(priceFields, 'Tarif semaine', detailProperty.additionalRates?.weekly, ` ${currency}`)
                addField(priceFields, 'Tarif mois', detailProperty.additionalRates?.monthly, ` ${currency}`)
              } else if (isSale) {
                addField(priceFields, 'Négociation', negotiable ? 'Prix négociable' : 'Prix fixe')
                addField(priceFields, "Frais d'agence (%)", priceInfo.agencyFeePercent ?? 5, '%')
                addField(priceFields, 'Notaire et enregistrement (%)', priceInfo.notaryFeePercent ?? 5, '%')
              } else {
                const deposit = Number(priceInfo.deposit ?? detailProperty.deposit) || 0
                addField(priceFields, "Loyer d'avance", priceInfo.advanceMonths ?? 3, ' mois')
                addField(
                  priceFields,
                  'Caution',
                  deposit > 12
                    ? `${deposit.toLocaleString('fr-FR')} ${currency}`
                    : `${deposit || priceInfo.depositMonths || 2} mois`
                )
                addField(priceFields, "Frais d'agence", priceInfo.agencyFeeMonths ?? 1, ' mois')
                addField(priceFields, 'Négociation', negotiable ? 'Oui' : 'Non')
              }
              if (isLand && isSale && priceAmount > 0 && Number(features.area || detailProperty.surface) > 0) {
                const area = Number(features.area || detailProperty.surface)
                addField(priceFields, 'Prix par m²', `${Math.round(priceAmount / area).toLocaleString('fr-FR')} ${currency}/m²`)
              }

              const locationFields = []
              addField(locationFields, 'Adresse', detailProperty.address)
              addField(locationFields, 'Quartier', location.neighborhood)
              addField(locationFields, 'Commune', location.municipality)
              addField(locationFields, 'Région', location.region || detailProperty.city || detailProperty.commune)
              addField(locationFields, 'Repère', location.landmark)

              const contact = detailProperty.contact || {}
              const contactFields = []
              addField(contactFields, "Agence", contact.agencyName || detailProperty.agencyName)
              addField(contactFields, 'Contact', contact.name || detailProperty.contactName)
              addField(contactFields, 'Téléphone', contact.phone || detailProperty.contactPhone)
              addField(contactFields, 'WhatsApp', contact.whatsapp || detailProperty.contactWhatsapp)
              addField(contactFields, 'Email', contact.email || detailProperty.contactEmail)
              if (!ownerId && owner) {
                addField(contactFields, 'Propriétaire', owner.name)
                addField(contactFields, 'Téléphone du propriétaire', owner.phone)
              }

              const stayFields = []
              if (isDailyRental) {
                addField(stayFields, 'Séjour minimum (nuits)', detailProperty.minStay)
                addField(stayFields, 'Séjour maximum (nuits)', detailProperty.maxStay)
                const formatHour = (hour) =>
                  hour === undefined || hour === null || hour === ''
                    ? undefined
                    : typeof hour === 'string' && hour.includes(':')
                      ? hour
                      : `${String(hour).padStart(2, '0')}:00`
                addField(stayFields, "Heure d'arrivée", formatHour(detailProperty.checkInHour))
                addField(stayFields, 'Heure de départ', formatHour(detailProperty.checkOutHour))
              }

              const landFields = []
              if (isLand) {
                addField(landFields, 'Titre foncier', detailProperty.hasLandTitle ?? detailProperty.documents?.hasLandTitle ?? detailProperty.documents?.landTitle)
                addField(landFields, 'Préfinancement', detailProperty.prefinancing?.enabled ?? detailProperty.prefinancing)
                Object.entries(detailProperty.parcelInfo || {})
                  .filter(([key, value]) => key !== 'isParcelled' && value !== undefined && value !== null && value !== '')
                  .forEach(([key, value]) => addField(landFields, formatDetailLabel(key), value))
                Object.entries(detailProperty.documents || {})
                  .filter(([key, value]) => !['hasLandTitle', 'landTitle'].includes(key) && value !== undefined && value !== null && value !== '')
                  .forEach(([key, value]) => addField(landFields, formatDetailLabel(key), value))
                Object.entries(typeof detailProperty.prefinancing === 'object' ? detailProperty.prefinancing : {})
                  .filter(([key, value]) => key !== 'enabled' && value !== undefined && value !== null && value !== '')
                  .forEach(([key, value]) => addField(landFields, formatDetailLabel(key), value))
              }

              const rawAmenities =
                detailProperty.amenities ?? features.amenities ?? detailProperty.commodites ?? detailProperty.equipements ?? []
              const amenities = Array.isArray(rawAmenities)
                ? rawAmenities
                : rawAmenities && typeof rawAmenities === 'object'
                  ? Object.entries(rawAmenities).filter(([, enabled]) => Boolean(enabled)).map(([key]) => key)
                  : []
              const amenityLabels = Array.from(new Set(amenities.map((item) => {
                if (typeof item === 'object') return item.label || item.name || item.value || item.key || item.id
                return item
              }).filter(Boolean)))

              return (
                <>
                  {mainImage && (
                    <div className="shadow-xs overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                      <img
                        src={mainImage}
                        alt={detailProperty.reference || 'Bien'}
                        className="h-52 w-full object-cover"
                      />
                      {uniqueGallery.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto border-t border-gray-100 bg-gray-50 p-2">
                          {uniqueGallery.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Galerie ${idx + 1}`}
                              className="h-14 w-20 flex-shrink-0 rounded-md border border-gray-200 object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={statusCfg.tone}>{statusCfg.label}</StatusPill>
                    {propertyType && <span className="text-xs text-gray-500">{formatDetailValue(propertyType)}</span>}
                    {transaction && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{transactionLabels[transaction] || transaction}</span>}
                    {detailProperty.verified && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">Vérifié</span>}
                    {detailProperty.unitLabel && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: colors.primaryVeryLight,
                          color: colors.primary,
                        }}
                      >
                        {detailProperty.unitLabel}
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {isDailyRental ? 'Prix par nuit' : transaction === 'sale' ? 'Prix de vente' : isLand ? 'Prix du terrain' : 'Prix affiché'}
                    </p>
                    <p className="mt-1 text-xl font-bold tracking-tight" style={{ color: colors.primary }}>
                      {formattedAmount}{pricePeriod ? ` · ${periodLabels[pricePeriod] || pricePeriod}` : ''}
                    </p>
                    {negotiable && <p className="mt-1 text-xs font-semibold text-gray-600">Prix négociable</p>}
                  </div>

                  {featureFields.length > 0 && <DetailSection title="Caractéristiques">
                    <DetailFields fields={featureFields} />
                  </DetailSection>}

                  {locationFields.length > 0 && <DetailSection title="Localisation">
                    <DetailFields fields={locationFields} />
                  </DetailSection>}

                  {amenityLabels.length > 0 && (
                    <DetailSection title="Équipements et commodités">
                      <div className="flex flex-wrap gap-2">
                        {amenityLabels.map((label) => (
                          <span key={label} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{label}</span>
                        ))}
                      </div>
                    </DetailSection>
                  )}

                  {detailProperty.description && (
                    <DetailSection title="Description">
                      <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{detailProperty.description}</p>
                    </DetailSection>
                  )}

                  {priceFields.length > 0 && <DetailSection title="Conditions financières">
                    <DetailFields fields={priceFields} />
                  </DetailSection>}

                  {stayFields.length > 0 && (
                    <DetailSection title="Conditions du séjour">
                      <DetailFields fields={stayFields} />
                    </DetailSection>
                  )}

                  {landFields.length > 0 && (
                    <DetailSection title="Informations sur le terrain">
                      <DetailFields fields={landFields} />
                    </DetailSection>
                  )}

                  {contactFields.length > 0 && (
                    <DetailSection title="Contact de l'annonce">
                      <DetailFields fields={contactFields} />
                    </DetailSection>
                  )}

                  {(detailProperty.createdAt || detailProperty.updatedAt) && (
                    <DetailSection title="Publication">
                      <DetailFields fields={[
                        detailProperty.createdAt && { label: 'Publié le', value: firebaseDateFormat(detailProperty.createdAt) },
                        detailProperty.updatedAt && { label: 'Mis à jour le', value: firebaseDateFormat(detailProperty.updatedAt) },
                      ].filter(Boolean)} />
                    </DetailSection>
                  )}

                </>
              )
            })()}
          </div>
        )}
      </SimpleDrawer>
    </>
  )
}
