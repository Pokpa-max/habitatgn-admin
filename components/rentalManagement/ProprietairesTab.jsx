import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { RiAddLine, RiContactsLine, RiArrowRightSLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import { formatGNF } from '@/utils/format'
import Loader from '@/components/Loader'
import DrawerForm from '@/components/DrawerForm'
import { getManagedProperties } from '@/lib/services/managedProperties'
import { getPropertyOwners, addPropertyOwner } from '@/lib/services/propertyOwners'

export default function ProprietairesTab() {
  const colors = useColors()
  const [owners, setOwners] = useState([])
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [ownersData, propertiesData] = await Promise.all([getPropertyOwners(), getManagedProperties()])
        setOwners(ownersData)
        setProperties(propertiesData)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const propertiesOf = (ownerId) => properties.filter((p) => p.ownerId === ownerId)

  const openAdd = () => {
    reset({ name: '', phone: '', email: '', notes: '' })
    setDrawerOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = { name: data.name, phone: data.phone, email: data.email, notes: data.notes }
      const saved = await addPropertyOwner(payload)
      setOwners((prev) => [saved, ...prev])
      notify('Propriétaire ajouté avec succès', 'success')
      setDrawerOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  const filtered = owners.filter((o) => {
    const q = search.toLowerCase()
    if (!q) return true
    return o.name?.toLowerCase().includes(q) || o.phone?.toLowerCase().includes(q)
  })

  return (
    <>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Propriétaires</h2>
            <p className="mt-1 text-sm text-gray-500">
              {owners.length} propriétaire{owners.length !== 1 ? 's' : ''} — biens centralisés par propriétaire
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un propriétaire..."
              className="rounded-xl border-0 bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
              style={{ backgroundColor: colors.primary }}
            >
              <RiAddLine className="h-4 w-4" />
              Ajouter un propriétaire
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
            <RiContactsLine className="h-6 w-6 text-gray-300" />
            <p className="text-sm text-gray-400">Aucun propriétaire enregistré</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((owner) => {
              const ownerProperties = propertiesOf(owner.id)
              const totalRent = ownerProperties.reduce((sum, p) => sum + (p.rentAmount || 0), 0)
              return (
                <Link key={owner.id} href={`/gestion-locative/proprietaires/${owner.id}`}>
                  <a className="flex items-center justify-between gap-4 py-4 hover:bg-gray-50">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">{owner.name}</p>
                      <p className="text-sm text-gray-500">{owner.phone}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {ownerProperties.length} bien{ownerProperties.length !== 1 ? 's' : ''}
                        {ownerProperties.length > 0 ? ` · ${formatGNF(totalRent)}/mois` : ''}
                      </p>
                    </div>
                    <RiArrowRightSLine className="h-4 w-4 shrink-0" style={{ color: colors.gray400 }} />
                  </a>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <DrawerForm
        open={drawerOpen}
        setOpen={setDrawerOpen}
        onSubmit={handleSubmit(onSubmit)}
        title="Ajouter un propriétaire"
        description="Enregistrer un nouveau propriétaire"
        footerButtons={
          <>
            {saving ? (
              <div
                className="inline-flex justify-center rounded px-6 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: colors.primary }}
              >
                <Loader />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  onClick={() => setDrawerOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="ml-3 inline-flex items-center gap-2 rounded px-6 py-2 text-sm font-semibold text-white hover:shadow-md"
                  style={{ backgroundColor: colors.primary }}
                >
                  Enregistrer
                </button>
              </>
            )}
          </>
        }
      >
        <div className="space-y-5 px-6 py-6 sm:p-8">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Nom *
            </label>
            <input
              type="text"
              {...register('name', { required: 'Requis' })}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.name && <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Téléphone *
            </label>
            <input
              type="text"
              {...register('phone', { required: 'Requis' })}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+224 6XX XX XX XX"
            />
            {errors.phone && <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.phone.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Notes
            </label>
            <textarea
              rows={2}
              {...register('notes')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </DrawerForm>
    </>
  )
}
