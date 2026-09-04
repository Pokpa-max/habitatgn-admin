
import { columnsUser } from './_dataTable'
import { OrderSkleton } from '../Orders/OrdersList'
import PaginationButton from '../Orders/PaginationButton'
import { useEffect, useState } from 'react'
import {
  RiSearchLine,
  RiAddLine,
  RiShieldKeyholeLine,
  RiLockPasswordLine,
  RiMore2Fill,
  RiForbidLine,
  RiCheckLine,
} from 'react-icons/ri'
import DesableConfirmModal from '../DesableConfirm'
import ManagerPermissionsModal from './ManagerPermissionsModal'
import ResetPasswordModal from './ResetPasswordModal'
import StatusPill from '../ui/StatusPill'
import {
  desableUser,
  desableUserFirestore,
  updateUserPermissions,
  resetManagerPassword,
} from '../../lib/services/managers'
import { notify } from '../../utils/toast'
import CreateUserDrawer from './CreateUserDrawer'
import { useColors } from '../../contexts/ColorContext'
import { useAuthUser } from 'next-firebase-auth'

function UsersList({
  data,
  setData,
  customers,
  showMore,
  pagination,
  isLoading,
  isLoadingP,
  title,
  isStaffTab,
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
      isStaffTab={isStaffTab}
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
  isStaffTab,
}) {
  const colors = useColors()
  const AuthUser = useAuthUser()
  const isAdmin = AuthUser.claims?.userType === 'admin'
  const [openModal, setOpenModal] = useState(false)
  const [selectUser, setSelectUser] = useState(null)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [permissionsTarget, setPermissionsTarget] = useState(null)
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState(null)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState(null)

  useEffect(() => {
    if (!menuOpenId) return
    const handleClickOutside = (event) => {
      const target = event.target
      if (target instanceof HTMLElement && !target.closest('[data-menu-root]')) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

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
          border-color: ${colors.primary || '#0A4D9C'};
          box-shadow: 0 0 0 3px rgba(10, 77, 156, 0.1);
        }

        .table-header {
          background-color: ${colors.gray50};
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

          <ManagerPermissionsModal
            manager={permissionsTarget}
            open={permissionsModalOpen}
            setOpen={setPermissionsModalOpen}
            onSave={async (manager, permissions) => {
              try {
                await updateUserPermissions(manager.id, permissions)
                const managersCopy = managers.map((m) =>
                  m.id === manager.id ? { ...m, permissions } : m
                )
                setData({ ...data, managers: managersCopy })
                notify('Permissions mises à jour', 'success')
              } catch (error) {
                notify('Erreur lors de la mise à jour des permissions', 'error')
              }
            }}
          />

          <ResetPasswordModal
            manager={passwordTarget}
            open={passwordModalOpen}
            setOpen={setPasswordModalOpen}
            onReset={async (manager, newPassword) => {
              await resetManagerPassword(manager.id, newPassword)
              notify('Mot de passe réinitialisé avec succès', 'success')
            }}
          />

          <CreateUserDrawer
            open={openDrawer}
            setOpen={setOpenDrawer}
            onCreate={(newUser) => {
              // Determine if we need to update managers list or generic users list based on title
              // The logic below assumes 'managers' and 'users' arrays exist in data
              // We'll update both or valid one.
              if (isStaffTab) {
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
                  placeholder={`Rechercher un ${isStaffTab ? title.toLowerCase() : 'utilisateur'}...`}
                  type="search"
                />
              </div>
            </div>

            {/* Add Button */}
            {isStaffTab && (
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
                        className={`px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700 ${
                          column.secondary ? 'hidden lg:table-cell' : ''
                        }`}
                      >
                        {column.Header}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700"
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
                              className={`px-6 py-4 text-sm text-gray-700 ${
                                column.secondary ? 'hidden lg:table-cell' : ''
                              }`}
                            >
                              {element}
                            </td>
                          )
                        })}

                        {/* Status + Actions */}
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <StatusPill tone={row.isAvailable ? 'success' : 'error'}>
                              {row.isAvailable ? 'Actif' : 'Inactif'}
                            </StatusPill>
                            <div className="relative" data-menu-root>
                              <button
                                type="button"
                                onClick={() =>
                                  setMenuOpenId((prev) => (prev === row.id ? null : row.id))
                                }
                                className="inline-flex items-center justify-center rounded-full border border-gray-200 p-1.5 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                                title="Actions"
                              >
                                <RiMore2Fill className="h-4 w-4" />
                              </button>

                              {menuOpenId === row.id && (
                                <div className="absolute right-0 top-full z-[60] mt-2 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMenuOpenId(null)
                                      setSelectUser(row)
                                      setOpenModal(true)
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                  >
                                    {row.isAvailable ? (
                                      <RiForbidLine className="h-4 w-4" style={{ color: colors.error }} />
                                    ) : (
                                      <RiCheckLine className="h-4 w-4" style={{ color: colors.success }} />
                                    )}
                                    {row.isAvailable ? 'Suspendre le compte' : 'Activer le compte'}
                                  </button>
                                  {isStaffTab && row.type === 'manager' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMenuOpenId(null)
                                        setPermissionsTarget(row)
                                        setPermissionsModalOpen(true)
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                      <RiShieldKeyholeLine className="h-4 w-4" style={{ color: colors.primary }} />
                                      Permissions
                                    </button>
                                  )}
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMenuOpenId(null)
                                        setPasswordTarget(row)
                                        setPasswordModalOpen(true)
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                      <RiLockPasswordLine className="h-4 w-4" style={{ color: colors.primary }} />
                                      Réinitialiser le mot de passe
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
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