import React, { useEffect, useState } from 'react'
import { columnsBundle } from '../_dataTable'

import { RiDeleteRow, RiFileCopy2Line, RiSearchLine } from 'react-icons/ri'
import BundleFormDrawer from './BundleFormDrawer'
import { getBundles, deleteBundle } from '@/lib/services/settings'
import ConfirmModal from '../../ConfirmModal'
import { getCategories } from '../../../lib/services/settings'

function BundlesList() {
  const [bundles, setBundles] = useState([])
  const [selectedBundle, setSelectedBundle] = useState(null)

  useEffect(() => {
    const unsubscribe = getBundles(setBundles)
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <BundlesTable
      selectedBundle={selectedBundle}
      setSelectedBundle={setSelectedBundle}
      bundles={bundles}
    />
  )
}

function BundlesTable({ selectedBundle, setSelectedBundle, bundles }) {
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openWarning, setOpenWarning] = useState(false)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const unsubscribe = getCategories(setCategories)
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div className="">
      <ConfirmModal
        confirmFunction={async () => {
          deleteBundle(selectedBundle.id, selectedBundle.imageUrl)
          setOpenWarning(false)
        }}
        cancelFuction={() => {}}
        title="Suppression Bundle"
        description={
          "Etes vous sur de supprimer cette categorie ? L'action est irreversible"
        }
        open={openWarning}
        setOpen={setOpenWarning}
      />
      <BundleFormDrawer
        categories={categories}
        bundle={selectedBundle}
        open={openDrawer}
        setOpen={setOpenDrawer}
      />
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex flex-1 items-center ">
            <div className="w-full max-w-lg lg:max-w-xs">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <RiSearchLine
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full rounded-sm border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-gray-500 focus:border-primary-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                  placeholder="Rechercher un Bundle"
                  type="search"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => {
              setOpenDrawer(true)
              setSelectedBundle(null)
            }}
            type="button"
            className="hover:bg-primary-700 inline-flex items-center justify-center rounded-sm border border-transparent bg-primary-500 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            Ajouter une section
          </button>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden ring-1 ring-black ring-opacity-5 md:rounded-sm">
              <table className="min-w-full table-auto divide-y divide-gray-300 text-left">
                <thead className="bg-gray-50">
                  <tr>
                    {columnsBundle.map((column, index) => (
                      <th
                        key={index}
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold uppercase text-slate-500 sm:pl-6"
                      >
                        {column.Header}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold uppercase text-slate-500 sm:pl-6"
                    >
                      <span className="sr-only">Modifier</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {bundles?.map((row, index) => (
                    <tr key={index}>
                      {columnsBundle.map((column, index) => {
                        const cell = row[column.accessor]
                        const element = column.Cell?.(cell) ?? cell
                        return <td key={index}>{element}</td>
                      })}
                      <td className="relative flex space-x-2 whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => {
                            setSelectedBundle(row)
                            setOpenDrawer(true)
                          }}
                          type="button"
                          className="text-black-900 inline-flex items-center rounded-full border border-transparent bg-gray-200 p-3 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          <RiFileCopy2Line
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBundle(row)
                            setOpenWarning(true)
                          }}
                          type="button"
                          className="inline-flex items-center rounded-full border border-transparent bg-red-500 p-3 text-white shadow-sm hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          <RiDeleteRow className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BundlesList
