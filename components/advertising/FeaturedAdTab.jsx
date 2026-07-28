import { useEffect, useRef, useState } from 'react'
import { Switch } from '@headlessui/react'
import {
  RiImage2Fill,
  RiCheckLine,
  RiAddLine,
  RiDeleteBinLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiLoader4Line,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import {
  getFeaturedAdSettings,
  saveFeaturedAdSettings,
  uploadFeaturedAdImage,
  removeFeaturedAdImage,
} from '@/lib/services/siteSettings'
import PagePreview from './PagePreview'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function FeaturedAdTab() {
  const colors = useColors()
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [ads, setAds] = useState([])
  const [uploadingNew, setUploadingNew] = useState(false)
  const [replacingIndex, setReplacingIndex] = useState(null)

  const addInputRef = useRef(null)
  const replaceInputRef = useRef(null)
  const replaceTargetIndex = useRef(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const settings = await getFeaturedAdSettings()
        setEnabled(settings.enabled)
        setAds(settings.ads)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const handleAddFiles = async (files) => {
    setUploadingNew(true)
    try {
      for (const file of Array.from(files)) {
        const imageUrl = await uploadFeaturedAdImage(file)
        setAds((prev) => [...prev, { imageUrl, linkUrl: '/contact' }])
      }
    } catch (e) {
      notify("Echec de l'envoi de l'image", 'error')
    }
    setUploadingNew(false)
  }

  const handleReplaceFile = async (file, index) => {
    setReplacingIndex(index)
    try {
      const oldUrl = ads[index]?.imageUrl
      const imageUrl = await uploadFeaturedAdImage(file)
      setAds((prev) => prev.map((ad, i) => (i === index ? { ...ad, imageUrl } : ad)))
      if (oldUrl) removeFeaturedAdImage(oldUrl)
    } catch (e) {
      notify("Echec de l'envoi de l'image", 'error')
    }
    setReplacingIndex(null)
  }

  const removeAd = (index) => {
    const oldUrl = ads[index]?.imageUrl
    setAds((prev) => prev.filter((_, i) => i !== index))
    if (oldUrl) removeFeaturedAdImage(oldUrl)
  }

  const moveAd = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= ads.length) return
    setAds((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const updateLinkUrl = (index, linkUrl) => {
    setAds((prev) => prev.map((ad, i) => (i === index ? { ...ad, linkUrl } : ad)))
  }

  const handleSave = async () => {
    if (enabled && ads.length === 0) {
      notify("Ajoutez au moins une image avant d'activer la publicité", 'error')
      return
    }
    setSaving(true)
    try {
      await saveFeaturedAdSettings({ enabled, ads })
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
      <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Publicité vedette</h2>
            <p className="mt-1 text-sm text-gray-500">
              Bannière affichée une fois par session aux visiteurs du site public. Plusieurs images
              défilent automatiquement toutes les 5 secondes.
            </p>
          </div>

          <Switch.Group as="div" className="flex shrink-0 items-center gap-3">
            <Switch.Label as="span" className="text-sm font-semibold text-gray-700">
              {enabled ? 'Activée' : 'Désactivée'}
            </Switch.Label>
            <Switch
              checked={enabled}
              onChange={setEnabled}
              className={classNames(
                enabled ? '' : 'bg-gray-200',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none'
              )}
              style={enabled ? { backgroundColor: colors.primary } : undefined}
            >
              <span
                aria-hidden="true"
                className={classNames(
                  enabled ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                )}
              />
            </Switch>
          </Switch.Group>
        </div>

        {/* Liste des images */}
        <div className="space-y-3">
          {ads.map((ad, index) => (
            <div key={ad.imageUrl + index} className="flex gap-4 rounded-lg border border-gray-200 p-3">
              <div
                className="relative w-96 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50"
                style={{ height: '63px' }}
              >
                <img src={ad.imageUrl} alt="" className="h-full w-full object-cover" />
                {replacingIndex === index && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <RiLoader4Line className="h-4 w-4 animate-spin text-white" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    replaceTargetIndex.current = index
                    replaceInputRef.current?.click()
                  }}
                  className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-[10px] font-semibold text-white"
                >
                  Remplacer
                </button>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                  Lien de destination
                </label>
                <input
                  type="text"
                  value={ad.linkUrl}
                  onChange={(e) => updateLinkUrl(index, e.target.value)}
                  placeholder="/lands ou /contact"
                  className="w-full max-w-32 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                />
              </div>

              <div className="flex shrink-0 flex-col items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => moveAd(index, -1)}
                  disabled={index === 0}
                  className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-30"
                  aria-label="Monter"
                >
                  <RiArrowUpLine className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => moveAd(index, 1)}
                  disabled={index === ads.length - 1}
                  className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-30"
                  aria-label="Descendre"
                >
                  <RiArrowDownLine className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => removeAd(index)}
                  className="rounded p-1.5 hover:bg-red-50"
                  aria-label="Supprimer"
                >
                  <RiDeleteBinLine className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}

          {ads.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-10">
              <RiImage2Fill className="h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-400">Aucune image pour le moment</p>
            </div>
          )}
        </div>

        {/* Ajout d'images */}
        <button
          type="button"
          onClick={() => addInputRef.current?.click()}
          disabled={uploadingNew}
          className="mt-4 flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed py-4 text-sm font-semibold transition-colors hover:bg-gray-50 disabled:opacity-60"
          style={{ borderColor: colors.primary, color: colors.primary }}
        >
          {uploadingNew ? (
            <span className="flex items-center gap-2">
              <RiLoader4Line className="h-4 w-4 animate-spin" />
              Envoi en cours…
            </span>
          ) : (
            <>
              <span className="flex items-center gap-2">
                <RiAddLine className="h-4 w-4" />
                Ajouter des images
              </span>
              <span className="text-xs font-normal text-gray-500">
                Vous pouvez en sélectionner plusieurs à la fois
              </span>
            </>
          )}
        </button>

        <input
          ref={addInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            const files = e.target.files
            if (files && files.length > 0) handleAddFiles(files)
            e.target.value = ''
          }}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            const index = replaceTargetIndex.current
            if (file && index !== null) handleReplaceFile(file, index)
            e.target.value = ''
          }}
        />

        <div className="mt-6 flex justify-end">
          {saving ? (
            <div
              className="inline-flex justify-center rounded-lg px-6 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: colors.primary }}
            >
              <Loader />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:shadow-md"
              style={{ backgroundColor: colors.primary }}
            >
              <RiCheckLine className="h-4 w-4" />
              Enregistrer
            </button>
          )}
        </div>
      </div>

      <PagePreview
        highlight="top-banner"
        caption="Bandeau affiché une fois par session, sur toutes les pages, au-dessus du menu"
      />
    </div>
  )
}
