import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiTeamLine,
  RiCheckLine,
  RiImage2Fill,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import DrawerForm from '@/components/DrawerForm'
import PagePreview from './PagePreview'
import { uploadToCloudinary } from '@/utils/cloudinary'
import {
  getPartnerAgencies,
  addPartnerAgency,
  editPartnerAgency,
  deletePartnerAgency,
  togglePartnerAgencyActive,
  slugify,
} from '@/lib/services/partnerAgencies'
import { getAgentRequests } from '@/lib/services/agentRequests'

const getInitials = (name) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

export default function PartnerAgenciesTab() {
  const colors = useColors()
  const [agencies, setAgencies] = useState([])
  const [agents, setAgents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  const logoFiles = watch('logoFile')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [agenciesData, agentsData] = await Promise.all([
          getPartnerAgencies(),
          getAgentRequests(),
        ])
        setAgencies(agenciesData)
        setAgents(agentsData.filter((a) => a.status === 'approved' && a.userId))
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const file = logoFiles?.[0]
    if (!file) {
      setPreviewUrl(selected?.logoUrl || null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [logoFiles, selected])

  const openAdd = () => {
    setSelected(null)
    reset({
      name: '',
      specialty: '',
      phone: '',
      website: '',
      color: '#BD5B37',
      ownerId: '',
    })
    setPreviewUrl(null)
    setDrawerOpen(true)
  }

  const openEdit = (agency) => {
    setSelected(agency)
    reset({
      name: agency.name,
      specialty: agency.specialty || '',
      phone: agency.phone || '',
      website: agency.website || '',
      color: agency.color || '#BD5B37',
      ownerId: agency.ownerId || '',
    })
    setPreviewUrl(agency.logoUrl || null)
    setDrawerOpen(true)
  }

  const onSubmit = async ({ logoFile, ...data }) => {
    setSaving(true)
    try {
      let logoUrl = selected?.logoUrl || ''
      const file = logoFile?.[0]
      if (file) {
        logoUrl = await uploadToCloudinary(file)
      }

      const payload = {
        ...data,
        logoUrl,
        slug: slugify(data.name),
        initials: getInitials(data.name),
      }

      if (selected) {
        await editPartnerAgency(selected.id, payload)
        setAgencies((prev) =>
          prev.map((a) => (a.id === selected.id ? { ...a, ...payload } : a))
        )
        notify('Agence modifiée avec succès', 'success')
      } else {
        const created = await addPartnerAgency({ ...payload, active: true })
        setAgencies((prev) => [...prev, created])
        notify('Agence ajoutée avec succès', 'success')
      }
      setDrawerOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  const handleToggleActive = async (agency) => {
    const nextActive = !agency.active
    try {
      await togglePartnerAgencyActive(agency.id, nextActive)
      setAgencies((prev) =>
        prev.map((a) => (a.id === agency.id ? { ...a, active: nextActive } : a))
      )
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const handleDelete = async (agency) => {
    try {
      await deletePartnerAgency(agency.id)
      setAgencies((prev) => prev.filter((a) => a.id !== agency.id))
      setDeleteConfirm(null)
      notify('Agence supprimée avec succès', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Agences partenaires sponsorisées</h2>
              <p className="mt-1 text-sm text-gray-500">
                Cartes d'agences affichées sur la page d'accueil du site public
              </p>
            </div>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
              style={{ backgroundColor: colors.primary }}
            >
              <RiAddLine className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader color="#111827" />
            </div>
          ) : agencies.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
              <RiTeamLine className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">Aucune agence partenaire enregistrée</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {agencies.map((agency) => (
                <div key={agency.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
                      style={{ backgroundColor: agency.color || colors.primary }}
                    >
                      {agency.logoUrl ? (
                        <img src={agency.logoUrl} alt={agency.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-black text-white">{agency.initials}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{agency.name}</p>
                      <p className="text-sm text-gray-500">{agency.specialty}</p>
                      <p className="mt-0.5 text-xs text-gray-400">/properties?agence={agency.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {deleteConfirm === agency.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Confirmer ?</span>
                        <button
                          onClick={() => handleDelete(agency)}
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
                          onClick={() => handleToggleActive(agency)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: agency.active ? colors.primary : colors.gray400 }}
                          />
                          {agency.active ? 'Publiée' : 'Masquée'}
                        </button>
                        <button
                          onClick={() => openEdit(agency)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                          title="Modifier"
                        >
                          <RiEditLine className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(agency.id)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-red-200 hover:text-red-500"
                          title="Supprimer"
                        >
                          <RiDeleteBinLine className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <PagePreview
          highlight="mid-section"
          caption="Section de la page d'accueil, après la liste des biens et avant les bannières « Devenir ouvrier/agent »"
        />
      </div>

      <DrawerForm
        open={drawerOpen}
        setOpen={setDrawerOpen}
        onSubmit={handleSubmit(onSubmit)}
        title={selected ? "Modifier l'agence" : 'Ajouter une agence'}
        description={selected ? 'Mettez à jour les informations' : 'Remplissez le formulaire'}
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
                  <RiCheckLine className="h-4 w-4" />
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
              Nom de l'agence *
            </label>
            <input
              type="text"
              {...register('name', { required: 'Requis' })}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              placeholder="Ex: Agence Immo Conakry"
            />
            {errors.name && <p className="mt-1 text-xs font-semibold text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Spécialité
            </label>
            <input
              type="text"
              {...register('specialty')}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              placeholder="Ex: Location & vente résidentielle"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                Téléphone
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                placeholder="+224 6XX XXX XXX"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                Site web
              </label>
              <input
                type="text"
                {...register('website')}
                className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Agent lié (optionnel)
            </label>
            <select
              {...register('ownerId')}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            >
              <option value="">Aucun</option>
              {agents.map((a) => (
                <option key={a.userId} value={a.userId}>
                  {a.fullName}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Associe cette carte à un compte agent approuvé
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Couleur du badge
            </label>
            <input
              type="color"
              {...register('color')}
              className="h-10 w-20 cursor-pointer rounded-md border border-gray-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Logo (optionnel)
            </label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {previewUrl ? (
                  <img src={previewUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <RiImage2Fill className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
              <label
                htmlFor="agency-logo-upload"
                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
                style={{ backgroundColor: colors.primary }}
              >
                Choisir un logo
                <input id="agency-logo-upload" {...register('logoFile')} type="file" accept="image/*" className="sr-only" />
              </label>
            </div>
          </div>
        </div>
      </DrawerForm>
    </>
  )
}
