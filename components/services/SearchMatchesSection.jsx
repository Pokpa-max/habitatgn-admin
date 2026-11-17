import { useEffect, useState } from 'react'
import { RiCheckLine, RiExternalLinkLine, RiWhatsappLine } from 'react-icons/ri'
import { ModalSection, whatsappUrl } from '@/components/ui/AdminModal'
import { useColors } from '@/contexts/ColorContext'
import { useCanManage } from '@/hooks/useCanManage'
import { getMatchingListings } from '@/lib/services/searchMatches'
import { updateServiceRequest } from '@/lib/services/serviceRequests'
import { notify } from '@/utils/toast'

const SIGNATURE = ['Service client BâtiMoo', 'Cherchez moins. Trouvez mieux.']
const SHOWN = 8

const shortDate = (value) => {
  const date = new Date(value)
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/** Message WhatsApp : sélection de biens, chacun avec prix, lieu et lien. */
const selectionMessage = (request, items) => {
  const name = String(request.name || '').trim()
  const lines = [
    `Bonjour${name ? ` ${name}` : ''},`,
    '',
    items.length > 1
      ? `Voici ${items.length} biens correspondant à votre recherche :`
      : 'Voici un bien correspondant à votre recherche :',
    '',
  ]
  items.forEach((item, index) => {
    lines.push(
      `${index + 1}. *${item.title}*${item.place ? ` — ${item.place}` : ''}`,
      `   ${item.priceLabel} · Réf. ${item.ref}`,
      `   ${item.url}`,
      ''
    )
  })
  lines.push(
    items.length > 1
      ? 'Indiquez-nous ceux qui vous intéressent : nous organisons les visites.'
      : "S'il vous intéresse, nous organisons la visite.",
    '',
    'Cordialement,',
    `*${SIGNATURE[0]}*`,
    `_${SIGNATURE[1]}_`
  )
  return lines.join('\n')
}

/**
 * Fiche d'une recherche confiée : annonces du site qui correspondent aux
 * critères. Le conseiller coche, envoie la sélection sur WhatsApp ; les biens
 * envoyés restent marqués « Proposé le … » pour ne pas les renvoyer.
 */
export default function SearchMatchesSection({ request, onUpdated }) {
  const colors = useColors()
  const canProcess = useCanManage('services', 'process')
  const [matches, setMatches] = useState(null)
  const [selected, setSelected] = useState([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    setMatches(null)
    setSelected([])
    setShowAll(false)
    getMatchingListings(request)
      .then((rows) => !cancelled && setMatches(rows))
      .catch(() => !cancelled && setMatches([]))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.id])

  const proposed = Array.isArray(request.proposedListings) ? request.proposedListings : []
  const proposedOn = (id) => proposed.find((p) => p.id === id)?.sentAt
  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const chosen = (matches || []).filter((m) => selected.includes(m.id))
  const sendHref = chosen.length ? whatsappUrl(request.phone, selectionMessage(request, chosen)) : null

  // À l'envoi : les biens sont notés comme proposés (le lien WhatsApp s'ouvre en même temps)
  const recordSent = async () => {
    if (!chosen.length || !canProcess) return
    const sentAt = new Date().toISOString()
    const next = [
      ...proposed.filter((p) => !selected.includes(p.id)),
      ...chosen.map((m) => ({ id: m.id, collection: m.collection, title: m.title, ref: m.ref, sentAt })),
    ]
    try {
      await updateServiceRequest(request.id, { proposedListings: next })
      onUpdated?.(request.id, { proposedListings: next })
      setSelected([])
    } catch (e) {
      notify("Les biens envoyés n'ont pas pu être notés", 'error')
    }
  }

  const visible = (matches || []).slice(0, showAll ? undefined : SHOWN)

  return (
    <ModalSection title="Biens correspondants">
      {matches === null ? (
        <p className="text-sm text-gray-500">Recherche des annonces…</p>
      ) : matches.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-500">
          Aucune annonce en ligne ne correspond pour le moment.
        </p>
      ) : (
        <>
          <p className="mb-2 text-xs text-gray-500">
            {matches.length} annonce{matches.length > 1 ? 's' : ''} en ligne · cochez celles à envoyer au client
          </p>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {visible.map((item) => {
              const isSelected = selected.includes(item.id)
              const sentAt = proposedOn(item.id)
              return (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(item.id)}
                      disabled={!canProcess}
                      className="h-4 w-4 shrink-0 rounded border-gray-300"
                      style={{ accentColor: colors.primary }}
                    />
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="h-11 w-14 shrink-0 rounded-md object-cover" loading="lazy" />
                    ) : (
                      <span className="h-11 w-14 shrink-0 rounded-md bg-gray-100" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900">{item.title}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {item.place || '—'}
                        {!item.zoneMatch && ' · autre zone'}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold text-gray-900">{item.priceLabel}</span>
                      {sentAt && <span className="block text-[11px] text-gray-500">Proposé le {shortDate(sentAt)}</span>}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      aria-label={`Voir l'annonce ${item.ref}`}
                      title="Voir l'annonce"
                    >
                      <RiExternalLinkLine className="h-4 w-4" />
                    </a>
                  </label>
                </li>
              )
            })}
          </ul>
          {matches.length > SHOWN && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 text-xs font-semibold text-gray-600 hover:text-gray-900">
              {showAll ? 'Afficher moins' : `Afficher les ${matches.length - SHOWN} autres`}
            </button>
          )}

          {canProcess && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {sendHref ? (
                <a
                  href={sendHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={recordSent}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <RiWhatsappLine className="h-4 w-4" style={{ color: colors.whatsapp }} />
                  Envoyer {chosen.length} bien{chosen.length > 1 ? 's' : ''} au client
                </a>
              ) : (
                <span className="text-xs text-gray-500">Cochez un ou plusieurs biens pour les envoyer sur WhatsApp.</span>
              )}
              {proposed.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <RiCheckLine className="h-3.5 w-3.5" />
                  {proposed.length} bien{proposed.length > 1 ? 's' : ''} déjà proposé{proposed.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </ModalSection>
  )
}
