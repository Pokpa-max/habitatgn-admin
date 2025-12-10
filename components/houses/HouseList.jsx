import React, { useState } from 'react'
import { columnsHouse } from './_dataTable'

import {
  RiFileEditLine,
  RiProfileLine,
  RiSearchLine,
  RiDeleteRow,
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
  const [selectedHouse, setSelectedHouse] = useState(null)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [openWarning, setOpenWarning] = useState(false)

  const router = useRouter()
  data = data || {}

  const { houses, lastElement } = data

  return isLoading ? (
    <OrderSkleton />
  ) : (
    <div className="">
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
            notify('Action effectuée avec succès', 'success')
          })

          setOpenWarning(false)
        }}
        cancelFuction={() => {}}
        title="Suppression de logement"
        description={
          "Etes vous sur de supprimer cette annonce ? L'action est irreversible"
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
                  placeholder="Rechercher un logement"
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
              setSelectedHouse(null)
            }}
            type="button"
            className="focus:ring-bg-cyan-500 inline-flex items-center justify-center rounded-sm border border-transparent bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto"
          >
            Ajouter un logement
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
                    {columnsHouse.map((column, index) => (
                      <th
                        key={index}
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold uppercase text-slate-500 sm:pl-6"
                      >
                        {column.Header}
                      </th>
                    ))}
                    <th></th>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold uppercase text-slate-500 sm:pl-6"
                    >
                      <span className="sr-only">Modifier</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {newhouses?.map((row, index) => (
                    <tr key={index}>
                      {columnsHouse.map((column, index) => {
                        const cell = row[column.accessor]
                        const element = column.Cell?.(cell) ?? cell
                        return <td key={index}>{element}</td>
                      })}
                      <td className="relative flex space-x-2 whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => {
                            setSelectedHouse(row)
                            setOpenDrawer(true)
                          }}
                          type="button"
                          className="text-black-900 inline-flex items-center rounded-full border border-transparent bg-gray-200 p-3 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          <RiFileEditLine
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          onClick={() => {
                            router?.push(`${router.pathname}/${row.id}`)
                          }}
                          type="button"
                          className="text-black-900 inline-flex items-center rounded-full border border-transparent bg-gray-200 p-3 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          <RiProfileLine
                            className="h-4 w-4 "
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedHouse(row)
                            setOpenModal(true)
                          }}
                        >
                          {row.isAvailable ? (
                            <p className=" mr-2 rounded bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 text-green-800 dark:bg-green-200 dark:text-green-900">
                              Activer{' '}
                            </p>
                          ) : (
                            <p className="  mr-2  rounded bg-red-100 px-2.5 py-0.5 text-sm font-medium text-gray-500 text-red-800 dark:bg-red-200 dark:text-red-900">
                              Desactiver
                            </p>
                          )}
                        </button>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedHouse(row)
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
          <div>
            <p className="mt-5 ml-10">{newhouses.length + ' Logements'}</p>
            {pagination && newhouses.length > 0 && (
              <PaginationButton getmoreData={showMore} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HousesList
