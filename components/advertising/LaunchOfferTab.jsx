import { useEffect, useState } from 'react'
import { Switch } from '@headlessui/react'
import { RiCheckLine, RiInformationLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import {
  getLaunchOfferSettings,
  saveLaunchOfferSettings,
  DEFAULT_LAUNCH_OFFER_TEXT,
} from '@/lib/services/siteSettings'
import PagePreview from './PagePreview'
import { useCanManage } from '@/hooks/useCanManage'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function LaunchOfferTab() {
  const colors = useColors()
  const canProcess = useCanManage('advertising', 'process')
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [text, setText] = useState('')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const settings = await getLaunchOfferSettings()
        setEnabled(settings.enabled)
        setText(settings.text || '')
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!canProcess) return
    setSaving(true)
    try {
      await saveLaunchOfferSettings({ enabled, text })
      notify('Offre de lancement mise à jour', 'success')
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
            <h2 className="text-lg font-bold text-gray-900">Offre de lancement</h2>
            <p className="mt-1 text-sm text-gray-500">
              Bandeau d'annonce modifiable en temps réel (document Firestore <code>site_settings/launch_offer</code>).
            </p>
          </div>

          <Switch.Group as="div" className="flex shrink-0 items-center gap-3">
            <Switch.Label as="span" className="text-sm font-semibold text-gray-700">
              {enabled ? 'Activée' : 'Désactivée'}
            </Switch.Label>
            <Switch
              checked={enabled}
              onChange={(val) => canProcess && setEnabled(val)}
              disabled={!canProcess}
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

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-700">
              Texte d'annonce ou d'offre de lancement (modifiable en temps réel)
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!canProcess}
              placeholder={DEFAULT_LAUNCH_OFFER_TEXT}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            />
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900">
            <RiInformationLine className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-xs space-y-1">
              <p className="font-semibold">Valeur par défaut si champ vide :</p>
              <p className="italic">
                « {DEFAULT_LAUNCH_OFFER_TEXT} »
              </p>
              <p className="text-amber-700 font-normal">
                Si aucun texte n'est saisi en base de données, la bannière affiche par défaut le message professionnel ci-dessus.
              </p>
            </div>
          </div>
        </div>

        {canProcess && (
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
        )}
      </div>

      <PagePreview
        highlight="top-banner"
        caption="Bandeau d'offre de lancement affiché sur les pages du site public"
      />
    </div>
  )
}
