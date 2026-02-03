
import { columnsUser } from './_dataTable'
import { OrderSkleton } from '../Orders/OrdersList'
import PaginationButton from '../Orders/PaginationButton'
import { useState } from 'react'
import {
  RiSearchLine,
  RiAddLine,
} from 'react-icons/ri'
import DesableConfirmModal from '../DesableConfirm'
import { desableUser, desableUserFirestore } from '../../lib/services/managers'
import { notify } from '../../utils/toast'
import CreateUserDrawer from './CreateUserDrawer'
import { useColors } from '../../contexts/ColorContext'

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
  const colors = useColors()
  const [openModal, setOpenModal] = useState(false)
  const [selectUser, setSelectUser] = useState(null)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  data = data || {}
  const { users, lastElement } = data
  const { managers, lastElement: lastManager } = data

  const filteredUsers = newcustomers?.filter((user) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()

    const firstName = user.firstname?.toLowerCase() || ''
    const lastName = user.lastname?.toLowerCase() || ''
    const email = user.email?.toLowerCase() || ''
    const phoneNumber = user.phoneNumber?.toLowerCase() || ''
    const agency = user.agence?.toLowerCase() || ''

    return (
      firstName.includes(searchLower) ||
      lastName.includes(searchLower) ||
      email.includes(searchLower) ||
      phoneNumber.includes(searchLower) ||
      agency.includes(searchLower)
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

        .badge-active {
          background-color: #dcfce7;
          color: #166534;
        }

        .badge-inactive {
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
          <DesableConfirmModal
            title="Suspension du compte"
            desable={selectUser?.isAvailable}
            confirmFunction={async () => {
              try {
                await desableUser(selectUser.id, !selectUser?.isAvailable)
                await desableUserFirestore(selectUser.id, !selectUser?.isAvailable)

                if (title === 'Utilisateurs') {
                  const update = () => {
                    const usersCopy = users.map((user) => {
                      const newUser = { ...user }
                      if (user.id === selectUser.id) {
                        newUser.isAvailable = !selectUser?.isAvailable
                      }
                      return newUser
                    })
                    setData({ users: usersCopy, lastElement })
                  }
                  update()
                } else {
                  const update = () => {
                    const managersCopy = managers.map((manager) => {
                      const newManager = { ...manager }
                      if (manager.id === selectUser.id) {
                        newManager.isAvailable = !selectUser?.isAvailable
                      }
                      return newManager
                    })
                    setData({ managers: managersCopy, lastElement: lastManager })
                  }
                  update()
                }

                notify('Action effectuée avec succès', 'success')
                setOpenModal(false)
              } catch (error) {
                notify('Erreur lors de l\'action', 'error')
              }
            }}
            open={openModal}
            setOpen={setOpenModal}
          />

          <CreateUserDrawer
            open={openDrawer}
            setOpen={setOpenDrawer}
            onCreate={(newUser) => {
              // Determine if we need to update managers list or generic users list based on title
              // The logic below assumes 'managers' and 'users' arrays exist in data
              // We'll update both or valid one.
              if (title === 'Managers') {
                 const newManagers = [newUser, ...(managers || [])]
                 setData({ ...data, managers: newManagers })
              } else {
                 const newUsers = [newUser, ...(users || [])]
                 setData({ ...data, users: newUsers })
              }
            }}
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
                  placeholder={`Rechercher un ${title === 'Managers' ? 'manager' : 'utilisateur'}...`}
                  type="search"
                />
              </div>
            </div>

            {/* Add Button */}
            {title === 'Managers' && (
              <button
                onClick={() => {
                  setOpenDrawer(true)
                  setSelectUser(null)
                }}
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:translate-y-px"
                style={{
                  backgroundColor: colors.primary,
                }}
              >
                <RiAddLine className="h-5 w-5" />
                Ajouter
              </button>
            )}
          </div>

          {/* Table Section */}
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Table Header */}
                <thead className="table-header">
                  <tr>
                    {columnsUser.map((column, index) => (
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
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredUsers && filteredUsers.length > 0 ? (
                    filteredUsers.map((row, index) => (
                      <tr key={index} className="table-row">
                        {columnsUser.map((column, idx) => {
                          const cell = row[column.accessor]
                          const element = column.Cell?.(cell, row.id) ?? cell
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
                              setSelectUser(row)
                              setOpenModal(true)
                            }}
                            className={`action-btn cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-all hover:shadow-sm ${
                              row.isAvailable
                                ? 'badge-active border-green-300'
                                : 'badge-inactive border-red-300'
                            }`}
                          >
                            {row.isAvailable ? 'Actif' : 'Inactif'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={columnsUser.length + 1}
                        className="px-6 py-12 text-center text-sm text-gray-500"
                      >
                        Aucun utilisateur trouvé
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
              {filteredUsers?.length || 0} {title}
            </p>
            {pagination && filteredUsers.length > 0 && (
              <PaginationButton getmoreData={showMore} />
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default UsersList