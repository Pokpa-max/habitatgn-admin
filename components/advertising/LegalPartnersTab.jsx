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
import { uploadToCloudinary } from '@/utils/cloudinary'
import {
  getPartners,
  addPartner,
  editPartner,
  deletePartner,
  togglePartnerAvailable,
} from '@/lib/services/partners'
import { CONAKRY_COMMUNES } from '../../_data'
import { useCanManage } from '@/hooks/useCanManage'

const TYPE_LABELS = {
  notaire: 'Cabinet Notarial',
  juriste: 'Cabinet Juridique',
  autre: 'Bureau Technique',
}

export default function LegalPartnersTab() {
  const colors = useColors()
  const canProcess = useCanManage('advertising', 'process')
  const canDelete = useCanManage('advertising', 'delete')
  const [partners, setPartners] = useState([])
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
        const data = await getPartners()
        setPartners(data)
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
      setPreviewUrl(selected?.logo || null)
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
      contactPerson: '',
      type: 'notaire',
      specialty: '',
      phone: '',
      commune: '',
    })
    setPreviewUrl(null)
    setDrawerOpen(true)
  }

  const openEdit = (partner) => {
    setSelected(partner)
    reset({
      name: partner.name,
      contactPerson: partner.contactPerson || '',
      type: partner.type,
      specialty: partner.specialty,
      phone: partner.phone,
      commune: partner.commune,
    })
    setPreviewUrl(partner.logo || null)
    setDrawerOpen(true)
  }

  const onSubmit = async ({ logoFile, ...data }) => {
    if (!canProcess) return
    setSaving(true)
    try {
      let logo = selected?.logo || ''
      const file = logoFile?.[0]
      if (file) {
        logo = await uploadToCloudinary(file)
      }

      if (selected) {
        await editPartner(selected.id, { ...data, logo })
        setPartners((prev) =>
          prev.map((p) => (p.id === selected.id ? { ...p, ...data, logo } : p))
        )
        notify('Partenaire modifié avec succès', 'success')
      } else {
        const created = await addPartner({ ...data, logo, available: true })
        setPartners((prev) => [...prev, created])
        notify('Partenaire ajouté avec succès', 'success')
      }
      setDrawerOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  const handleToggleAvailable = async (partner) => {
    if (!canProcess) return
    const nextAvailable = !partner.available
    try {
      await togglePartnerAvailable(partner.id, nextAvailable)
      setPartners((prev) =>
        prev.map((p) => (p.id === partner.id ? { ...p, available: nextAvailable } : p))
      )
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const handleDelete = async (partner) => {
    if (!canDelete) return
    try {
      await deletePartner(partner.id)
      setPartners((prev) => prev.filter((p) => p.id !== partner.id))
      setDeleteConfirm(null)
      notify('Partenaire supprimé avec succès', 'success')
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
            <h2 className="text-lg font-bold text-gray-900">Partenaires légaux</h2>
            <p className="mt-1 text-sm text-gray-500">
              Répertoire de notaires, juristes et bureaux techniques
            </p>
          </div>
          {canProcess && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
              style={{ backgroundColor: colors.primary }}
            >
              <RiAddLine className="h-4 w-4" />
              Ajouter
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : partners.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
            <RiTeamLine className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">Aucun partenaire enregistré</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {partners.map((partner) => (
              <div key={partner.id} className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                    {partner.logo ? (
                      <img src={partner.logo} alt={partner.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <RiImage2Fill className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{partner.name}</p>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: colors.primaryVeryLight, color: colors.primary }}
                      >
                        {TYPE_LABELS[partner.type] || partner.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{partner.specialty}</p>
                    <p className="mt-0.5 text-xs capitalize text-gray-400">
                      {partner.commune} · {partner.phone}
                      {partner.contactPerson ? ` · ${partner.contactPerson}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {deleteConfirm === partner.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Confirmer ?</span>
                      <button
                        onClick={() => handleDelete(partner)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                        style={{ backgroundColor: colors.error }}
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
                      {canProcess && (
                        <button
                          onClick={() => handleToggleAvailable(partner)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: partner.available ? colors.success : colors.gray400 }}
                          />
                          {partner.available ? 'Disponible' : 'Indisponible'}
                        </button>
                      )}
                      {canProcess && (
                        <button
                          onClick={() => openEdit(partner)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                          title="Modifier"
                        >
                          <RiEditLine className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteConfirm(partner.id)}
                          className="rounded-lg border border-gray-200 p-2 transition-colors hover:bg-red-50"
                          style={{ color: colors.error }}
                          title="Supprimer"
                        >
                          <RiDeleteBinLine className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-600">
          Ce répertoire n'est pour l'instant affiché sur aucune page du site public — il est prêt côté
          admin, en attente d'un emplacement dédié sur le site.
        </p>
      </div>
      </div>

      <DrawerForm
        open={drawerOpen}
        setOpen={setDrawerOpen}
        onSubmit={handleSubmit(onSubmit)}
        title={selected ? 'Modifier le partenaire' : 'Ajouter un partenaire'}
        description={
          selected ? 'Mettez à jour les informations' : 'Remplissez le formulaire'
        }
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
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Nom du cabinet / entreprise *
            </label>
            <input
              type="text"
              {...register('name', { required: 'Requis' })}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Étude Notariale Diallo & Associés"
            />
            {errors.name && <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Personne à contacter
            </label>
            <input
              type="text"
              {...register('contactPerson')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Me Mariama Diallo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Type *
              </label>
              <select
                {...register('type', { required: true })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="notaire">Cabinet Notarial</option>
                <option value="juriste">Cabinet Juridique</option>
                <option value="autre">Bureau Technique</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Commune *
              </label>
              <select
                {...register('commune', { required: 'Requis' })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sélectionner</option>
                {CONAKRY_COMMUNES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.commune && <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.commune.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Spécialité *
            </label>
            <input
              type="text"
              {...register('specialty', { required: 'Requis' })}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Transactions foncières & successions"
            />
            {errors.specialty && <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.specialty.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Téléphone *
            </label>
            <input
              type="tel"
              {...register('phone', { required: 'Requis' })}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+224 6XX XXX XXX"
            />
            {errors.phone && <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.phone.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
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
                htmlFor="partner-logo-upload"
                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
                style={{ backgroundColor: colors.primary }}
              >
                Choisir un logo
                <input id="partner-logo-upload" {...register('logoFile')} type="file" accept="image/*" className="sr-only" />
              </label>
            </div>
          </div>
        </div>
      </DrawerForm>
    </>
  )
}
