import { useRouter } from 'next/router'

function PaginationButton({ getmoreData }) {
  const router = useRouter()
  const startIndex = Number(router.query.start) || 0
  return (
    <div class="mt-5 flex items-center justify-center">
      <button
        onClick={() => getmoreData()}
        class="group relative mb-2 mr-2 inline-flex items-center justify-center 
        overflow-hidden rounded-lg bg-cyan-500
         from-purple-600 to-blue-500 p-0.5 text-sm font-medium
          text-white  focus:outline-none 
          focus:ring-4 focus:ring-blue-300 
          group-hover:from-purple-600 group-hover:to-blue-500 
          dark:text-white dark:focus:ring-blue-800"
      >
        <span
          class="relative rounded-md  px-5 py-2.5 transition-all duration-75 
        ease-in group-hover:bg-opacity-0 "
        >
          Voir plus
        </span>
      </button>
    </div>
  )
}
export default PaginationButton
