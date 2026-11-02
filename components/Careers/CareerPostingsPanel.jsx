import { useEffect, useMemo, useState } from 'react'
import { RiAddLine, RiBriefcaseLine, RiDeleteBinLine, RiEditLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import StatusPill from '@/components/ui/StatusPill'
import ConfirmModal from '@/components/ConfirmModal'
import AdminModal, { ModalButton, ModalSection } from '@/components/ui/AdminModal'
import { firebaseDateFormat } from '@/utils/date'
import {
  deleteCareerPosting,
  getAllCareerPostings,
  saveCareerPosting,
} from '@/lib/services/careerPostings'

const EMPTY_FORM = {
  title: '',
  department: '',
  location: 'Conakry, Guinée',
  employmentType: 'Temps plein',
  description: '',
  requirements: '',
  status: 'draft',
}

const FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'published', label: 'Publiées' },
  { value: 'draft', label: 'Brouillons' },
]

function PostingFormField({ label, children, wide = false }) {
  return (
    <label className={`block min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1.5 block text-xs font-semibold text-gray-700">{label}</span>
      {children}
    </label>
  )
}

export default function CareerPostingsPanel({ canManage }) {
  const colors = useColors()
  const [postings, setPostings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setIsLoading(true)
    try {
      setPostings(await getAllCareerPostings())
    } catch {
      notify('Impossible de charger les offres d’emploi', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => postings.filter((posting) => {
    const statusMatches = filter === 'all' || posting.status === filter
    const term = search.trim().toLowerCase()
    const searchMatches = !term || [posting.title, posting.department, posting.location]
      .some((value) => value?.toLowerCase().includes(term))
    return statusMatches && searchMatches
  }), [postings, filter, search])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setEditorOpen(true)
  }

  const openEdit = (posting) => {
    setEditingId(posting.id)
    setForm({
      title: posting.title || '',
      department: posting.department || '',
      location: posting.location || '',
      employmentType: posting.employmentType || '',
      description: posting.description || '',
      requirements: posting.requirements || '',
      status: posting.status || 'draft',
    })
    setEditorOpen(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!canManage || saving) return
    setSaving(true)
    try {
      await saveCareerPosting({ ...form, id: editingId || undefined })
      setEditorOpen(false)
      notify(editingId ? 'Offre mise à jour' : form.status === 'published' ? 'Offre publiée' : 'Brouillon enregistré', 'success')
      await load()
    } catch {
      notify('L’offre n’a pas pu être enregistrée', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!canManage || !deleteTarget) return
    setDeleting(true)
    try {
      await deleteCareerPosting(deleteTarget.id)
      setPostings((current) => current.filter((posting) => posting.id !== deleteTarget.id))
      setDeleteTarget(null)
      notify('Offre supprimée', 'success')
    } catch {
      notify('L’offre n’a pas pu être supprimée', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const updateForm = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  const inputClass = 'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100'

  return (
    <>
      <AdminModal
        open={editorOpen}
        onClose={() => !saving && setEditorOpen(false)}
        eyebrow="Carrières"
        title={editingId ? 'Modifier l’offre d’emploi' : 'Créer une offre d’emploi'}
        meta={<span>Renseignez le poste, puis choisissez sa visibilité.</span>}
        size="lg"
        footer={
          <>
            <ModalButton onClick={() => setEditorOpen(false)} disabled={saving}>Annuler</ModalButton>
            <ModalButton variant="primary" type="submit" form="career-posting-form" loading={saving}>
              {form.status === 'published' ? 'Publier l’offre' : 'Enregistrer le brouillon'}
            </ModalButton>
          </>
        }
      >
        <form id="career-posting-form" onSubmit={handleSave} className="space-y-5">
          <ModalSection title="Informations sur le poste">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PostingFormField label="Intitulé du poste *" wide>
                <input required maxLength={120} className={inputClass} value={form.title} onChange={updateForm('title')} placeholder="Ex. Agent immobilier" />
              </PostingFormField>
              <PostingFormField label="Équipe / domaine *">
                <input required maxLength={80} className={inputClass} value={form.department} onChange={updateForm('department')} placeholder="Ex. Ventes" />
              </PostingFormField>
              <PostingFormField label="Lieu *">
                <input required maxLength={100} className={inputClass} value={form.location} onChange={updateForm('location')} placeholder="Conakry, Guinée" />
              </PostingFormField>

              <PostingFormField label="Type de contrat *">
                <input required maxLength={80} className={inputClass} value={form.employmentType} onChange={updateForm('employmentType')} placeholder="Temps plein, stage…" />
              </PostingFormField>
            </div>
          </ModalSection>

          <ModalSection title="Description et profil recherché">
            <div className="space-y-4">
              <PostingFormField label="Description du poste *" wide>
                <textarea required rows={4} maxLength={10000} className={inputClass} value={form.description} onChange={updateForm('description')} placeholder="Missions et responsabilités du poste" />
              </PostingFormField>
              <PostingFormField label="Profil recherché *" wide>
                <textarea required rows={3} maxLength={10000} className={inputClass} value={form.requirements} onChange={updateForm('requirements')} placeholder="Compétences et expérience attendues" />
              </PostingFormField>
            </div>
          </ModalSection>

          <ModalSection title="Publication">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
              <ol className="grid grid-cols-2" role="radiogroup" aria-label="Statut de publication">
                {[
                  { value: 'draft', label: 'Brouillon', description: 'Visible uniquement dans l’admin.' },
                  { value: 'published', label: 'Publiée', description: 'Visible sur le site Carrières.' },
                ].map((option, index) => {
                  const currentIndex = form.status === 'published' ? 1 : 0
                  const active = index === currentIndex
                  const complete = index < currentIndex
                  return (
                    <li key={option.value} className="relative flex flex-col items-center">
                      {index > 0 && (
                        <span
                          aria-hidden="true"
                          className="absolute right-1/2 top-4 h-0.5 w-full"
                          style={{ backgroundColor: complete || active ? colors.primary : colors.gray200 }}
                        />
                      )}
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-current={active ? 'step' : undefined}
                        onClick={() => setForm((current) => ({ ...current, status: option.value }))}
                        className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors"
                        style={active || complete
                          ? { borderColor: colors.primary, backgroundColor: colors.primary, color: '#fff' }
                          : { borderColor: colors.gray300, backgroundColor: '#fff', color: colors.gray500 }}
                      >
                        {complete ? '✓' : index + 1}
                      </button>
                      <span className={`mt-2 text-center text-xs ${active ? 'font-bold text-gray-900' : 'font-semibold text-gray-600'}`}>
                        {option.label}
                      </span>
                      <span className="mt-0.5 max-w-40 text-center text-[11px] leading-relaxed text-gray-500">
                        {option.description}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>
          </ModalSection>
        </form>
      </AdminModal>

      <ConfirmModal
        open={!!deleteTarget}
        setOpen={(open) => !open && !deleting && setDeleteTarget(null)}
        title="Supprimer cette offre ?"
        description={deleteTarget ? `L’offre « ${deleteTarget.title} » sera retirée du site et de l’administration.` : ''}
        confirmLabel="Supprimer l’offre"
        confirmFunction={handleDelete}
      />

      <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Offres d’emploi</h2>
            <p className="mt-1 text-sm text-gray-500">Créez et publiez les postes affichés sur la page Carrières.</p>
          </div>
          {canManage && (
            <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: colors.primary }}>
              <RiAddLine className="h-4 w-4" /> Nouvelle offre
            </button>
          )}
        </header>

        <div className="mb-5 flex flex-col gap-3 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto">
            {FILTERS.map((item) => {
              const count = item.value === 'all' ? postings.length : postings.filter((posting) => posting.status === item.value).length
              const active = filter === item.value
              return (
                <button key={item.value} type="button" onClick={() => setFilter(item.value)} className="flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold" style={active ? { borderColor: colors.primary, color: colors.primary } : { borderColor: 'transparent', color: colors.gray500 }}>
                  {item.label}<span className="rounded-full px-1.5 py-0.5 text-xs" style={active ? { backgroundColor: colors.primaryVeryLight, color: colors.primary } : { backgroundColor: colors.gray100, color: colors.gray500 }}>{count}</span>
                </button>
              )
            })}
          </div>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une offre…" className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 sm:mb-0 sm:w-64" />
        </div>

        {isLoading ? (
          <div className="flex h-36 items-center justify-center"><Loader color="#111827" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 px-4 text-center">
            <RiBriefcaseLine className="mb-2 h-7 w-7 text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">{postings.length ? 'Aucune offre pour ce filtre' : 'Aucune offre d’emploi'}</p>
            <p className="mt-1 text-xs text-gray-500">{postings.length ? 'Essayez un autre filtre ou une autre recherche.' : 'Créez une offre pour la rendre disponible sur la page Carrières.'}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead style={{ backgroundColor: colors.gray50 }}>
                  <tr>{['Poste', 'Lieu et contrat', 'Publication', 'Créée le', ''].map((heading) => <th key={heading} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-600">{heading}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((posting) => (
                    <tr key={posting.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3.5"><p className="text-sm font-semibold text-gray-900">{posting.title}</p><p className="mt-0.5 text-xs text-gray-500">{posting.department}</p></td>
                      <td className="px-4 py-3.5"><p className="text-sm text-gray-700">{posting.location}</p><p className="mt-0.5 text-xs text-gray-500">{posting.employmentType}</p></td>
                      <td className="px-4 py-3.5"><StatusPill tone={posting.status === 'published' ? 'success' : 'gray'}>{posting.status === 'published' ? 'Publiée' : 'Brouillon'}</StatusPill></td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-500">{posting.createdAt ? firebaseDateFormat(posting.createdAt) : '—'}</td>
                      <td className="px-4 py-3.5"><div className="flex justify-end gap-1">
                        {canManage && <>
                          <button type="button" onClick={() => openEdit(posting)} aria-label={`Modifier ${posting.title}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"><RiEditLine className="h-4 w-4" /></button>
                          <button type="button" onClick={() => setDeleteTarget(posting)} aria-label={`Supprimer ${posting.title}`} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><RiDeleteBinLine className="h-4 w-4" /></button>
                        </>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
