import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiImage2Fill, RiCheckLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import PagePreview from './PagePreview'
import { getHeroSettings, updateHeroSettings } from '@/lib/services/siteSettings'

export default function HeroTab() {
  const colors = useColors()
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)

  const { register, handleSubmit, watch } = useForm()
  const imageFiles = watch('backgroundImage')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const settings = await getHeroSettings()
        setCurrentImageUrl(settings.backgroundImageUrl)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const file = imageFiles?.[0]
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [imageFiles])

  const onSubmit = async (data) => {
    const file = data.backgroundImage?.[0] || null
    if (!file) {
      notify('Sélectionnez une image', 'error')
      return
    }
    setSaving(true)
    try {
      await updateHeroSettings(file, currentImageUrl)
      const settings = await getHeroSettings()
      setCurrentImageUrl(settings.backgroundImageUrl)
      setPreviewUrl(null)
      notify('Image de la section héro mise à jour', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader color="#111827" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Section héro (page d'accueil)</h2>
        <p className="mt-1 text-sm text-gray-500">
          Image de fond affichée en haut de la page d'accueil du site public
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
            Image actuelle
          </label>
          <div className="aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {currentImageUrl ? (
              <img src={currentImageUrl} alt="Héro actuel" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <RiImage2Fill className="h-8 w-8 text-gray-300" />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
            Nouvelle image (aperçu)
          </label>
          <div className="aspect-video overflow-hidden rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
            {previewUrl ? (
              <img src={previewUrl} alt="Aperçu" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Aucune nouvelle image sélectionnée
              </div>
            )}
          </div>
          <label
            htmlFor="hero-file-upload"
            className="mt-2 inline-block cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
            style={{ backgroundColor: colors.primary }}
          >
            Choisir une image
            <input id="hero-file-upload" {...register('backgroundImage')} type="file" accept="image/*" className="sr-only" />
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        {saving ? (
          <div className="inline-flex justify-center rounded-lg px-6 py-2 text-sm font-semibold text-white" style={{ backgroundColor: colors.primary }}>
            <Loader />
          </div>
        ) : (
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:shadow-md"
            style={{ backgroundColor: colors.primary }}
          >
            <RiCheckLine className="h-4 w-4" />
            Enregistrer
          </button>
        )}
      </div>
    </form>

    <PagePreview
      highlight="hero"
      caption="Première section de la page d'accueil, juste sous le menu"
    />
    </div>
  )
}
