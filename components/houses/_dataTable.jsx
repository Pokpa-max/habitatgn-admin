import Link from 'next/link'
import { firebaseDateFormat } from '../../utils/date'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export const columnsHouse = [
  {
    Header: 'Image',
    accessor: 'imageUrl',
    Cell: (data) => {
      return (
        <div className="flex items-center justify-center space-x-2 whitespace-nowrap px-3 text-sm font-light text-gray-500">
          <img
            src={data}
            alt=""
            width={100}
            height={100}
            className="h-10 w-10 bg-gray-100"
          />
        </div>
      )
    },
  },
  {
    Header: 'Type Logement',
    accessor: 'houseType',
    Cell: (data) => {
      return (
        <div className="flex items-center justify-start space-x-1 py-4 pl-4 pr-3">
          <div className="group whitespace-pre-wrap text-sm font-bold text-gray-900 sm:pl-6">
            <Link href={'/'}>
              <a className="group-hover:text-primary group-hover:underline">
                {data.label}
              </a>
            </Link>
            <p className="w-2/4 truncate whitespace-nowrap font-stratos-light text-sm text-gray-500">
              3 chambres · 0 m²
            </p>
          </div>
        </div>
      )
    },
  },
  {
    Header: 'Commune',
    accessor: 'address',
    Cell: (data) => {
      return (
        <div className="flex-col py-4">
          <div className="text-black-900 whitespace-nowrap px-3 text-sm font-bold">
            {data.commune.label}
          </div>
          <div className="whitespace-nowrap px-3 text-sm text-gray-500">
            {data.town.label}
          </div>
        </div>
      )
    },
  },
  {
    Header: 'Telephone',
    accessor: 'phoneNumber',
    Cell: (data) => {
      return (
        <div className="flex-col py-4">
          <div className="text-black-900 w-2/4 truncate whitespace-nowrap px-3 text-sm font-bold">
            Bailleur
          </div>
          <div className="whitespace-nowrap px-3 font-stratos-light text-sm text-gray-500">
            {data}
          </div>
        </div>
      )
    },
  },
  {
    Header: "Date d'Ajout",
    accessor: 'createdAt',
    Cell: (data) => {
      return (
        <div className="flex-col py-4">
          <div className="whitespace-nowrap px-3 font-stratos-light text-sm text-gray-500">
            {firebaseDateFormat(data)}
          </div>
        </div>
      )
    },
  },

]
