import { useEffect, useRef, useState } from 'react'
import { RiAddLine, RiCheckLine, RiCloseLine, RiDeleteBinLine, RiEditLine, RiImageAddLine, RiUserLine } from 'react-icons/ri'
import AdminModal, { ModalButton, ModalSection } from '@/components/ui/AdminModal'
import { useColors } from '@/contexts/ColorContext'
import { updateWorkerProfile } from '@/lib/services/workers'
import { uploadToCloudinary } from '@/utils/cloudinary'
import { notify } from '@/utils/toast'
import { ALL_COMMUNES, WORKER_PRICE_RANGES, WORKER_SPECIALTIES } from '../../../_data'

const MAX_REALIZATIONS = 12

const specialtyLabel = (value) => WORKER_SPECIALTIES.find((s) => s.value === value)?.label || value

const fromWorker = (worker) => ({
  name: worker?.name || '',
  phone: worker?.phone || '',
  whatsapp: worker?.whatsapp || '',
  accountType: worker?.accountType === 'enterprise' ? 'enterprise' : 'individual',
  specialties: Array.isArray(worker?.specialties) ? worker.specialties : [],
  communes: Array.isArray(worker?.communes) ? worker.communes : [],
  description: worker?.description || '',
  experienceYears: worker?.experienceYears ?? '',
  priceRange: worker?.priceRange || '',
  imageUrl: worker?.imageUrl || '',
  realizations: Array.isArray(worker?.realizations) ? worker.realizations : [],
})

/** Liste d'étiquettes : celles déjà choisies (retirables) + une liste pour en ajouter. */
function TagPicker({ values, onChange, options, placeholder, render = (v) => v, allowFree = false }) {
  const [free, setFree] = useState('')
  const add = (value) => {
    const v = String(value || '').trim()
    if (v && !values.includes(v)) onChange([...values, v])
  }
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {values.length === 0 && <span className="text-xs text-gray-400">Aucune</span>}
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-2.5 pr-1 text-xs font-medium text-gray-700">
            {render(v)}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="rounded-full p-0.5 hover:bg-gray-200" aria-label={`Retirer ${render(v)}`}>
              <RiCloseLine className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          value=""
          onChange={(e) => add(e.target.value)}
          className="h-9 min-w-[11rem] flex-1 rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
        >
          <option value="">{placeholder}</option>
          {options
            .filter((o) => !values.includes(o.value))
            .map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
        </select>
        {allowFree && (
          <>
            <input
              value={free}
              onChange={(e) => setFree(e.target.value.slice(0, 40))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  add(free)
                  setFree('')
                }
              }}
              placeholder="Autre…"
              className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 text-sm focus:border-gray-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                add(free)
                setFree('')
              }}
              className="h-9 rounded-lg border border-gray-200 px-2.5 text-gray-600 hover:bg-gray-50"
              aria-label="Ajouter"
            >
              <RiAddLine className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Modification du profil public d'un ouvrier par l'équipe : photo, type
 * (particulier / entreprise), infos et réalisations.
 */
