import Link from 'next/link'

export const columnsMenu = [
  {
    Header: 'Nom du menu',
    accessor: 'name',
    Cell: (data) => {
      return (
        <div className="py-4 pl-4 pr-3 text-sm font-bold text-gray-900 whitespace-nowrap hover:text-primary hover:underline sm:pl-6">
          <Link href={'/'}>
            <a>{data}</a>
          </Link>
        </div>
      )
    },
  },
  {
    Header: 'Description',
    accessor: 'description',
    Cell: (data) => {
      return (
        <div className="px-3 py-4 text-sm font-light text-gray-500 whitespace-nowrap">
          {data}
        </div>
      )
    },
  },
  {
    Header: 'Categories',
    accessor: 'categories',
    Cell: (data) => {
      return (
        <div className="px-3 py-4 text-sm font-bold text-gray-500 whitespace-nowrap">
          {data}
        </div>
      )
    },
  },
  {
    Header: 'Elements',
    accessor: 'items',
    Cell: (data) => {
      return (
        <div className="px-3 py-4 text-sm font-bold text-gray-500 whitespace-nowrap">
          {data}
        </div>
      )
    },
  },
]

export const columnsCategories = [
  {
    Header: 'Nom catégorie',
    accessor: 'name',
    Cell: (data) => {
      return (
        <div className="py-4 pl-4 pr-3 text-sm font-bold text-gray-900 whitespace-nowrap hover:text-primary hover:underline sm:pl-6">
          <Link href={'/'}>
            <a>{data}</a>
          </Link>
        </div>
      )
    },
  },
  {
    Header: 'Note',
    accessor: 'note',
    Cell: (data) => {
      return (
        <div className="px-3 py-4 text-sm font-light text-gray-500 w2/4 whitespace-nowrap">
          {data}
        </div>
      )
    },
  },
  {
    Header: 'Menus',
    accessor: 'menus',
    Cell: (data) => {
      return (
        <div className="flex-col py-4">
          <div className="px-3 text-sm font-bold text-black-900 whitespace-nowrap">
            {data[0]}
          </div>
          <div className="px-3 text-sm font-light text-gray-500 whitespace-nowrap">
            + {data.length - 1} autres menus
          </div>
        </div>
      )
    },
  },
  {
    Header: 'Elements',
    accessor: 'items',
    Cell: (data) => {
      return (
        <div className="px-3 py-4 text-sm font-bold text-gray-500 whitespace-nowrap">
          {data}
        </div>
      )
    },
  },
]

export const columnsItems = [
  {
    Header: 'Nom élément',
    accessor: 'item',
    Cell: (data) => {
      return (
        <div className="flex items-center justify-start py-4 pl-4 pr-3 space-x-1 ">
          <img
            className="object-center w-10 h-10 rounded-full"
            src={data.imgUrl}
            alt=""
          />
          <div className="text-sm font-bold text-gray-900 group whitespace-nowrap sm:pl-6">
            <Link href={'/'}>
              <a className="group-hover:text-primary group-hover:underline">
                {data.name}
              </a>
            </Link>
            <p className="text-sm font-light text-gray-500 w2/4 whitespace-nowrap">
              {data.description}
            </p>
          </div>
        </div>
      )
    },
  },

  {
    Header: 'Categories',
    accessor: 'categories',
    Cell: (data) => {
      return (
        <div className="flex-col py-4">
          <div className="px-3 text-sm font-bold text-black-900 whitespace-nowrap">
            {data[0]}
          </div>
          {data.length > 1 ? (
            <div className="px-3 text-sm font-light text-gray-500 whitespace-nowrap">
              + {data.length - 1} autres menus
            </div>
          ) : null}
        </div>
      )
    },
  },
  {
    Header: 'Nombre de commande',
    accessor: 'nbrOrder',
    Cell: (data) => {
      return (
        <div className="flex flex-col py-4 text-center">
          <p className="px-3 text-sm font-bold text-gray-500 whitespace-nowrap">
            12 cmd(s)
          </p>
        </div>
      )
    },
  },
  {
    Header: 'Chiffre d affaire',
    accessor: 'ca',
    Cell: (data) => {
      return (
        <div className="flex-col py-4">
          <p className="px-3 text-sm font-bold text-black-900 whitespace-nowrap">
            12 300 000 GNF
          </p>
        </div>
      )
    },
  },
]
