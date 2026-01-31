import Link from 'next/link'
import { firebaseDateFormat } from '../../utils/date'

export const columnsDailyRental = [
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
            className="h-10 w-10 bg-gray-100 object-cover rounded"
          />
        </div>
      )
    },
  },
  {
    Header: 'Type Logement',
    accessor: 'houseType',
    Cell: (data) => {
      const typeLabel = data?.label || 'N/A'
      return (
        <div className="flex items-center justify-start space-x-1 py-4 pl-4 pr-3">
          <div className="group whitespace-pre-wrap text-sm font-bold text-gray-900 sm:pl-6">
             <span className="group-hover:text-primary group-hover:underline">
                {typeLabel}
             </span>
             <p className="w-2/4 truncate whitespace-nowrap font-stratos-light text-sm text-gray-500">
              Journalier
            </p>
          </div>
        </div>
      )
    },
  },
  {
    Header: 'Prix / Jour',
    accessor: 'pricePerDay',
    Cell: (data) => {
      return (
        <div className="flex-col py-4">
          <div className="text-black-900 whitespace-nowrap px-3 text-sm font-bold">
            {data ? new Intl.NumberFormat('fr-GN').format(data) : 0} GNF
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
            {data?.commune?.label || 'N/A'}
          </div>
          <div className="whitespace-nowrap px-3 text-sm text-gray-500">
            {data?.town?.label || 'Conakry'}
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