export default function EditWorkerModal({ worker, open, setOpen, onSaved }) {
  const colors = useColors()
  const [form, setForm] = useState(fromWorker(worker))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const photoInput = useRef(null)
  const realizationInput = useRef(null)

  useEffect(() => {
    if (open) {
      setForm(fromWorker(worker))
      setNewTitle('')
    }
  }, [open, worker])

  if (!worker) return null
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const upload = async (file, kind) => {
    if (!file) return null
    setUploading(kind)
    try {
      return await uploadToCloudinary(file)
    } catch (e) {
      notify("L'image n'a pas pu être envoyée", 'error')
      return null
    } finally {
      setUploading('')
    }
  }

  const changePhoto = async (event) => {
    const url = await upload(event.target.files?.[0], 'photo')
    event.target.value = ''
    if (url) set({ imageUrl: url })
  }

  const addRealization = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, MAX_REALIZATIONS - form.realizations.length)
    event.target.value = ''
    const added = []
    for (const file of files) {
      const url = await upload(file, 'realization')
      if (url) added.push({ title: newTitle.trim(), imageUrl: url })
    }
    if (added.length) {
      setForm((prev) => ({ ...prev, realizations: [...prev.realizations, ...added] }))
      setNewTitle('')
    }
  }

  const save = async () => {
    if (!form.name.trim()) return notify('Le nom est requis', 'error')
    if (!form.specialties.length) return notify('Indiquez au moins une spécialité', 'error')
    setSaving(true)
    try {
      const changes = await updateWorkerProfile(worker.id, form)
      onSaved?.(changes)
      notify('Profil mis à jour', 'success')
      setOpen(false)
    } catch (e) {
      notify("Le profil n'a pas pu être enregistré", 'error')
    } finally {
      setSaving(false)
    }
  }

  const field = 'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none'
  const label = 'mb-1 block text-xs font-semibold text-gray-600'

  return (
    <AdminModal
      open={open}
      onClose={() => !saving && !uploading && setOpen(false)}
      eyebrow="Ouvrier"
      title={`Modifier le profil de ${worker.name || "l'ouvrier"}`}
      meta={<span>Ces informations s&apos;affichent sur le site</span>}
      icon={RiEditLine}
      size="lg"
      footer={
        <>
          <ModalButton onClick={() => setOpen(false)} disabled={saving || Boolean(uploading)}>
            Annuler
          </ModalButton>
          <ModalButton variant="primary" onClick={save} loading={saving} disabled={Boolean(uploading)} icon={RiCheckLine}>
            Enregistrer
          </ModalButton>
        </>
      }
    >
      {/* Photo + type */}
      <ModalSection title="Photo et type">
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100">
            {form.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <RiUserLine className="h-7 w-7 text-gray-300" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={changePhoto} />
            <ModalButton onClick={() => photoInput.current?.click()} loading={uploading === 'photo'} icon={RiImageAddLine}>
              {form.imageUrl ? 'Changer la photo' : 'Ajouter une photo'}
            </ModalButton>
            {form.imageUrl && (
              <ModalButton variant="quiet-danger" onClick={() => set({ imageUrl: '' })} icon={RiDeleteBinLine}>
                Retirer
              </ModalButton>
            )}
          </div>
          <div className="ml-auto grid grid-cols-2 rounded-lg p-1" style={{ backgroundColor: colors.gray100 }} role="radiogroup" aria-label="Type">
            {[
              { value: 'individual', label: 'Particulier' },
              { value: 'enterprise', label: 'Entreprise' },
            ].map((option) => {
              const selected = form.accountType === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => set({ accountType: option.value })}
                  className={`h-9 rounded-md px-4 text-sm transition ${selected ? 'font-bold' : 'font-medium'}`}
                  style={{ backgroundColor: selected ? '#FFFFFF' : 'transparent', color: selected ? colors.gray900 : colors.gray600, boxShadow: selected ? '0 1px 3px rgba(15,23,42,0.12)' : 'none' }}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </ModalSection>

      {/* Infos */}
      <ModalSection title="Informations">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block sm:col-span-3">
            <span className={label}>{form.accountType === 'enterprise' ? "Nom de l'entreprise" : 'Nom complet'}</span>
            <input value={form.name} onChange={(e) => set({ name: e.target.value.slice(0, 80) })} className={field} />
          </label>
          <label className="block">
            <span className={label}>Téléphone</span>
            <input value={form.phone} onChange={(e) => set({ phone: e.target.value.slice(0, 20) })} className={field} inputMode="tel" />
          </label>
          <label className="block">
            <span className={label}>WhatsApp</span>
            <input value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value.slice(0, 20) })} className={field} inputMode="tel" />
          </label>
          <label className="block">
            <span className={label}>Années d&apos;expérience</span>
            <input value={form.experienceYears} onChange={(e) => set({ experienceYears: e.target.value.replace(/\D/g, '').slice(0, 2) })} className={field} inputMode="numeric" />
          </label>
          <label className="block sm:col-span-3">
            <span className={label}>Tarif indicatif</span>
            <select value={form.priceRange} onChange={(e) => set({ priceRange: e.target.value })} className={field}>
              <option value="">Non précisé</option>
              {WORKER_PRICE_RANGES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <span className={label}>Spécialités</span>
            <TagPicker
              values={form.specialties}
              onChange={(specialties) => set({ specialties })}
              options={WORKER_SPECIALTIES.filter((s) => s.value !== 'autre')}
              placeholder="Ajouter une spécialité…"
              render={specialtyLabel}
              allowFree
            />
          </div>
          <div>
            <span className={label}>Communes d&apos;intervention</span>
            <TagPicker
              values={form.communes}
              onChange={(communes) => set({ communes })}
              options={ALL_COMMUNES.map((c) => ({ value: c.label, label: c.label }))}
              placeholder="Ajouter une commune…"
            />
          </div>
        </div>
        <label className="mt-3 block">
          <span className={label}>Description</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set({ description: e.target.value.slice(0, 1500) })}
            className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
          />
        </label>
      </ModalSection>

      {/* Réalisations */}
      <ModalSection title={`Réalisations (${form.realizations.length}/${MAX_REALIZATIONS})`}>
        {form.realizations.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {form.realizations.map((r, index) => (
              <div key={`${r.imageUrl}-${index}`} className="overflow-hidden rounded-lg border border-gray-200">
                <div className="relative aspect-square bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.imageUrl} alt={r.title} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => set({ realizations: form.realizations.filter((_, i) => i !== index) })}
                    className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-gray-600 shadow hover:text-red-600"
                    aria-label="Retirer cette réalisation"
                  >
                    <RiDeleteBinLine className="h-4 w-4" />
                  </button>
                </div>
                <input
                  value={r.title}
                  onChange={(e) =>
                    set({ realizations: form.realizations.map((x, i) => (i === index ? { ...x, title: e.target.value.slice(0, 60) } : x)) })
                  }
                  placeholder="Titre"
                  className="w-full border-t border-gray-100 px-2 py-1.5 text-xs focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}
        {form.realizations.length < MAX_REALIZATIONS && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value.slice(0, 60))}
              placeholder="Titre (ex. Carrelage salle de bain)"
              className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 px-3 text-sm focus:border-gray-400 focus:outline-none"
            />
            <input ref={realizationInput} type="file" accept="image/*" multiple className="hidden" onChange={addRealization} />
            <ModalButton onClick={() => realizationInput.current?.click()} loading={uploading === 'realization'} icon={RiImageAddLine}>
              Ajouter des photos
            </ModalButton>
          </div>
        )}
      </ModalSection>
    </AdminModal>
  )
}
