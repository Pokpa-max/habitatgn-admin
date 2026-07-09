import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiContactsLine, RiArrowRightSLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import { formatGNF } from '@/utils/format'
import Loader from '@/components/Loader'
import DrawerForm from '@/components/DrawerForm'
import { getManagedProperties } from '@/lib/services/managedProperties'
import {
  getPropertyOwners,
  addPropertyOwner,
  editPropertyOwner,
  deletePropertyOwner,
} from '@/lib/services/propertyOwners'

export default function ProprietairesTab() {
  const colors = useColors()
  const [owners, setOwners] = useState([])
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
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
    setSelected(null)
    reset({ name: '', phone: '', email: '', notes: '' })
    setDrawerOpen(true)
  }

  const openEdit = (owner) => {
    setSelected(owner)
    reset({ name: owner.name, phone: owner.phone, email: owner.email || '', notes: owner.notes || '' })
    setDrawerOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = { name: data.name, phone: data.phone, email: data.email, notes: data.notes }
      if (selected) {
        await editPropertyOwner(selected.id, payload)
        setOwners((prev) => prev.map((o) => (o.id === selected.id ? { ...o, ...payload } : o)))
        notify('Propriétaire modifié avec succès', 'success')
      } else {
        const saved = await addPropertyOwner(payload)
        setOwners((prev) => [saved, ...prev])
        notify('Propriétaire ajouté avec succès', 'success')
      }
      setDrawerOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  const handleDelete = async (owner) => {
    if (propertiesOf(owner.id).length > 0) {
      notify('Ce propriétaire a encore des biens rattachés — réassignez-les avant de le supprimer', 'error')
      setDeleteConfirm(null)
      return
    }
    try {
      await deletePropertyOwner(owner.id)
      setOwners((prev) => prev.filter((o) => o.id !== owner.id))
      setDeleteConfirm(null)
      notify('Propriétaire supprimé avec succès', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
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
              className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
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
                <div key={owner.id} className="flex items-center justify-between gap-4 py-4">
                  <Link href={`/gestion-locative/proprietaires/${owner.id}`}>
                    <a className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">{owner.name}</p>
                      <p className="text-sm text-gray-500">{owner.phone}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {ownerProperties.length} bien{ownerProperties.length !== 1 ? 's' : ''}
                        {ownerProperties.length > 0 ? ` · ${formatGNF(totalRent)}/mois` : ''}
                      </p>
                    </a>
                  </Link>

                  <div className="flex shrink-0 items-center gap-2">
                    {deleteConfirm === owner.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Confirmer ?</span>
                        <button
                          onClick={() => handleDelete(owner)}
                          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => openEdit(owner)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                          title="Modifier"
                        >
                          <RiEditLine className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(owner.id)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-red-200 hover:text-red-500"
                          title="Supprimer"
                        >
                          <RiDeleteBinLine className="h-4 w-4" />
                        </button>
                        <Link href={`/gestion-locative/proprietaires/${owner.id}`}>
                          <a
                            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                            title="Voir ses biens"
                          >
                            <RiArrowRightSLine className="h-4 w-4" />
                          </a>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <DrawerForm
        open={drawerOpen}
        setOpen={setDrawerOpen}
        onSubmit={handleSubmit(onSubmit)}
        title={selected ? 'Modifier le propriétaire' : 'Ajouter un propriétaire'}
        description={selected ? 'Mettez à jour ses informations' : 'Enregistrer un nouveau propriétaire'}
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
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Nom *
            </label>
            <input
              type="text"
              {...register('name', { required: 'Requis' })}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            />
            {errors.name && <p className="mt-1 text-xs font-semibold text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Téléphone *
            </label>
            <input
              type="text"
              {...register('phone', { required: 'Requis' })}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              placeholder="+224 6XX XX XX XX"
            />
            {errors.phone && <p className="mt-1 text-xs font-semibold text-red-500">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Notes
            </label>
            <textarea
              rows={2}
              {...register('notes')}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>
      </DrawerForm>
    </>
  )
}
