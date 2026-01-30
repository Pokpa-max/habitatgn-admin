// export default AdvertisinglsList
import React, { useEffect, useState } from 'react'
import { columnsCommercial } from './_dataTable'

import {
  RiDeleteRow,
  RiFileCopy2Line,
  RiSearchLine,
  RiAddLine,
} from 'react-icons/ri'
import ConfirmModal from '../ConfirmModal'
import { getAdvertising, deleteAdvertising } from '@/lib/services/marketing'

import AdvertisingFormDrawer from './advertisingFromDrawer'
import { OrderSkleton } from '../Orders/OrdersList'
import { useColors } from '../../contexts/ColorContext'
function AdvertisinglsList() {
  const [commercials, setCommercials] = useState([])
  const [selectedCommercial, setSelectedCommercial] = useState(null)
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = getAdvertising(setCommercials)
    setLoading(false)
    return () => {
      unsubscribe()
    }
  }, [isLoading])

  return (
    <CommercialsTable
      selectedCommercial={selectedCommercial}
      setSelectedCommercial={setSelectedCommercial}
      commercials={commercials}
      isLoading={isLoading}
    />
  )
}

function CommercialsTable({
  selectedCommercial,
  setSelectedCommercial,
  commercials,
  isLoading,
}) {
  const colors = useColors()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openWarning, setOpenWarning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCommercials = commercials.filter((commercial) =>
    Object.values(commercial).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return isLoading ? (
    <OrderSkleton />
  ) : (
    <div className="space-y-8">
      <ConfirmModal
        confirmFunction={async () => {
          deleteAdvertising(selectedCommercial.id, selectedCommercial.imageUrl)
          setOpenWarning(false)
        }}
        cancelFuction={() => {}}
        title="Suppression Commercial"
        description={
          "Êtes-vous sûr de supprimer cette annonce ? L'action est irréversible"
        }
        open={openWarning}
        setOpen={setOpenWarning}
      />
      <AdvertisingFormDrawer
        commercial={selectedCommercial}
        open={openDrawer}
        setOpen={setOpenDrawer}
      />

      {/* Original Header - Agrandis */}
      <div className="gap-8 sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <div className="flex flex-1 items-center">
            <div className="w-full">
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
                  className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-3 leading-5 placeholder-gray-500 focus:border-cyan-500 focus:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm"
                  placeholder="Rechercher une annonce..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:flex-none">
          <button
            onClick={() => {
              setOpenDrawer(true)
              setSelectedCommercial(null)
            }}
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:translate-y-px"
            style={{
              backgroundColor: colors.primary || '#3b82f6',
            }}
          >
            <RiAddLine className="h-5 w-5" />
            Ajouter une panière
          </button>
        </div>
      </div>

      {/* Nouveau Tableau */}
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columnsCommercial.map((column, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                  >
                    {column.Header}
                  </th>
                ))}
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredCommercials?.length > 0 ? (
                filteredCommercials.map((row, index) => (
                  <tr
                    key={index}
                    className="transition-colors duration-150 hover:bg-gray-50"
                  >
                    {columnsCommercial.map((column, colIndex) => {
                      const cell = row[column.accessor]
                      const element = column.Cell?.(cell) ?? cell
                      return (
                        <td
                          key={colIndex}
                          className="whitespace-nowrap px-6 py-4 text-sm text-gray-900"
                        >
                          {element}
                        </td>
                      )
                    })}
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedCommercial(row)
                            setOpenDrawer(true)
                          }}
                          type="button"
                          className="inline-flex items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-600 transition-colors duration-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          title="Modifier"
                        >
                          <RiFileCopy2Line
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCommercial(row)
                            setOpenWarning(true)
                          }}
                          type="button"
                          className="inline-flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 transition-colors duration-200 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          title="Supprimer"
                        >
                          <RiDeleteRow className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columnsCommercial.length + 1}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <RiSearchLine className="h-8 w-8 text-gray-300" />
                      <p className="text-sm">Aucune annonce trouvée</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Counter */}
      <div className="text-right text-sm text-gray-600">
        <span className="font-medium">{filteredCommercials.length}</span>{' '}
        annonce{filteredCommercials.length !== 1 ? 's' : ''} trouvée
        {filteredCommercials.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

export default AdvertisinglsList
