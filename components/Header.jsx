import Breadcrumbs from 'nextjs-breadcrumbs'
import { RiArrowLeftLine } from 'react-icons/ri'

export default function Header({ title }) {
  return (
    <div className="py-5">
      <div>
        <nav className="sm:hidden" aria-label="Back">
          <a
            href="#"
            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <RiArrowLeftLine
              className="flex-shrink-0 w-5 h-5 mr-1 -ml-1 text-gray-400"
              aria-hidden="true"
            />
            Retour
          </a>
        </nav>
        <nav className="hidden sm:flex" aria-label="Breadcrumb">
          <ol role="list" className="flex items-center space-x-4">
            <div className="flex flex-row">
              <Breadcrumbs
                containerClassName="bread-container"
                transformLabel={(title) => title}
                rootLabel="Acceuil"
              />
            </div>
          </ol>
        </nav>
      </div>
      <div className="mt-2 md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            {title}
          </h2>
        </div>
        {/* <div className="flex flex-shrink-0 mt-4 md:mt-0 md:ml-4">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Edit
          </button>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-white border border-transparent shadow-sm bg-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Publish
          </button>
        </div> */}
      </div>
    </div>
  )
}
