import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiCheckLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import DrawerForm from '@/components/DrawerForm'
import { addManagedProperty, editManagedProperty } from '@/lib/services/managedProperties'
import { addPropertyOwner } from '@/lib/services/propertyOwners'

const PROPERTY_TYPES = ['Appartement', 'Maison', 'Studio', 'Commerce']

// Formulaire de création/édition d'un bien, partagé entre BiensTab (choix libre du
// propriétaire) et la page détail propriétaire (propriétaire imposé par lockedOwnerId).
export default function PropertyDrawerForm({ open, setOpen, selected, owners, lockedOwnerId, onSaved, onOwnerCreated }) {
  const colors = useColors()
  const [saving, setSaving] = useState(false)
  const [creatingOwner, setCreatingOwner] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  useEffect(() => {
    if (!open) return
    setCreatingOwner(false)
    if (selected) {
      reset({
        type: selected.type,
        address: selected.address,
        city: selected.city || '',
        description: selected.description || '',
        surface: selected.surface || '',
        nbRooms: selected.nbRooms || '',
        ownerId: selected.ownerId || lockedOwnerId || owners?.[0]?.id || '',
        commissionRate: selected.commissionRate,
        rentAmount: selected.rentAmount,
        status: selected.status,
      })
    } else {
      reset({
        type: 'Appartement',
        address: '',
        city: '',
        description: '',
        surface: '',
        nbRooms: '',
        ownerId: lockedOwnerId || owners?.[0]?.id || '',
        commissionRate: '10',
        rentAmount: '',
        status: 'vacant',
        newOwnerName: '',
        newOwnerPhone: '',
        newOwnerEmail: '',
      })
    }
  }, [open, selected, lockedOwnerId]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      let ownerId = lockedOwnerId || data.ownerId

      if (!lockedOwnerId && creatingOwner) {
        const newOwner = await addPropertyOwner({
          name: data.newOwnerName,
          phone: data.newOwnerPhone,
          email: data.newOwnerEmail || '',
        })
        ownerId = newOwner.id
        onOwnerCreated?.(newOwner)
      }

      const payload = {
        type: data.type,
        address: data.address,
        city: data.city,
        description: data.description,
        surface: Number(data.surface) || 0,
        nbRooms: Number(data.nbRooms) || 0,
        ownerId,
        commissionRate: Number(data.commissionRate) || 0,
        rentAmount: Number(data.rentAmount) || 0,
        status: data.status,
      }

      if (selected) {
        await editManagedProperty(selected.id, payload)
        onSaved({ ...selected, ...payload })
        notify('Bien modifié avec succès', 'success')
      } else {
        const reference = `BIEN-${String(Date.now()).slice(-6)}`
        const saved = await addManagedProperty({ ...payload, reference })
        onSaved(saved)
        notify('Bien ajouté avec succès', 'success')
      }
      setOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  return (
    <DrawerForm
      open={open}
      setOpen={setOpen}
      onSubmit={handleSubmit(onSubmit)}
      title={selected ? 'Modifier le bien' : 'Ajouter un bien'}
      description={selected ? 'Mettez à jour les informations du bien' : 'Enregistrer un nouveau bien géré'}
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
                onClick={() => setOpen(false)}
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Type de bien
            </label>
            <select
              {...register('type')}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Statut
            </label>
            <select
              {...register('status')}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            >
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupé</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
            Adresse *
          </label>
          <input
            type="text"
            {...register('address', { required: 'Requis' })}
            className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            placeholder="Ex: Kaloum, rue KA-025"
          />
          {errors.address && <p className="mt-1 text-xs font-semibold text-red-500">{errors.address.message}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Ville
            </label>
            <input
              type="text"
              {...register('city')}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              placeholder="Conakry"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Surface (m²)
            </label>
            <input
              type="number"
              {...register('surface')}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Pièces
            </label>
            <input
              type="number"
              {...register('nbRooms')}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
            Description
          </label>
          <textarea
            rows={2}
            {...register('description')}
            className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
          />
        </div>

        {!lockedOwnerId && (
          <div className="border-t border-gray-100 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Propriétaire</p>
              <button
                type="button"
                onClick={() => setCreatingOwner((v) => !v)}
                className="text-xs font-semibold"
                style={{ color: colors.primary }}
              >
                {creatingOwner ? 'Choisir un propriétaire existant' : '+ Nouveau propriétaire'}
              </button>
            </div>

            {creatingOwner ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                    Nom *
                  </label>
                  <input
                    type="text"
                    {...register('newOwnerName', { required: creatingOwner ? 'Requis' : false })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                  />
                  {errors.newOwnerName && (
                    <p className="mt-1 text-xs font-semibold text-red-500">{errors.newOwnerName.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                    Téléphone *
                  </label>
                  <input
                    type="text"
                    {...register('newOwnerPhone', { required: creatingOwner ? 'Requis' : false })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                    placeholder="+224 6XX XX XX XX"
                  />
                  {errors.newOwnerPhone && (
                    <p className="mt-1 text-xs font-semibold text-red-500">{errors.newOwnerPhone.message}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register('newOwnerEmail')}
                    className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <select
                {...register('ownerId', { required: !creatingOwner ? 'Requis' : false })}
                className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              >
                {owners?.length === 0 && <option value="">Aucun propriétaire — créez-en un</option>}
                {owners?.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} — {o.phone}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Loyer mensuel (GNF) *
            </label>
            <input
              type="number"
              {...register('rentAmount', { required: 'Requis' })}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              placeholder="Ex: 1500000"
            />
            {errors.rentAmount && (
              <p className="mt-1 text-xs font-semibold text-red-500">{errors.rentAmount.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Commission agence (%)
            </label>
            <input
              type="number"
              {...register('commissionRate')}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              placeholder="Ex: 10"
            />
          </div>
        </div>
      </div>
    </DrawerForm>
  )
}
