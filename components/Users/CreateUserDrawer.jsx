import { useAuthUser } from 'next-firebase-auth'
import React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Loader from 'react-spinners/BeatLoader'
import { createAccount } from '../../lib/services/managers'
import { notify } from '../../utils/toast'
import { quartier, userRole, zones } from '../../_data'
import DrawerForm from '../DrawerForm'
import SimpleSelect from '../SimpleSelect'
import { useColors } from '../../contexts/ColorContext'
export default function CreateUserDrawer({ open, setOpen }) {
  const colors = useColors()
  const [loading, setLoading] = useState(false)

  const {
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      desabled: false,
    },
    reValidateMode: 'onChange',
    shouldUnregister: false,
  })

  const CreatedAccountSubmit = async (data) => {
    setLoading(true)
    try {
      await createAccount(data)
      notify('compte creer avec succès', 'success')
      reset()
    } catch (error) {
      notify('ce compte existe déja', 'error')
    }
    // setOpen(false)
  }
  return (
    <>
      <DrawerForm
        open={open}
        setOpen={setOpen}
        title={'Ajouter un Manager'}
        description={'Creation de compte manager'}
        onSubmit={handleSubmit(CreatedAccountSubmit)}
        loading={loading}
        footerButtons={
          <>
            <>
              <button
                type="button"
                className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={() => setOpen(false)}
              >
                Annuler
              </button>
              <button
                style={{
                  backgroundColor: colors.primary,
                }}
                type="submit"
                className="ml-4 inline-flex justify-center border border-transparent bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Creer le compte
              </button>
            </>
          </>
        }
      >
        <div className="mt-5 md:col-span-2 md:mt-0">
          <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="group col-span-3 sm:col-span-2">
                <label
                  htmlFor="storename"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nom de l'agence
                </label>
                <div className="mt-1 flex">
                  <input
                    type="text"
                    {...register('agence', {
                      required: 'Champs requis',
                    })}
                    id="agence"
                    className="block w-full flex-1 border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Nom du manager"
                  />
                  <p className="pt-1 font-stratos-light text-xs text-red-600">
                    {errors?.agence?.message}
                  </p>
                </div>
              </div>
            </div>

            <h1 className="text-cyan-500">Manager</h1>

            <div className="grid grid-cols-6 gap-6 border-t pt-3">
              <div className="col-span-6 sm:col-span-3">
                <label
                  htmlFor="firstname"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nom
                </label>
                <input
                  type="text"
                  {...register('firstname', {
                    required: 'Champs requis',
                  })}
                  id="firstname"
                  autoComplete="given-name"
                  placeholder="votre nom"
                  className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                />
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.firstname?.message}
                </p>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label
                  htmlFor="lastname"
                  className="block text-sm font-medium text-gray-700"
                >
                  Prenom
                </label>
                <input
                  type="text"
                  {...register('lastname', {
                    required: 'Champs requis',
                  })}
                  id="lastname"
                  autoComplete="family-name"
                  placeholder="votre prenom"
                  className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                />
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.lastname?.message}
                </p>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Telephone
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 mr-5 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">+224</span>
                  </div>
                  <input
                    type="tel"
                    {...register('phoneNumber', {
                      required: 'Champs requis',
                      pattern:
                        /^(\+\d{3}\s?)?\(?\d{3}\)?[\s-]*\d{2}[\s-]*\d{2}[\s-]*\d{2}$/i,
                    })}
                    id="phoneNumber"
                    className="block w-full border-gray-300 pl-12 pr-20 focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Votre numero de telephone"
                  />
                  <p className="pt-1 font-stratos-light text-xs text-red-600">
                    {errors?.phoneNumber?.type === 'pattern'
                      ? 'Entrez un numero valide'
                      : errors?.phoneNumber?.message}
                  </p>
                </div>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Champs requis',
                    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                  })}
                  id="email"
                  placeholder="meloger@gmail.com"
                  className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                />
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.email?.type === 'pattern'
                    ? 'Entrez un email valide'
                    : errors?.email?.message}
                </p>
              </div>

              <div className="col-span-12 sm:col-span-3">
                <label
                  htmlFor="zone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Rôle
                </label>

                <div className="mt-1">
                  <SimpleSelect
                    required={'Champs requis'}
                    name="userRole"
                    control={control}
                    options={userRole}
                    placeholder="Selectionner la commune"
                  />
                </div>
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.userRole?.message}
                </p>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label
                  htmlFor="lastname"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mot de passe
                </label>
                <input
                  type="text"
                  {...register('passWord', {
                    required: 'Champs requis',
                  })}
                  id="passWord"
                  autoComplete="passWord"
                  placeholder="le mot de passe "
                  className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                />
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.passWord?.message}
                </p>
              </div>
            </div>

            <h1 className="text-cyan-500">Adresse</h1>
            <div className="grid grid-cols-9 gap-6 border-t pt-3">
              <div className="col-span-12 sm:col-span-3">
                <label
                  htmlFor="zone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Commune
                </label>

                <div className="mt-1">
                  <SimpleSelect
                    required={'Champs requis'}
                    name="zone"
                    control={control}
                    options={zones}
                    placeholder="Selectionner la commune"
                  />
                </div>
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.zone?.message}
                </p>
              </div>
              <div className="col-span-12 sm:col-span-3">
                <label
                  htmlFor="quartier"
                  className="block text-sm font-medium text-gray-700"
                >
                  Quartier
                </label>

                <div className="mt-1">
                  <SimpleSelect
                    required={'Champs requis'}
                    name="quartier"
                    control={control}
                    options={quartier}
                    placeholder="Selectionner le quartier"
                  />
                </div>
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.quartier?.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DrawerForm>
    </>
  )
}
