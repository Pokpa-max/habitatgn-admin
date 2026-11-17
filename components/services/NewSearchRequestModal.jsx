import { useState } from 'react'
import { useUser } from 'next-firebase-auth'
import { RiAddLine, RiCheckLine } from 'react-icons/ri'
import AdminModal, { ModalButton, ModalSection } from '@/components/ui/AdminModal'
import { useColors } from '@/contexts/ColorContext'
import { createServiceRequest } from '@/lib/services/serviceRequests'
import { notify } from '@/utils/toast'
import { ANY_ZONE, BEDROOM_OPTIONS, CONAKRY_NEIGHBORHOODS, WANTED_FEATURES, bedroomsText } from '@/lib/constants/searchRequest'

/**
 * Demande de recherche immobilière saisie par l'équipe : le client a appelé,
 * écrit sur WhatsApp ou est passé à l'agence. Mêmes champs que le formulaire
 * « Confiez-nous votre recherche » du site, pour qu'elle s'affiche, se paie
 * et se suive exactement comme les autres.
 */

const LEVELS = [
  { value: 'classic', label: 'Recherche classique', price: 'Gratuit' },
  { value: 'assisted', label: 'Recherche assistée', price: '50 000 GNF' },
  { value: 'full', label: 'Accompagnement complet', price: '100 000 à 200 000 GNF' },
]

const TYPES = [
  { value: 'apartment', label: 'Appartement' },
  { value: 'house', label: 'Maison' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'commercial', label: 'Local commercial' },
  { value: 'land', label: 'Terrain' },
]

const CHANNELS = ['Appel téléphonique', 'WhatsApp', "Visite à l'agence"]

// Communes les plus demandées : un clic les ajoute ; tout autre quartier se tape
const QUICK_ZONES = ['Kaloum', 'Dixinn', 'Matam', 'Ratoma', 'Matoto', 'Coyah', 'Dubréka']


const EMPTY = {
  name: '',
  phone: '',
  email: '',
  channel: CHANNELS[0],
  serviceLevel: 'classic',
  searchType: 'rent',
  propertyTypes: [],
  zones: [],
  zoneDraft: '',
  bedrooms: [],
  wishes: [],
  maxPrice: '',
  notes: '',
}

/** « 622 33 44 55 », « +224 622… », « 00224… » -> « +224 622 33 44 55 » (comme le site). */
const formatPhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('224')) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)
  if (!/^[36]\d{8}$/.test(digits)) return null
  return `+224 ${digits.replace(/^(\d{3})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4')}`
}

