import { RiUserLine } from 'react-icons/ri'
import { firebaseDateFormat } from '../../utils/date'


export const columnsUser = [
  {
    Header: 'Profil',
    accessor: 'image_url',
    Cell: (data) => (
      <div className="flex items-center justify-center">
        {data ? (
          <img
            src={data}
            alt="Profil"
            className="h-10 w-10 rounded-full object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <RiUserLine className="h-6 w-6" />
          </div>
        )}
      </div>
    ),
  },

  {
    Header: 'Nom',
    accessor: 'name',
    Cell: (data ,id) => (
      <div className="flex flex-col">
        <div className="px-1 py-1 text-sm font-light">
          {data}
        </div>
       <div className="px-1 py-1 text-sm font-light">
        {id}
       </div>
      </div>
    ),
  },
  {
    Header: 'Rôle',
    accessor: 'type',
    Cell: (data) => {
      let label = data
      let colorClass = 'bg-gray-100 text-gray-800'

      switch (data) {
        case 'admin':
          label = 'Administrateur'
          colorClass = 'bg-purple-100 text-purple-800'
          break
        case 'manager':
          label = 'Manager'
          colorClass = 'bg-green-100 text-green-800'
          break
        case 'customer':
          label = 'Client'
          colorClass = 'bg-blue-100 text-blue-800'
          break
        default:
          label = data || 'Inconnu'
      }

      return (
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${colorClass}`}
        >
          {label}
        </span>
      )
    },
  },
  {
    Header: 'Email',
    accessor: 'email',
    Cell: (data) => (
      <div className="whitespace-nowrap px-3 py-4 text-sm font-light text-gray-500">
        {data}
      </div>
    ),
  },
  {
    Header: 'Date de création',
    accessor: 'createdAt',
    Cell: (data) => (
      <p className="px-3 text-sm text-gray-500">
        {firebaseDateFormat(data)}
      </p>
    ),
  },
]


