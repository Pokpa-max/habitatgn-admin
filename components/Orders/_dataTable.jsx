import Link from 'next/link'
import {
  firebaseDateFormat,
  firebaseDateHour,
  firebaseDateToJsDate,
  firebaseHour,
  getCurrentDate,
  getCurrentDateHour,
  getCurrentHour,
} from '../../utils/date'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const statuses = [
  <p className="w-min whitespace-nowrap rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-500">
    En cours de confirmation
  </p>,
  <p className="w-min whitespace-nowrap rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-500">
    En cours de préparation
  </p>,
  <p className="bg-orange-1 w-min00 whitespace-nowrap rounded-full px-2 py-1 text-xs text-orange-500">
    En cours de livraison
  </p>,
  <p className="w-min whitespace-nowrap rounded-full bg-green-100 px-2 py-1 text-xs text-green-500">
    Commande terminé
  </p>,
  <p className="w-min whitespace-nowrap rounded-full bg-red-100 px-2 py-1 text-xs text-red-500">
    Rejete par le restaurant
  </p>,
  <p className="w-min whitespace-nowrap rounded-full bg-red-100 px-2 py-1 text-xs text-red-500">
    Commande annulé
  </p>,
  <p className="w-min whitespace-nowrap rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-500">
    Pres pour recupération
  </p>,
]

export const columnsOrder = [
  {
    Header: 'id',
    accessor: 'id',
    Cell: (data) => {
      return (
        <div className="flex items-center justify-start space-x-1 py-4 pl-4 pr-3 ">
          <p className="truncate whitespace-nowrap font-stratos-light text-sm text-gray-500">
            #{data}
          </p>
        </div>
      )
    },
  },
  {
    Header: 'Restaurant',
    accessor: 'restaurantName',
    Cell: (data) => {
      return (
        <div className="flex items-center justify-start space-x-1 py-4 pl-4 pr-3 ">
          <p className="whitespace-nowrap text-sm font-bold text-gray-900 sm:pl-6">
            {data}
          </p>
        </div>
      )
    },
  },
  {
    Header: 'Avancement',
    accessor: 'status',
    Cell: (data) => {
      return statuses[data]
    },
  },

  {
    Header: 'Etat commande',
    accessor: 'completed',
    Cell: (completed) => {
      return (
        <span
          className={classNames(
            completed
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800',
            'inline-flex items-center rounded-full  px-2.5 py-0.5 text-xs font-medium '
          )}
        >
          <svg
            className={classNames(
              completed ? 'text-green-400' : 'text-red-400',
              '-ml-0.5 mr-1.5 h-2 w-2 '
            )}
            fill="currentColor"
            viewBox="0 0 8 8"
          >
            <circle cx={4} cy={4} r={3} />
          </svg>
          {completed ? 'Terminé' : 'En cour'}
        </span>
      )
    },
  },
  {
    Header: 'Date de création',
    accessor: 'createdAt',
    Cell: (data) => {
      return (
        <div className="flex flex-col items-start justify-start space-x-1 py-4 pl-4 pr-3 ">
          <p className="whitespace-nowrap px-3 font-stratos-light text-sm text-gray-500">
            {firebaseDateFormat(data)}
          </p>
          <p className="whitespace-nowrap px-3 text-sm text-gray-500">
            {firebaseHour(data)}
          </p>
        </div>
      )
    },
  },
]
