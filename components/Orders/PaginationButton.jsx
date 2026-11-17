import { RiArrowDownSLine } from 'react-icons/ri'

/**
 * « Afficher plus » pour les listes chargées par morceaux depuis la base
 * (ex. Utilisateurs). Les listes déjà chargées utilisent components/ui/Pagination.
 */
function PaginationButton({ getmoreData, className = '' }) {
  return (
    <div className={`mt-5 flex items-center justify-center border-t border-gray-100 pt-4 ${className}`}>
      <button
        type="button"
        onClick={() => getmoreData()}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        Afficher plus
        <RiArrowDownSLine className="h-4 w-4" />
      </button>
    </div>
  )
}
export default PaginationButton
