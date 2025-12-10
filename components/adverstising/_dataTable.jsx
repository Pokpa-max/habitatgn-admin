import { Timestamp } from 'firebase/firestore'
import Link from 'next/link'
import { firebaseDateFormat, timeBetween } from '../../utils/date'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export const columnsSlider = [
  {
    Header: 'Id',
    accessor: 'id',
    Cell: (data) => {
      return (
        <div className="flex-col p-4 line-clamp-2">
          <p className="truncate whitespace-nowrap font-stratos-light text-sm text-gray-500">
            {data}
          </p>
        </div>
      )
    },
  },
  {
    Header: 'Slider',
    accessor: 'sliderDetails',
    Cell: (data) => {
      return (
        <div className="flex items-center justify-start space-x-1 py-4 pl-4 pr-3 ">
          <div className="group whitespace-nowrap text-sm font-bold text-gray-900 sm:pl-6">
            <Link href={'/'}>
              <a className="group-hover:text-primary group-hover:underline">
                {data.title}
              </a>
            </Link>
            <p className="truncate whitespace-nowrap font-stratos-light text-sm text-gray-500">
              {data.description}
            </p>
          </div>
        </div>
      )
    },
  },

  {
    Header: 'Type',
    accessor: 'type',
    Cell: (data) => {
      return (
        <div className="whitespace-nowrap px-3 font-stratos-light text-sm capitalize text-gray-500">
          {data}
        </div>
      )
    },
  },

  {
    Header: 'Status',
    accessor: 'isActive',
    Cell: (isActive) => {
      return (
        <span
          className={classNames(
            isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800',
            'inline-flex items-center rounded-full  px-2.5 py-0.5 text-xs font-medium '
          )}
        >
          <svg
            className={classNames(
              isActive ? 'text-green-400' : 'text-red-400',
              '-ml-0.5 mr-1.5 h-2 w-2 '
            )}
            fill="currentColor"
            viewBox="0 0 8 8"
          >
            <circle cx={4} cy={4} r={3} />
          </svg>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
  },

  {
    Header: 'Date de création',
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

export const columnsSponsor = [
  {
    Header: 'Id',
    accessor: 'id',
    Cell: (data) => {
      return (
        <div className="flex-col p-4 line-clamp-2">
          <p className="truncate whitespace-nowrap font-stratos-light text-sm text-gray-500">
            {data}
          </p>
        </div>
      )
    },
  },
  {
    Header: 'Restaurant',
    accessor: 'restaurant',
    Cell: (data) => {
      return (
        <div className="flex items-center justify-start space-x-1 py-4 pl-4 pr-3 ">
          <div className="group whitespace-nowrap text-sm font-bold text-gray-900 sm:pl-6">
            <Link href={'/'}>
              <a className="group-hover:text-primary group-hover:underline">
                {data.name}
              </a>
            </Link>
            <p className="truncate whitespace-nowrap font-stratos-light text-sm text-gray-500">
              {data.id}
            </p>
          </div>
        </div>
      )
    },
  },
  {
    Header: 'Type',
    accessor: 'type',
    Cell: (data) => {
      return (
        <div className="whitespace-nowrap px-3 font-stratos-light text-sm capitalize text-gray-500">
          {data}
        </div>
      )
    },
  },
  {
    Header: 'Date de debut',
    accessor: 'periode',
    Cell: (data) => {
      return (
        <div className="flex-col py-4">
          <div className="whitespace-nowrap px-3 font-stratos-light text-sm text-gray-500">
            {firebaseDateFormat(data.startDate)}
          </div>
        </div>
      )
    },
  },
  {
    Header: 'Periode',
    accessor: 'periode',
    Cell: (data) => {
      return (
        <div className="whitespace-nowrap px-3 font-stratos-light text-sm capitalize text-gray-500">
          {timeBetween(Timestamp.fromDate(new Date()), data.endDate)}/
          <span className="font-semibold text-gray-900">
            {timeBetween(data.startDate, data.endDate)} jours
          </span>
        </div>
      )
    },
  },
  {
    Header: 'Status',
    accessor: 'isActive',
    Cell: (isActive) => {
      return (
        <span
          className={classNames(
            isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800',
            'inline-flex items-center rounded-full  px-2.5 py-0.5 text-xs font-medium '
          )}
        >
          <svg
            className={classNames(
              isActive ? 'text-green-400' : 'text-red-400',
              '-ml-0.5 mr-1.5 h-2 w-2 '
            )}
            fill="currentColor"
            viewBox="0 0 8 8"
          >
            <circle cx={4} cy={4} r={3} />
          </svg>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
  },

  {
    Header: 'Date de création',
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

export const columnsCommercial = [
  {
    Header: 'Image',
    accessor: 'imageUrl',
    Cell: (data) => {
      return (
        <div className="flex-col p-4 line-clamp-2">
          <img
            className="h-10 w-10 rounded-full object-center"
            src={`${data}`}
            alt=""
          />
          {/* <p className="truncate whitespace-nowrap font-stratos-light text-sm text-gray-500">
            {data}
          </p> */}
        </div>
      )
    },
  },
  {
    Header: 'Titre',
    accessor: 'title',
    Cell: (data) => {
      return (
        <div className="flex items-center justify-start space-x-1 py-4 pl-4 pr-3 ">
          <div className="group whitespace-nowrap text-sm font-bold text-gray-900 sm:pl-6">
            <Link href={'/'}>
              <a className="group-hover:text-primary group-hover:underline">
                {data}
              </a>
            </Link>
          </div>
        </div>
      )
    },
  },
  {
    Header: 'Sous titre',
    accessor: 'slogan',
    Cell: (data) => {
      return (
        <div className="flex items-center justify-start space-x-1 py-4 pl-4 pr-3 ">
          <div className="group whitespace-nowrap text-sm font-bold text-gray-900 sm:pl-6">
            {data}
          </div>
        </div>
      )
    },
  },

  {
    Header: 'Date de création',
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

export const columnsCollection = [
  {
    Header: 'Id',
    accessor: 'id',
    Cell: (data) => {
      return (
        <div className="flex-col p-4 line-clamp-2">
          <p className="truncate whitespace-nowrap font-stratos-light text-sm text-gray-500">
            {data}
          </p>
        </div>
      )
    },
  },
  {
    Header: 'Titre',
    accessor: 'title',
    Cell: (data) => {
      return (
        <div className="flex items-center justify-start space-x-1 py-4 pl-4 pr-3 ">
          <div className="group whitespace-nowrap text-sm font-bold text-gray-900 sm:pl-6">
            <Link href={'/'}>
              <a className="group-hover:text-primary group-hover:underline">
                {data}
              </a>
            </Link>
          </div>
        </div>
      )
    },
  },
  {
    Header: 'Restaurants',
    accessor: 'restaurants',
    Cell: (data) => {
      return (
        <div className="flex-col py-4">
          <div className="text-black-900 whitespace-nowrap px-3 text-sm font-bold">
            {data[0].label}
          </div>
          <div className="whitespace-nowrap px-3 text-sm font-light text-gray-500">
            + {data.length - 1} autres restaurants
          </div>
        </div>
      )
    },
  },
  {
    Header: 'Date de création',
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
