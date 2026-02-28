import React, { useEffect, useState } from 'react'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import { useColors } from '../../contexts/ColorContext'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import {
  getPhoneOperators,
  addPhoneOperator,
  editPhoneOperator,
  deletePhoneOperator,
} from '@/lib/services/phoneOperators'
import { notify } from '@/utils/toast'
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiPhoneLine,
  RiCloseLine,
  RiCheckLine,
} from 'react-icons/ri'
import DrawerForm from '@/components/DrawerForm'
import Loader from '@/components/Loader'
import { useForm } from 'react-hook-form'

function SettingsPage() {
  const colors = useColors()
  const [operators, setOperators] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  // Load operators
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await getPhoneOperators()
        setOperators(data)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const openAdd = () => {
    setSelected(null)
    reset({ operatorName: '', phoneNumber: '' })
    setDrawerOpen(true)
  }

  const openEdit = (op) => {
    setSelected(op)
    reset({ operatorName: op.operatorName, phoneNumber: op.phoneNumber })
    setDrawerOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (selected) {
        await editPhoneOperator(selected.id, data)
        setOperators((prev) =>
          prev.map((op) => (op.id === selected.id ? { ...op, ...data } : op))
        )
        notify('Modifié avec succès', 'success')
      } else {
        const newOp = await addPhoneOperator(data)
        setOperators((prev) =>
          [...prev, newOp].sort((a, b) =>
            a.operatorName.localeCompare(b.operatorName)
          )
        )
        notify('Ajouté avec succès', 'success')
      }
      setDrawerOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  const handleDelete = async (op) => {
    try {
      await deletePhoneOperator(op.id)
      setOperators((prev) => prev.filter((o) => o.id !== op.id))
      setDeleteConfirm(null)
      notify('Supprimé avec succès', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  return (
    <Scaffold>
      <div className="px-4 sm:px-6 lg:px-8">
        <Header title="Paramètres" />

        {/* Section contacts */}
        <div className="mt-4 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Contacts de l'agence
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Numéros de contact affichés aux utilisateurs de l'application
              </p>
            </div>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
              style={{ backgroundColor: colors.primary }}
            >
              <RiAddLine className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader />
            </div>
          ) : operators.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
              <RiPhoneLine className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">Aucun contact enregistré</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {operators.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${colors.primary}15` }}
                    >
                      <RiPhoneLine
                        className="h-5 w-5"
                        style={{ color: colors.primary }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {op.operatorName}
                      </p>
                      <p className="text-sm text-gray-500">{op.phoneNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {deleteConfirm === op.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Confirmer ?
                        </span>
                        <button
                          onClick={() => handleDelete(op)}
                          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => openEdit(op)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                          title="Modifier"
                        >
                          <RiEditLine className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(op.id)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-red-200 hover:text-red-500"
                          title="Supprimer"
                        >
                          <RiDeleteBinLine className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawer Ajout / Modification */}
      <DrawerForm
        open={drawerOpen}
        setOpen={setDrawerOpen}
        onSubmit={handleSubmit(onSubmit)}
        title={selected ? 'Modifier le contact' : 'Ajouter un contact'}
        description={
          selected
            ? 'Mettez à jour les informations'
            : 'Remplissez le formulaire'
        }
        footerButtons={
          <>
            {saving ? (
              <div
                className="inline-flex justify-center rounded px-6 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: colors.primary }}
              >
                <Loader />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  onClick={() => setDrawerOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="ml-3 inline-flex items-center gap-2 rounded px-6 py-2 text-sm font-semibold text-white hover:shadow-md"
                  style={{ backgroundColor: colors.primary }}
                >
                  <RiCheckLine className="h-4 w-4" />
                  Enregistrer
                </button>
              </>
            )}
          </>
        }
      >
        <div className="space-y-5 px-6 py-6 sm:p-8">
          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Opérateur / Plateforme *
            </label>
            <input
              type="text"
              {...register('operatorName', { required: 'Requis' })}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              placeholder="Ex: WhatsApp, Appel, Orange Money..."
            />
            {errors.operatorName && (
              <p className="mt-1 text-xs font-semibold text-red-500">
                {errors.operatorName.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Numéro de téléphone *
            </label>
            <input
              type="tel"
              {...register('phoneNumber', { required: 'Requis' })}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              placeholder="+224 6XX XXX XXX"
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-xs font-semibold text-red-500">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
        </div>
      </DrawerForm>
    </Scaffold>
  )
}

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (AuthUser.claims.userType !== 'admin') {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(SettingsPage)
