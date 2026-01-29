// export default HousesList
import React, { useState } from 'react'
import { columnsHouse } from './_dataTable'
import {
  RiFileEditLine,
  RiProfileLine,
  RiSearchLine,
  RiDeleteRow,
  RiAddLine,
} from 'react-icons/ri'
import { useRouter } from 'next/router'
import HouseFormDrawer from './HouseFormDrawer'
import { OrderSkleton } from '../Orders/OrdersList'
import PaginationButton from '../Orders/PaginationButton'
import DesableConfirmModal from '../DesableConfirm'
import { desableHouseToFirestore } from '../../utils/functionFactory'
import { notify } from '../../utils/toast'
import ConfirmModal from '../ConfirmModal'
import { deleteHouse } from '../../lib/services/houses'
import { useColors } from '../../contexts/ColorContext'

function HousesList({
  data,
  setData,
  houses,
  showMore,
  pagination,
  isLoading,
  isLoadingP,
}) {
  return (
    <HousesTable
      isLoading={isLoading}
      newhouses={houses}
      isLoadingP={isLoadingP}
      showMore={showMore}
      data={data}
      setData={setData}
      pagination={pagination}
    />
  )
}

function HousesTable({
  data,
  setData,
  newhouses,
  showMore,
  pagination,
  isLoading,
  isLoadingP,
}) {
  const colors = useColors()
  const [selectedHouse, setSelectedHouse] = useState(null)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [openWarning, setOpenWarning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const router = useRouter()
  data = data || {}

  const { houses, lastElement } = data

  const filteredHouses = newhouses?.filter((house) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()

    const commune = house.address?.commune?.label?.toLowerCase() || ''
    const town = house.address?.town?.label?.toLowerCase() || ''
    const description = house.description?.toLowerCase() || ''
    const houseType = house.houseType?.label?.toLowerCase() || ''
    const phoneNumber = house.phoneNumber?.toLowerCase() || ''

    return (
      commune.includes(searchLower) ||
      town.includes(searchLower) ||
      description.includes(searchLower) ||
      houseType.includes(searchLower) ||
      phoneNumber.includes(searchLower)
    )
  })

  return (
    <>
      <style>{`
        .table-row {
          transition: background-color 0.2s ease;
        }

        .table-row:hover {
          background-color: #f9fafb;
        }

        .action-btn {
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .search-input {
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: ${colors.primary || '#3b82f6'};
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .badge-available {
          background-color: #dcfce7;
          color: #166534;
        }

        .badge-occupied {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .table-header {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
      `}</style>

      {isLoading ? (
        <OrderSkleton />
      ) : (
        <div>
          {/* Modals */}
          <ConfirmModal
            confirmFunction={async () => {
              await deleteHouse(selectedHouse).then(() => {
                const update = () => {
                  const housesCopy = JSON.parse(JSON.stringify(houses))
                  const newHouses = housesCopy.filter((house) => {
                    return house.id != selectedHouse.id
                  })
                  setData({ houses: newHouses, lastElement })
                }
                update()
                notify('Maison supprimée avec succès', 'success')
              })
              setOpenWarning(false)
            }}
            cancelFuction={() => {}}
            title="Suppression de logement"
            description={
              'Êtes-vous sûr de supprimer cette annonce ? Cette action est irréversible.'
            }
            open={openWarning}
            setOpen={setOpenWarning}
          />

          <DesableConfirmModal
            desable={!selectedHouse?.isAvailable}
            title="Voulez-vous effectuer cette action"
            confirmFunction={async () => {
              await desableHouseToFirestore(
                selectedHouse.id,
                !selectedHouse?.isAvailable
              )
              const update = () => {
                const houseUpdated = houses.map((user) => {
                  const newUser = { ...user }
                  if (user.id == selectedHouse.id) {
                    newUser.isAvailable = !selectedHouse?.isAvailable
                  }
                  return newUser
                })
                setData({ houses: houseUpdated, lastElement })
              }
              update()
              notify('Action effectuée avec succès', 'success')
              setOpenModal(false)
            }}
            open={openModal}
            setOpen={setOpenModal}
          />

          <HouseFormDrawer
            data={data}
            setData={setData}
            house={selectedHouse}
            open={openDrawer}
            setOpen={setOpenDrawer}
          />

          {/* Header Section */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <RiSearchLine
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
                  style={{ color: '#9ca3af' }}
                />
                <input
                  id="search"
                  name="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm font-medium"
                  style={{
                    borderColor: '#e5e7eb',
                    color: '#111827',
                  }}
                  placeholder="Rechercher un logement..."
                  type="search"
                />
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={() => {
                setOpenDrawer(true)
                setSelectedHouse(null)
              }}
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:translate-y-px"
              style={{
                backgroundColor: colors.primary || '#3b82f6',
              }}
            >
              <RiAddLine className="h-5 w-5" />
              Ajouter
            </button>
          </div>

          {/* Table Section */}
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Table Header */}
                <thead className="table-header">
                  <tr>
                    {columnsHouse.map((column, index) => (
                      <th
                        key={index}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                      >
                        {column.Header}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                    >
                      Statut
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredHouses && filteredHouses.length > 0 ? (
                    filteredHouses.map((row, index) => (
                      <tr key={index} className="table-row">
                        {columnsHouse.map((column, idx) => {
                          const cell = row[column.accessor]
                          const element = column.Cell?.(cell) ?? cell
                          return (
                            <td
                              key={idx}
                              className="px-6 py-4 text-sm text-gray-700"
                            >
                              {element}
                            </td>
                          )
                        })}

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedHouse(row)
                              setOpenModal(true)
                            }}
                            className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-all hover:shadow-sm ${
                              row.isAvailable
                                ? 'badge-available border-green-300'
                                : 'badge-occupied border-red-300'
                            }`}
                          >
                            {row.isAvailable ? 'Disponible' : 'Occupé'}
                          </button>
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                setSelectedHouse(row)
                                setOpenDrawer(true)
                              }}
                              type="button"
                              className="action-btn inline-flex items-center justify-center rounded p-2"
                              style={{
                                backgroundColor: colors.primary || '#3b82f6',
                              }}
                              title="Modifier"
                            >
                              <RiFileEditLine className="h-4 w-4 text-white" />
                            </button>

                            {/* View Button */}
                            <button
                              onClick={() => {
                                router?.push(`${router.pathname}/${row.id}`)
                              }}
                              type="button"
                              className="action-btn inline-flex items-center justify-center rounded bg-gray-100 p-2"
                              title="Voir détails"
                            >
                              <RiProfileLine className="h-4 w-4 text-gray-700" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                setSelectedHouse(row)
                                setOpenWarning(true)
                              }}
                              type="button"
                              className="action-btn inline-flex items-center justify-center rounded bg-red-100 p-2"
                              title="Supprimer"
                            >
                              <RiDeleteRow className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={columnsHouse.length + 2}
                        className="px-6 py-12 text-center text-sm text-gray-500"
                      >
                        Aucune maison trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {filteredHouses?.length || 0} Logement
              {filteredHouses?.length !== 1 ? 's' : ''}
            </p>
            {pagination && newhouses.length > 0 && (
              <PaginationButton getmoreData={showMore} />
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default HousesList
