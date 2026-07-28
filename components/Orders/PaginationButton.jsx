
import { useColors } from '../../contexts/ColorContext'

function PaginationButton({ getmoreData }) {

  const colors = useColors()
  return (
    <div className="mt-5 flex items-center justify-center">
     <button
  onClick={() => getmoreData()}
  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:translate-y-px"
  style={{
    backgroundColor: colors.primary,
  }}
>
  <span className="relative rounded-md transition-all duration-75 ease-in group-hover:bg-opacity-0">
    Voir plus
  </span>
</button>
    </div>
  )
}
export default PaginationButton