export default function NewSearchRequestModal({ onCreated }) {
  const colors = useColors()
  const AuthUser = useUser()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setErrors((prev) => {
      const next = { ...prev }
      Object.keys(patch).forEach((key) => delete next[key === 'zoneDraft' ? 'zones' : key])
      return next
    })
  }
  const toggle = (key, value) =>
    set({ [key]: form[key].includes(value) ? form[key].filter((v) => v !== value) : [...form[key], value] })
  const addZoneDraft = () => {
    const zone = form.zoneDraft.trim()
    if (zone && !form.zones.includes(zone)) set({ zones: [...form.zones, zone], zoneDraft: '' })
    else set({ zoneDraft: '' })
  }

  const close = () => {
    if (saving) return
    setOpen(false)
    setForm(EMPTY)
    setErrors({})
  }

  const submit = async (event) => {
    event.preventDefault()
    const zones = form.zoneDraft.trim() && !form.zones.includes(form.zoneDraft.trim())
      ? [...form.zones, form.zoneDraft.trim()]
      : form.zones
    const phone = formatPhone(form.phone)
    const maxPrice = Number(String(form.maxPrice).replace(/\D/g, ''))
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Nom du client requis'
    if (!phone) nextErrors.phone = 'Numéro guinéen à 9 chiffres (6… ou 3…)'
    if (!form.propertyTypes.length) nextErrors.propertyTypes = 'Choisissez au moins un type'
    if (!zones.length) nextErrors.zones = 'Indiquez au moins une zone'
    if (!(maxPrice > 0)) nextErrors.maxPrice = 'Budget requis'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const level = LEVELS.find((l) => l.value === form.serviceLevel) || LEVELS[0]
    const types = TYPES.filter((t) => form.propertyTypes.includes(t.value))
    const bedroomNumbers = form.bedrooms.map(Number).sort((a, b) => a - b)
    const bedroomFields = bedroomNumbers.length
      ? {
          bedrooms: bedroomNumbers[0],
          bedroomOptions: bedroomNumbers,
          ...(form.bedrooms.includes('5') ? {} : { maxBedrooms: bedroomNumbers[bedroomNumbers.length - 1] }),
        }
      : {}
    const wishLabels = WANTED_FEATURES.filter((f) => form.wishes.includes(f.key)).map((f) => f.label)
    // Même texte récapitulatif que les demandes venues du site
    const criteria = [
      `Formule : ${level.label} (${level.price})`,
      `Recherche : ${form.searchType === 'buy' ? 'Achat' : 'Location'}`,
      `Types de bien : ${types.map((t) => t.label).join(', ')}`,
      bedroomNumbers.length ? `Chambres : ${bedroomsText({ bedroomOptions: bedroomNumbers })}` : '',
      `Zones : ${zones.join(', ')}`,
      `Budget maximum : ${maxPrice.toLocaleString('fr-FR')} GNF`,
      wishLabels.length ? `Souhaits : ${wishLabels.join(', ')}` : '',
      form.notes.trim() ? `Précisions : ${form.notes.trim()}` : '',
    ].filter(Boolean)

    const data = {
      category: 'recherche-bien',
      serviceType: 'Recherche immobilière',
      name: form.name.trim(),
      phone,
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      description: criteria.join('\n'),
      searchType: form.searchType,
      propertyTypes: types.map((t) => t.value),
      propertyType: types.map((t) => t.label).join(', '),
      ...bedroomFields,
      ...(form.wishes.length ? { wantedFeatures: form.wishes } : {}),
      preferredLocations: zones.slice(0, 10),
      address: zones.join(', '),
      maxPrice,
      serviceLevel: level.value,
      serviceLevelLabel: level.label,
      servicePrice: level.price,
      // Saisie par l'équipe : canal et auteur, visibles dans la fiche
      source: 'admin',
      channel: form.channel,
      createdByName: AuthUser?.displayName || AuthUser?.email || 'Équipe BâtiMoo',
    }

    setSaving(true)
    try {
      const created = await createServiceRequest(data)
      onCreated?.(created)
      notify('Demande enregistrée', 'success')
      setSaving(false)
      close()
    } catch (e) {
      notify("La demande n'a pas pu être enregistrée", 'error')
      setSaving(false)
    }
  }

  const field = (key) =>
    `h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 ${
      errors[key] ? 'border-red-400' : 'border-gray-200'
    }`
  const label = 'mb-1.5 block text-xs font-semibold text-gray-600'
  const chip = (selected) =>
    selected
      ? { backgroundColor: colors.primary, borderColor: colors.primary, color: '#FFFFFF' }
      : { backgroundColor: '#FFFFFF', borderColor: colors.gray200, color: colors.gray700 }
  const error = (key) => errors[key] && <p className="mt-1 text-xs font-medium text-red-600">{errors[key]}</p>

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white hover:opacity-90"
        style={{ backgroundColor: colors.primary }}
      >
        <RiAddLine className="h-4 w-4" />
        Nouvelle demande
      </button>

      <AdminModal
        open={open}
        onClose={close}
        eyebrow="Recherche immobilière"
        title="Nouvelle demande pour un client"
        meta={<span>Le client a appelé, écrit ou est passé à l&apos;agence</span>}
        icon={RiAddLine}
        size="lg"
        footer={
          <>
            <ModalButton onClick={close} disabled={saving}>
              Annuler
            </ModalButton>
            <ModalButton variant="primary" type="submit" form="new-search-request" loading={saving} icon={RiCheckLine}>
              Enregistrer la demande
            </ModalButton>
          </>
        }
      >
        <form id="new-search-request" onSubmit={submit} noValidate className="space-y-6">
          <ModalSection title="Client">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={label}>Nom *</span>
                <input value={form.name} onChange={(e) => set({ name: e.target.value.slice(0, 80) })} className={field('name')} placeholder="Ex. Mamadou Diallo" />
                {error('name')}
              </label>
              <label className="block">
                <span className={label}>Téléphone *</span>
                <div className={`flex items-center ${field('phone')} px-0`}>
                  <span className="border-r border-gray-200 px-3 text-sm text-gray-500">+224</span>
                  <input
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => set({ phone: e.target.value.slice(0, 20) })}
                    className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm focus:outline-none"
                    placeholder="622 33 44 55"
                  />
                </div>
                {error('phone')}
              </label>
              <label className="block">
                <span className={label}>Email (facultatif)</span>
                <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value.slice(0, 120) })} className={field('email')} />
              </label>
              <label className="block">
                <span className={label}>Le client nous a contactés par</span>
                <select value={form.channel} onChange={(e) => set({ channel: e.target.value })} className={field('channel')}>
                  {CHANNELS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
          </ModalSection>

          <ModalSection title="Formule">
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Formule">
              {LEVELS.map((level) => {
                const selected = form.serviceLevel === level.value
                return (
                  <button
                    key={level.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set({ serviceLevel: level.value })}
                    className="rounded-lg border px-3 py-2.5 text-left transition"
                    style={{ borderColor: selected ? colors.primary : colors.gray200, backgroundColor: selected ? colors.primaryVeryLight : '#FFFFFF' }}
                  >
                    <span className="block text-sm font-semibold text-gray-900">{level.label}</span>
                    <span className="block text-xs font-medium" style={{ color: selected ? colors.primary : colors.gray500 }}>{level.price}</span>
                  </button>
                )
              })}
            </div>
          </ModalSection>

          <ModalSection title="Recherche">
            <div className="space-y-4">
              <div className="grid grid-cols-2 rounded-lg p-1" style={{ backgroundColor: colors.gray100 }} role="radiogroup" aria-label="Projet">
                {[
                  { value: 'rent', label: 'Louer' },
                  { value: 'buy', label: 'Acheter' },
                ].map((option) => {
                  const selected = form.searchType === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => set({ searchType: option.value })}
                      className={`h-9 rounded-md text-sm transition ${selected ? 'font-bold' : 'font-medium'}`}
                      style={{ backgroundColor: selected ? '#FFFFFF' : 'transparent', color: selected ? colors.gray900 : colors.gray600, boxShadow: selected ? '0 1px 3px rgba(15,23,42,0.12)' : 'none' }}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>

              <div>
                <span className={label}>Types de bien *</span>
                <div className="flex flex-wrap gap-1.5">
                  {TYPES.map((type) => (
                    <button key={type.value} type="button" aria-pressed={form.propertyTypes.includes(type.value)} onClick={() => toggle('propertyTypes', type.value)} className="h-8 rounded-full border px-3 text-[13px] font-medium" style={chip(form.propertyTypes.includes(type.value))}>
                      {type.label}
                    </button>
                  ))}
                </div>
                {error('propertyTypes')}
              </div>

              <div>
                <span className={label}>Zones souhaitées *</span>
                <label className="mb-2 inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.zones[0] === ANY_ZONE}
                    onChange={(e) => set({ zones: e.target.checked ? [ANY_ZONE] : [], zoneDraft: '' })}
                    className="h-4 w-4 rounded border-gray-300"
                    style={{ accentColor: colors.primary }}
                  />
                  Peu importe le quartier
                </label>
                {form.zones[0] !== ANY_ZONE && (
                <>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {QUICK_ZONES.map((zone) => (
                    <button key={zone} type="button" aria-pressed={form.zones.includes(zone)} onClick={() => toggle('zones', zone)} className="h-8 rounded-full border px-3 text-[13px] font-medium" style={chip(form.zones.includes(zone))}>
                      {zone}
                    </button>
                  ))}
                  {form.zones.filter((z) => !QUICK_ZONES.includes(z)).map((zone) => (
                    <button key={zone} type="button" onClick={() => toggle('zones', zone)} className="h-8 rounded-full border px-3 text-[13px] font-medium" style={chip(true)} aria-label={`Retirer ${zone}`}>
                      {zone} ×
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={form.zoneDraft}
                    onChange={(e) => set({ zoneDraft: e.target.value.slice(0, 40) })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addZoneDraft()
                      }
                    }}
                    className={field('zones')}
                    placeholder="Quartier ou ville (ex. Kipé, Lambanyi)"
                    list="search-request-neighborhoods"
                  />
                  <datalist id="search-request-neighborhoods">
                    {CONAKRY_NEIGHBORHOODS.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                  <button type="button" onClick={addZoneDraft} className="h-10 shrink-0 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    Ajouter
                  </button>
                </div>
                </>
                )}
                {error('zones')}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className={label}>Chambres (un ou plusieurs choix)</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" aria-pressed={form.bedrooms.length === 0} onClick={() => set({ bedrooms: [] })} className="h-9 whitespace-nowrap rounded-lg border px-2.5 text-[13px] font-semibold" style={chip(form.bedrooms.length === 0)}>
                      Peu importe
                    </button>
                    {BEDROOM_OPTIONS.map((value) => (
                      <button key={value} type="button" aria-pressed={form.bedrooms.includes(value)} onClick={() => toggle('bedrooms', value)} className="h-9 w-9 rounded-lg border text-[13px] font-semibold" style={chip(form.bedrooms.includes(value))}>
                        {value === '5' ? '5+' : value}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className={label}>Budget maximum *</span>
                  <div className={`flex items-center ${field('maxPrice')} px-0`}>
                    <input
                      inputMode="numeric"
                      value={Number(form.maxPrice) ? Number(form.maxPrice).toLocaleString('fr-FR') : ''}
                      onChange={(e) => set({ maxPrice: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                      className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm focus:outline-none"
                      placeholder="3 000 000"
                    />
                    <span className="px-3 text-xs font-semibold text-gray-500">GNF</span>
                  </div>
                  {error('maxPrice')}
                </label>
              </div>

              <div>
                <span className={label}>Souhaits (facultatif)</span>
                <div className="flex flex-wrap gap-1.5">
                  {WANTED_FEATURES.map((feature) => (
                    <button key={feature.key} type="button" aria-pressed={form.wishes.includes(feature.key)} onClick={() => toggle('wishes', feature.key)} className="h-8 rounded-full border px-3 text-[13px] font-medium" style={chip(form.wishes.includes(feature.key))}>
                      {feature.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className={label}>Précisions du client (facultatif)</span>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set({ notes: e.target.value.slice(0, 600) })}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  placeholder="Ex. chambre salon avec douche interne, près de la route, emménagement en janvier"
                />
              </label>
            </div>
          </ModalSection>
        </form>
      </AdminModal>
    </>
  )
}
