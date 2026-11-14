import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { RiExternalLinkLine, RiFlag2Line } from 'react-icons/ri'
import { db } from '@/lib/firebase/client_config'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import ConfirmModal from '@/components/ConfirmModal'
import {
  isListingOnline,
  notifyFavoritesOfChange,
  notifySiteUser,
} from '@/lib/services/accountNotifications'
import { useCanManage } from '@/hooks/useCanManage'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.batimoo.com'

const COLLECTIONS = [
  { name: 'houses', label: 'Bien', path: 'properties' },
  { name: 'lands', label: 'Terrain', path: 'lands' },
  { name: 'daily_rentals', label: 'Nuitée', path: 'daily_rental' },
]

/** Mêmes motifs que le site (src/app/api/listing-report). */
const REASONS = {
  unavailable: 'Déjà loué ou vendu',
  wrong_info: 'Prix ou informations faux',
  scam: 'Arnaque / argent demandé avant la visite',
  unreachable: 'Annonceur injoignable',
  other: 'Autre',
}

/** Référence affichée sur le site (« BM-3F9K2A »). */
const listingRef = (id) => `BM-${String(id).replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}`

const toDate = (value) => value?.toDate?.() ?? null

/**
 * Annonces signalées par des visiteurs (« Signaler cette annonce » sur le
 * site) : motifs, commentaires, contact de l'annonceur. L'équipe vérifie puis
 * désactive l'annonce ou classe les signalements.
 */
export default function ListingReportsPage() {
  const colors = useColors()
  const canProcess = useCanManage('properties', 'process')
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [confirm, setConfirm] = useState(null) // { item, action: 'disable' | 'resolve' }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [listingSnaps, reportsSnap] = await Promise.all([
        Promise.all(
          COLLECTIONS.map((c) =>
            getDocs(query(collection(db, c.name), where('reportCount', '>', 0)))
          )
        ),
        getDocs(collection(db, 'listing_reports')),
      ])
      const reports = reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      const next = listingSnaps.flatMap((snap, index) =>
        snap.docs.map((d) => {
          const meta = COLLECTIONS[index]
          const own = reports
            .filter((r) => r.collection === meta.name && r.listingId === d.id)
            .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0))
          return { id: d.id, meta, data: d.data(), reports: own }
        })
      )
      next.sort(
        (a, b) =>
          (toDate(b.data.lastReportedAt)?.getTime() ?? 0) - (toDate(a.data.lastReportedAt)?.getTime() ?? 0)
      )
      setItems(next)
    } catch (error) {
      console.error('Lecture des signalements:', error)
      notify('Impossible de charger les signalements', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /** Signalements classés : compteur remis à zéro, détails supprimés. */
  const resolve = async (item) => {
    await Promise.all(item.reports.map((r) => deleteDoc(doc(db, 'listing_reports', r.id))))
    await updateDoc(doc(db, item.meta.name, item.id), { reportCount: 0 })
  }

  const runConfirm = async () => {
    if (!confirm) return
    const { item, action } = confirm
    try {
      if (action === 'disable') {
        const before = {
          price: Number(item.data.price?.amount ?? item.data.price) || 0,
          visible: isListingOnline(item.data),
        }
        const update = { status: 'inactive', active: false, published: false }
        if (item.meta.name !== 'lands') update.isAvailable = false
        await updateDoc(doc(db, item.meta.name, item.id), update)
        void notifySiteUser('listing_status', { collection: item.meta.name, id: item.id })
        void notifyFavoritesOfChange(item.meta.name, item.id, before)
      }
      await resolve(item)
      notify(action === 'disable' ? 'Annonce désactivée' : 'Signalements classés', 'success')
      setItems((prev) => prev.filter((i) => !(i.id === item.id && i.meta.name === item.meta.name)))
    } catch (error) {
      console.error('Traitement du signalement:', error)
      notify("L'action n'a pas abouti", 'error')
    } finally {
      setConfirm(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader color="#111827" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
        <RiFlag2Line className="h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-400">Aucune annonce signalée</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {items.length} annonce{items.length > 1 ? 's' : ''} signalée{items.length > 1 ? 's' : ''} par des visiteurs.
        Vérifiez avec l&apos;annonceur, puis désactivez l&apos;annonce ou classez les signalements.
      </p>

      {items.map((item) => {
        const { data, meta } = item
        const online = isListingOnline(data)
        const contact = data.contact || {}
        const reasonCounts = item.reports.reduce(
          (acc, r) => ({ ...acc, [r.reason]: (acc[r.reason] || 0) + 1 }),
          {}
        )
        return (
          <div key={`${meta.name}_${item.id}`} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {meta.label} · {listingRef(item.id)} · {online ? 'En ligne' : 'Hors ligne'}
                </p>
                <p className="mt-1 font-semibold text-gray-900">{data.title || 'Sans titre'}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {[contact.agencyName, contact.name, contact.phone].filter(Boolean).join(' · ') || 'Contact non renseigné'}
                </p>
              </div>
              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: '#FDECEC', color: colors.error || '#B91C1C' }}
              >
                Signalée {data.reportCount} fois
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(reasonCounts).map(([reason, count]) => (
                <span key={reason} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                  {REASONS[reason] || reason}
                  {count > 1 ? ` ×${count}` : ''}
                </span>
              ))}
            </div>

            {item.reports.some((r) => r.comment) && (
              <ul className="mt-3 space-y-1">
                {item.reports
                  .filter((r) => r.comment)
                  .slice(0, 5)
                  .map((r) => (
                    <li key={r.id} className="text-sm text-gray-600">
                      « {r.comment} »
                      {toDate(r.createdAt) && (
                        <span className="ml-1 text-xs text-gray-400">
                          {toDate(r.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`${SITE_URL}/${meta.path}/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RiExternalLinkLine className="h-4 w-4" />
                Voir l&apos;annonce
              </a>
              {canProcess && online && (
                <button
                  type="button"
                  onClick={() => setConfirm({ item, action: 'disable' })}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: colors.error || '#B91C1C' }}
                >
                  Désactiver l&apos;annonce
                </button>
              )}
              {canProcess && (
                <button
                  type="button"
                  onClick={() => setConfirm({ item, action: 'resolve' })}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Classer (rien à corriger)
                </button>
              )}
            </div>
          </div>
        )
      })}

      <ConfirmModal
        open={Boolean(confirm)}
        setOpen={(open) => !open && setConfirm(null)}
        title={confirm?.action === 'disable' ? "Désactiver l'annonce ?" : 'Classer les signalements ?'}
        description={
          confirm?.action === 'disable'
            ? "L'annonce ne sera plus visible sur le site. Son auteur est prévenu, ainsi que les personnes qui l'ont en favori."
            : "L'annonce reste en ligne et ses signalements sont effacés."
        }
        confirmLabel={confirm?.action === 'disable' ? 'Désactiver' : 'Classer'}
        tone={confirm?.action === 'disable' ? 'error' : 'primary'}
        confirmFunction={runConfirm}
      />
    </div>
  )
}
