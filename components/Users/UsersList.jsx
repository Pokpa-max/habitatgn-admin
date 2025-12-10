import React from 'react'
import { columnsUser } from './_dataTable'
import { OrderSkleton } from '../Orders/OrdersList'
import PaginationButton from '../Orders/PaginationButton'
import { useState } from 'react'
import { RiSearchLine } from 'react-icons/ri'
import DesableConfirmModal from '../DesableConfirm'
import { desableUser, desableUserFirestore } from '../../lib/services/managers'
import { notify } from '../../utils/toast'
import CreateUserDrawer from './CreateUserDrawer'

function UsersList({
  data,
  setData,
  customers,
  showMore,
  pagination,
  isLoading,
  isLoadingP,
  title,
}) {
  const [selectedUser, setSelectedUser] = useState()
  return (
    <UserTable
      isLoading={isLoading}
      selectedUser={selectedUser}
      setSelectedUser={setSelectedUser}
      newcustomers={customers}
      isLoadingP={isLoadingP}
      showMore={showMore}
      data={data}
      setData={setData}
      pagination={pagination}
      title={title}
    />
  )
}

function UserTable({
  data,
  setData,
  newcustomers,
  showMore,
  pagination,
  isLoading,
  isLoadingP,
  title,
}) {
  const [openModal, setOpenModal] = useState(false)
  const [selectUser, setSlectUser] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  data = data || {}
  const { users, lastElement } = data
  const { managers, lastElement: lasteManager } = data

  return isLoading ? (
    <OrderSkleton />
  ) : (
    <div className="">
      <CreateUserDrawer open={openDrawer} setOpen={setOpenDrawer} />
      <DesableConfirmModal
        title="Suspendre le Compte"
        desable={!selectUser?.isAvailable}
        confirmFunction={async () => {
          await desableUser(selectUser.id, !selectUser?.isAvailable).then(
            async () => {
              if (title == 'Utilisateurs') {
                await desableUserFirestore(
                  selectUser.id,
                  !selectUser?.isAvailable
                )
                const update = () => {
                  const user = users.map((user) => {
                    const newUser = { ...user }

                    if (user.id == selectUser.id) {
                      newUser.isAvailable = !selectUser?.isAvailable
                    }
                    return newUser
                  })

                  setData({ users: user, lastElement })
                }
                update()
              } else {
                await desableUserFirestore(
                  selectUser.id,
                  !selectUser?.isAvailable
                )
                const update = () => {
                  const user = managers.map((user) => {
                    const newUser = { ...user }

                    if (user.id == selectUser.id) {
                      newUser.isAvailable = !selectUser?.isAvailable
                    }
                    return newUser
                  })

                  setData({ managers: user, lasteManager })
                }
                update()
              }
            }
          )
          notify('Action executée avec succès', 'success')
          setOpenModal(false)
        }}
        open={openModal}
        setOpen={setOpenModal}
      />
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex flex-1 items-center justify-between ">
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
                  placeholder="Rechercher un utilisateur..."
                  type="search"
                />
              </div>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              {title == 'Managers' ? (
                <button
                  onClick={() => {
                    setOpenDrawer(true)
                    // setSelectedHouse(null)
                  }}
                  type="button"
                  className="focus:ring-bg-cyan-500 mb-20 inline-flex items-center justify-center rounded-sm border border-transparent bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto"
                >
                  Ajouter un manager
                </button>
              ) : (
                ''
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none"></div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden ring-1 ring-black ring-opacity-5 md:rounded-sm">
              <table className="min-w-full table-auto divide-y divide-gray-300 text-left">
                <thead className="bg-gray-50">
                  <tr>
                    {columnsUser.map((column, index) => (
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
                  {newcustomers?.map((row, index) => (
                    <tr key={index}>
                      {columnsUser.map((column, index) => {
                        const cell = row[column.accessor]
                        const element = column.Cell?.(cell, row['id']) ?? cell
                        return <td key={index}>{element}</td>
                      })}
                      <td className="relative flex space-x-2 whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => {
                            setSlectUser(row)
                            setOpenModal(true)
                          }}
                        >
                          {row.isAvailable ? (
                            <p className=" mr-2 rounded bg-green-100 px-2.5 py-0.5 text-sm font-medium text-gray-800 ">
                              Activer{' '}
                            </p>
                          ) : (
                            <p className=" mr-2 rounded bg-red-100 px-2.5 py-0.5 text-sm font-medium text-gray-800 ">
                              Desactiver
                            </p>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <p className="mt-5">
                {newcustomers?.length + ' '}
                {title}
              </p>
              {pagination && newcustomers.length > 0 && (
                <PaginationButton getmoreData={showMore} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsersList
