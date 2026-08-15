import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiStarLine,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import DrawerForm from '@/components/DrawerForm'
import { getPackages, savePackage, deletePackage } from '@/lib/services/servicePricing'

const formatGNF = (value) => `${Number(value || 0).toLocaleString('fr-FR')} GNF`

export default function PricingPackagesTab({
  collectionName,
  title,
  description,
  priceLabel = 'Prix (GNF)',
  priceSuffix = 'GNF',
  showPriceDisplay = false,
  showDelayDays = false,
}) {
  const colors = useColors()
  const [packages, setPackages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

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
        setPackages(await getPackages(collectionName))
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [collectionName])

  const openAdd = () => {
    setSelected(null)
    reset({
      name: '',
      priceGNF: '',
      priceDisplay: '',
      description: '',
      delayDays: '',
      features: '',
      recommended: false,
    })
    setDrawerOpen(true)
  }

  const openEdit = (pkg) => {
    setSelected(pkg)
    reset({
      name: pkg.name,
      priceGNF: pkg.priceGNF,
      priceDisplay: pkg.priceDisplay || '',
      description: pkg.description || '',
      delayDays: pkg.delayDays || '',
      features: (pkg.features || []).join('\n'),
      recommended: !!pkg.recommended,
    })
    setDrawerOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = {
        id: selected?.id,
        name: data.name,
        priceGNF: Number(data.priceGNF),
        description: data.description,
        features: data.features
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean),
        recommended: !!data.recommended,
      }
      if (showPriceDisplay) payload.priceDisplay = data.priceDisplay
      if (showDelayDays) payload.delayDays = Number(data.delayDays) || 0

      const saved = await savePackage(collectionName, payload)

      if (selected) {
        setPackages((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
        notify('Offre modifiée avec succès', 'success')
      } else {
        setPackages((prev) => [...prev, saved].sort((a, b) => a.priceGNF - b.priceGNF))
        notify('Offre ajoutée avec succès', 'success')
      }
      setDrawerOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  const handleDelete = async (pkg) => {
    try {
      await deletePackage(collectionName, pkg.id)
      setPackages((prev) => prev.filter((p) => p.id !== pkg.id))
      setDeleteConfirm(null)
      notify('Offre supprimée avec succès', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  return (
    <>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
            style={{ backgroundColor: colors.primary }}
          >
            <RiAddLine className="h-4 w-4" />
            Ajouter une offre
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : packages.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-sm text-gray-400">Aucune offre configurée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {packages.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{pkg.name}</p>
                    {pkg.recommended && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ backgroundColor: colors.primaryVeryLight, color: colors.primary }}
                      >
                        <RiStarLine className="h-3 w-3" />
                        Recommandée
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">{pkg.description}</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: colors.primary }}>
                    {pkg.priceDisplay || formatGNF(pkg.priceGNF)}
                    {showDelayDays && pkg.delayDays ? ` · ${pkg.delayDays} jours` : ''}
                  </p>
                  {pkg.features?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {pkg.features.map((f) => (
                        <span key={f} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {deleteConfirm === pkg.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Confirmer ?</span>
                      <button
                        onClick={() => handleDelete(pkg)}
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
                        onClick={() => openEdit(pkg)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                        title="Modifier"
                      >
                        <RiEditLine className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(pkg.id)}
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

      <DrawerForm
        open={drawerOpen}
        setOpen={setDrawerOpen}
        onSubmit={handleSubmit(onSubmit)}
        title={selected ? "Modifier l'offre" : 'Ajouter une offre'}
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
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Nom de l'offre *
            </label>
            <input
              type="text"
              {...register('name', { required: 'Requis' })}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Standard"
            />
            {errors.name && <p className="mt-1 text-xs font-semibold text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                {priceLabel} *
              </label>
              <input
                type="number"
                {...register('priceGNF', { required: 'Requis' })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={priceSuffix === '%' ? 'Ex: 10' : 'Ex: 500000'}
              />
              {errors.priceGNF && (
                <p className="mt-1 text-xs font-semibold text-red-500">{errors.priceGNF.message}</p>
              )}
            </div>
            {showDelayDays && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Délai (jours)
                </label>
                <input
                  type="number"
                  {...register('delayDays')}
                  className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: 10"
                />
              </div>
            )}
          </div>

          {showPriceDisplay && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Texte affiché pour le prix *
              </label>
              <input
                type="text"
                {...register('priceDisplay', { required: 'Requis' })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: 10% du loyer mensuel"
              />
              {errors.priceDisplay && (
                <p className="mt-1 text-xs font-semibold text-red-500">{errors.priceDisplay.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Description *
            </label>
            <textarea
              rows={2}
              {...register('description', { required: 'Requis' })}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Description courte de l'offre"
            />
            {errors.description && (
              <p className="mt-1 text-xs font-semibold text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Caractéristiques (une par ligne)
            </label>
            <textarea
              rows={4}
              {...register('features')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={'Ex:\nRecherche locataire\nRédaction du bail'}
            />
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('recommended')} className="h-4 w-4 rounded border-gray-300" />
            <span className="text-sm font-semibold text-gray-700">
              Mettre en avant comme offre recommandée
            </span>
          </label>
        </div>
      </DrawerForm>
    </>
  )
}
