import { RiUserLine } from 'react-icons/ri'
import { firebaseDateFormat } from '../../utils/date'
import { useColors } from '../../contexts/ColorContext'
export const columnsUser = [
  {
    Header: 'Profile',
    accessor: 'image_url',
    Cell: (data) => {
      const colors = useColors()
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
           
            <div
  className="rounded-full p-1"
  style={{ backgroundColor: colors.primary }}
>
  <RiUserLine className="h-10 w-10 p-2 text-white" />
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
 
]
