import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiImage2Fill } from 'react-icons/ri'
import { notify } from '../../utils/toast'
import DrawerForm from '../DrawerForm'
import Loader from '../Loader'

import {
  autoFillAdvertisingForm,
  autoFillCommercialForm,
} from '../../utils/functionFactory'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { addAdvertising, editCommercial } from '../../lib/services/advertising'
// import { editCommercial } from '../../lib/services/marketing'

function AdvertisingFormDrawer({ commercial, open, setOpen }) {
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
    reValidateMode: 'onChange',
    shouldUnregister: false,
  })

  const formData = watch()

  useEffect(() => {
    const setFormvalue = () => {
      autoFillAdvertisingForm(reset, setValue, commercial)
    }
    setFormvalue()
  }, [commercial])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      if (commercial)
        await editCommercial(
          commercial.id,
          data,
          formData?.imageUrl?.length > 0,
          commercial.imageUrl,
          commercial.imageUrl1000
        )
      else {
        await addAdvertising(data)
      }

      setOpen(false)
      notify('Votre requète s est executée avec succès', 'success')
    } catch (error) {
      console.log(error)
      notify('Une erreur est survenue', 'error')
    }
    setLoading(false)
  }

  return (
    <>
      <DrawerForm
        open={open}
        setOpen={setOpen}
        onSubmit={handleSubmit(onSubmit)}
        title={'Ajouter une image'}
        description={'image publicitaire...'}
        footerButtons={
          <>
            {loading ? (
              <div className="ml-4 inline-flex w-[22.5rem] justify-center border border-transparent bg-gray-300 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2">
                <Loader />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="ml-4 inline-flex justify-center border border-transparent bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Enregistrer
                </button>
              </>
            )}
          </>
        }
      >
        <div className="mt-5 md:col-span-2 md:mt-0">
          <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="group col-span-1 sm:col-span-1">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Titre
                </label>
                <div className="mt-1 ">
                  <input
                    type="text"
                    {...register('title', {
                      required: 'Champs requis',
                    })}
                    id="title"
                    className="block w-full flex-1 border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Titre du commercial"
                  />
                  <p className="pt-1 font-stratos-light text-xs text-red-600">
                    {errors?.title?.message}
                  </p>
                </div>
              </div>
              <div className="col-span-1 sm:col-span-1">
                <label
                  htmlFor="subtitle"
                  className="block text-sm font-medium text-gray-700"
                >
                  Slogan
                </label>
                <div className="mt-1 ">
                  <input
                    type="text"
                    {...register('slogan', {
                      required: 'Champs requis',
                    })}
                    id="slogan"
                    className="block w-full flex-1 border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Petit slogan"
                  />
                  <p className="pt-1 font-stratos-light text-xs text-red-600">
                    {errors?.slogan?.message}
                  </p>
                </div>
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 sm:items-end sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
              <label
                htmlFor="cover-photo"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Image Publicitaire
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="rounded-xs flex max-w-lg justify-center border-2 border-dashed border-gray-300 px-2 pt-5 pb-6">
                  <div className="space-y-1 text-center">
                    {formData?.imageUrl?.length > 0 ? (
                      <img
                        src={URL.createObjectURL(formData?.imageUrl[0])}
                        alt="preview"
                      />
                    ) : commercial ? (
                      <img src={commercial.imageUrl} alt="preview" />
                    ) : (
                      <RiImage2Fill className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-sm bg-white font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 hover:text-primary-500"
                      >
                        <span>Charger image</span>
                        <input
                          id="file-upload"
                          {...register('imageUrl', {
                            required:
                              formData?.imageUrl?.length == 0 &&
                              !commercial?.imageUrl,
                          })}
                          type="file"
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                  <p className="pt-1 font-stratos-light text-xs text-red-600">
                    {errors?.imageUrl && 'veuillez selectionnez une image'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrawerForm>
    </>
  )
}

export default AdvertisingFormDrawer
