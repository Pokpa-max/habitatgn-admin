import { RiUserLine } from 'react-icons/ri'
import { firebaseDateFormat } from '../../utils/date'


export const columnsUser = [
  {
    Header: 'Profil',
    accessor: 'image_url',
    secondary: true,
    Cell: (data) => (
      <div className="flex items-center justify-center">
        {data ? (
          // no-referrer : les photos Google refusent les requêtes venant d'un autre site ;
          // image cassée -> pastille neutre (pas de texte « Profil » à la place)
          <img
            src={data}
            alt=""
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextSibling?.style.removeProperty('display')
            }}
            className="h-10 w-10 rounded-full object-cover shadow-sm"
          />
        ) : null}
        {data ? (
          <div style={{ display: 'none' }} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <RiUserLine className="h-6 w-6" />
          </div>
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
    // Nom seul : l'identifiant technique n'aide pas l'équipe
    Cell: (data) => <span className="text-sm font-medium text-gray-900">{data}</span>,
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
          colorClass = 'bg-primary-light text-primary-dark'
          break
        case 'manager':
          label = 'Manager'
          colorClass = 'bg-gray-200 text-gray-700'
          break
        case 'customer':
        case 'user':
          label = 'Client'
          colorClass = 'bg-gray-100 text-gray-800'
          break
        case 'agent':
          label = 'Agent'
          colorClass = 'bg-gray-100 text-gray-800'
          break
        case 'worker':
          label = 'Ouvrier'
          colorClass = 'bg-gray-100 text-gray-800'
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
    secondary: true,
    Cell: (data) => (
      <p className="px-3 font-mono text-sm text-gray-500">
        {firebaseDateFormat(data)}
      </p>
    ),
  },
]


