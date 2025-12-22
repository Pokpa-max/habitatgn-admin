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
        @keyframes slideIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .table-row {
          animation: slideIn 0.3s ease-out;
          transition: all 0.3s ease;
        }

        .table-row:hover {
          background-color: ${colors.gray50};
        }

        .action-btn {
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          transform: scale(1.1);
        }

        .search-input {
          transition: all 0.3s ease;
        }

        .search-input:focus {
          border-color: ${colors.primary};
          box-shadow: 0 0 0 3px ${colors.primaryVeryLight};
        }

        .badge-active {
          background-color: #D1FAE5;
          color: #065F46;
          border: 1px solid #6EE7B7;
        }

        .badge-inactive {
          background-color: #FEE2E2;
          color: #991B1B;
          border: 1px solid #FCA5A5;
        }

        .table-header {
          background: linear-gradient(90deg, ${colors.gray50} 0%, ${colors.gray100} 100%);
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
                  style={{ color: colors.gray400 }}
                />
                <input
                  id="search"
                  name="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input w-full rounded-lg border-2 bg-white py-3 pl-10 pr-4 text-sm font-medium"
                  style={{
                    borderColor: colors.gray200,
                    color: colors.gray900,
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
              className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-bold text-white transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
              }}
            >
              <RiAddLine className="h-5 w-5" />
              Ajouter un logement
            </button>
          </div>

          {/* Table Section */}
          <div
            className="overflow-hidden rounded-xl shadow-md"
            style={{ borderColor: colors.gray200 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Table Header */}
                <thead className="table-header">
                  <tr>
                    {columnsHouse.map((column, index) => (
                      <th
                        key={index}
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider"
                        style={{ color: colors.gray700 }}
                      >
                        {column.Header}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: colors.gray700 }}
                    >
                      Statut
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: colors.gray700 }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody
                  className="divide-y"
                  style={{ borderColor: colors.gray200 }}
                >
                  {filteredHouses && filteredHouses.length > 0 ? (
                    filteredHouses.map((row, index) => (
                      <tr
                        key={index}
                        className="table-row"
                        style={{ backgroundColor: colors.white }}
                      >
                        {columnsHouse.map((column, idx) => {
                          const cell = row[column.accessor]
                          const element = column.Cell?.(cell) ?? cell
                          return (
                            <td
                              key={idx}
                              className="px-6 py-4 text-sm"
                              style={{ color: colors.gray700 }}
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
                            className="badge-active cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all hover:shadow-md"
                            style={
                              row.isAvailable
                                ? {
                                    backgroundColor: '#D1FAE5',
                                    color: '#065F46',
                                    border: `1px solid #6EE7B7`,
                                  }
                                : {
                                    backgroundColor: '#FEE2E2',
                                    color: '#991B1B',
                                    border: `1px solid #FCA5A5`,
                                  }
                            }
                          >
                            {row.isAvailable ? 'Disponible' : 'Occupé'}
                          </button>
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                setSelectedHouse(row)
                                setOpenDrawer(true)
                              }}
                              type="button"
                              className="action-btn inline-flex items-center justify-center rounded-lg p-2 transition-all"
                              style={{
                                backgroundColor: colors.primaryVeryLight,
                                color: colors.primary,
                              }}
                              title="Modifier"
                            >
                              <RiFileEditLine className="h-4 w-4" />
                            </button>

                            {/* View Button */}
                            <button
                              onClick={() => {
                                router?.push(`${router.pathname}/${row.id}`)
                              }}
                              type="button"
                              className="action-btn inline-flex items-center justify-center rounded-lg p-2 transition-all"
                              style={{
                                backgroundColor: `${colors.primaryLight}20`,
                                color: colors.primaryLight,
                              }}
                              title="Voir détails"
                            >
                              <RiProfileLine className="h-4 w-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                setSelectedHouse(row)
                                setOpenWarning(true)
                              }}
                              type="button"
                              className="action-btn inline-flex items-center justify-center rounded-lg p-2 transition-all"
                              style={{
                                backgroundColor: '#FEE2E2',
                                color: colors.error,
                              }}
                              title="Supprimer"
                            >
                              <RiDeleteRow className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={columnsHouse.length + 2}
                        className="px-6 py-12 text-center"
                      >
                        <p style={{ color: colors.gray500 }}>
                          Aucune maison trouvée
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="mt-6 flex items-center justify-between">
            <p
              className="text-sm font-semibold"
              style={{ color: colors.gray700 }}
            >
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
