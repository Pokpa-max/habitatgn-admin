import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { RiImage2Fill, RiCheckLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import PagePreview from './PagePreview'
import { getHeroSettings, updateHeroSettings } from '@/lib/services/siteSettings'

const HERO_IMAGE_FIELDS = ['slideImage1', 'slideImage2', 'slideImage3']
const TITLE_PLACEHOLDERS = [
  'Trouvez votre\nlogement idéal',
  'Des artisans\nprès de chez vous',
  'Investissez dans\nvotre terrain',
]

export default function HeroTab() {
  const colors = useColors()
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentSlides, setCurrentSlides] = useState([])
  const [previewUrls, setPreviewUrls] = useState(['', '', ''])
  const { register, handleSubmit, control, reset, setValue } = useForm()
  const imageFiles = useWatch({ control, name: HERO_IMAGE_FIELDS }) || []

  const loadSettings = async () => {
    const settings = await getHeroSettings()
    const slides = [...(settings.slides || []), {}, {}, {}].slice(0, 3)
    setCurrentSlides(slides)
    slides.forEach((slide, index) => setValue(`slideTitle${index}`, slide.title || ''))
  }

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        await loadSettings()
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const objectUrls = imageFiles.map((files) => (files?.[0] ? URL.createObjectURL(files[0]) : ''))
    setPreviewUrls(objectUrls)
    return () => objectUrls.filter(Boolean).forEach((url) => URL.revokeObjectURL(url))
  }, [imageFiles])

  const onSubmit = async (data) => {
    const files = HERO_IMAGE_FIELDS.map((field) => data[field]?.[0] || null)
    const slides = Array.from({ length: 3 }, (_, index) => ({
      imageUrl: currentSlides[index]?.imageUrl || '',
      title: data[`slideTitle${index}`] || '',
    }))

    setSaving(true)
    try {
      await updateHeroSettings(files, slides)
      reset()
      await loadSettings()
      notify('Slides de la section héros mises à jour', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  if (isLoading) {
    return <div className="flex h-48 items-center justify-center"><Loader color="#111827" /></div>
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Section héros (page d'accueil)</h2>
          <p className="mt-1 text-sm text-gray-500">
            Chaque slide contient une image et son titre. Utilisez Entrée dans le titre pour créer une nouvelle ligne.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {HERO_IMAGE_FIELDS.map((field, index) => {
            const imageUrl = previewUrls[index] || currentSlides[index]?.imageUrl
            return (
              <div key={field} className="rounded-lg border border-gray-100 p-3">
                <p className="mb-2 text-sm font-semibold text-gray-900">Slide {index + 1}</p>
                <div className="aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {imageUrl ? (
                    <img src={imageUrl} alt={`Slide héros ${index + 1}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><RiImage2Fill className="h-8 w-8 text-gray-300" /></div>
                  )}
                </div>
                <label
                  htmlFor={`hero-file-upload-${index}`}
                  className="mt-2 inline-block cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all hover:shadow-md"
                  style={{ backgroundColor: colors.primary }}
                >
                  {imageUrl ? 'Remplacer l’image' : 'Choisir une image'}
                  <input id={`hero-file-upload-${index}`} {...register(field)} type="file" accept="image/*" className="sr-only" />
                </label>
                <label className="mb-1 mt-3 block text-xs font-semibold text-gray-700">Titre</label>
                <textarea
                  {...register(`slideTitle${index}`)}
                  rows={2}
                  placeholder={TITLE_PLACEHOLDERS[index]}
                  className="w-full resize-none rounded-lg border border-gray-200 px-2.5 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex justify-end">
          {saving ? (
            <div className="inline-flex justify-center rounded-lg px-6 py-2 text-sm font-semibold text-white" style={{ backgroundColor: colors.primary }}><Loader /></div>
          ) : (
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:shadow-md" style={{ backgroundColor: colors.primary }}>
              <RiCheckLine className="h-4 w-4" /> Enregistrer les slides
            </button>
          )}
        </div>
      </form>

      <PagePreview highlight="hero" caption="Première section de la page d'accueil, juste sous le menu" />
    </div>
  )
}
