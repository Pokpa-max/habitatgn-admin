import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Switch } from '@headlessui/react'
import { RiImage2Fill, RiCheckLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import { getFeaturedAdSettings, updateFeaturedAdSettings } from '@/lib/services/siteSettings'
import PagePreview from './PagePreview'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function FeaturedAdTab() {
  const colors = useColors()
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)

  const { register, handleSubmit, reset, control, watch } = useForm()
  const imageFiles = watch('image')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const settings = await getFeaturedAdSettings()
        reset({ enabled: settings.enabled, linkUrl: settings.linkUrl })
        setCurrentImageUrl(settings.imageUrl)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [reset])

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

  const onSubmit = async ({ enabled, linkUrl, image }) => {
    const file = image?.[0] || null
    if (enabled && !file && !currentImageUrl) {
      notify('Ajoutez une image avant d\'activer la publicité', 'error')
      return
    }
    setSaving(true)
    try {
      await updateFeaturedAdSettings({ enabled, linkUrl: linkUrl || '/contact' }, file, currentImageUrl)
      const settings = await getFeaturedAdSettings()
      setCurrentImageUrl(settings.imageUrl)
      setPreviewUrl(null)
      notify('Publicité vedette mise à jour', 'success')
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Publicité vedette</h2>
          <p className="mt-1 text-sm text-gray-500">
            Bannière affichée une fois par session aux visiteurs du site public
          </p>
        </div>

        <Controller
          control={control}
          name="enabled"
          defaultValue={false}
          render={({ field }) => (
            <Switch.Group as="div" className="flex items-center gap-3">
              <Switch.Label as="span" className="text-sm font-semibold text-gray-700">
                {field.value ? 'Activée' : 'Désactivée'}
              </Switch.Label>
              <Switch
                checked={field.value}
                onChange={field.onChange}
                className={classNames(
                  field.value ? '' : 'bg-gray-200',
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none'
                )}
                style={field.value ? { backgroundColor: colors.primary } : undefined}
              >
                <span
                  aria-hidden="true"
                  className={classNames(
                    field.value ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                  )}
                />
              </Switch>
            </Switch.Group>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
            Image actuelle
          </label>
          <div
            className="w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            style={{ aspectRatio: '16 / 9' }}
          >
            {currentImageUrl ? (
              <img src={currentImageUrl} alt="Publicité actuelle" className="h-full w-full object-cover" />
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
          <div
            className="w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-200 bg-gray-50"
            style={{ aspectRatio: '16 / 9' }}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Aperçu" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center px-2 text-center text-xs text-gray-400">
                Aucune nouvelle image
              </div>
            )}
          </div>
          <label
            htmlFor="featured-ad-file-upload"
            className="mt-2 inline-block cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
            style={{ backgroundColor: colors.primary }}
          >
            Choisir une image
            <input id="featured-ad-file-upload" {...register('image')} type="file" accept="image/*" className="sr-only" />
          </label>
        </div>
      </div>

      <div className="mt-6">
        <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
          Lien de destination
        </label>
        <input
          type="text"
          {...register('linkUrl')}
          className="w-full max-w-md rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
          placeholder="/lands ou /contact"
        />
        <p className="mt-1 text-xs text-gray-500">Page vers laquelle le clic sur la publicité renvoie</p>
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
      highlight="top-banner"
      caption="Bandeau affiché une fois par session, sur toutes les pages, au-dessus du menu"
    />
    </div>
  )
}
