import { RiUserLine } from 'react-icons/ri'
import { firebaseDateFormat } from '../../utils/date'
export const columnsUser = [
  {
    Header: 'Profile',
    accessor: 'image_url',
    Cell: (data) => {
      const imageProfil = data ?? ''
      return (
        <div className="flex items-center justify-center space-x-2 whitespace-nowrap px-3 text-sm font-light text-gray-500">
          {imageProfil ? (
            <div className="">
              <img
                src={imageProfil}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full bg-gray-100"
              />
            </div>
          ) : (
            <div className="rounded-full border border-gray-500">
              <RiUserLine className="h-10 w-10 rounded-full p-2 " />
            </div>
          )}
        </div>
      )
    },
  },
  {
    Header: 'Nom',
    accessor: 'name',
    Cell: (data, id) => {
      return (
        <div className="flex flex-col justify-between">
          <div className="whitespace-nowrap px-1 py-1 text-sm text-base  font-light">
            {data}
          </div>
          <div className="text-gray-500">{id}</div>
        </div>
      )
    },
  },
  {
    Header: 'Email',
    accessor: 'email',
    Cell: (data) => {
      return (
        <div className="whitespace-nowrap px-3 py-4 text-sm font-light text-gray-500">
          {data}
        </div>
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
        </div>
      )
    },
  },
  // {
  //   Header: 'Etat',
  //   accessor: 'desabled',
  //   Cell: (data) => {
  //     console.log('voir etat', data)
  //       <div className="">
  //         {data ? (
  //           <p className=" text-xs font-semibold text-red-800 ">Inactif</p>
  //         ) : (
  //           <p className="mr-2  text-sm font-semibold text-green-800 ">Actif</p>
  //         )}
  //       </div>
  //     )
  //   },
  // },
]
