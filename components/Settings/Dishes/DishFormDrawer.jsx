import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiImage2Fill } from 'react-icons/ri'
import { notify } from '@/utils/toast'
import { addDish, editDish } from '@/lib/services/settings'
import DrawerForm from '../../DrawerForm'
import Loader from '../../Loader'
import Toggle from '../../Toggle'
import { autoFillDishForm } from '@/utils/functionFactory'
import SimpleSelect from '../../SimpleSelect'
import { foodGenerics } from '../../../_data'

function DishFormDrawer({ dish, open, setOpen }) {
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
      autoFillDishForm(reset, setValue, dish)
    }
    setFormvalue()
  }, [dish])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      if (dish)
        await editDish(
          dish.id,
          data,
          formData?.imageUrl?.length > 0,
          dish.imageUrl,
          dish.imageUrl1000
        )
      else await addDish(data)
      reset()

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
        title={'Ajouter un plat'}
        description={"Creation d'un plat pour l espace decouverte"}
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
                  className="ml-4 inline-flex justify-center border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Enregistrer
                </button>
              </>
            )}
          </>
        }
      >
        <div className="mt-5 md:col-span-2 md:mt-0">
          {/* <pre>{JSON.stringify(formData, null, 4)}</pre> */}

          <div className="space-y-6 bg-white px-4 py-5 ">
            <div className="grid grid-cols-2 gap-6">
              <div className="group col-span-1 sm:col-span-1">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nom
                </label>
                <div className="mt-1 ">
                  <input
                    type="text"
                    {...register('name', {
                      required: 'Champs requis',
                    })}
                    id="name"
                    className="block w-full flex-1 border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Titre du dish"
                  />
                  <p className="pt-1 font-stratos-light text-xs text-red-600">
                    {errors?.name?.message}
                  </p>
                </div>
              </div>
              <div className="group col-span-1 sm:col-span-1">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <div className="mt-1 ">
                  <input
                    type="text"
                    {...register('description', {
                      required: 'Champs requis',
                    })}
                    id="description"
                    className="block w-full flex-1 border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Description du plat"
                  />
                  <p className="pt-1 font-stratos-light text-xs text-red-600">
                    {errors?.description?.message}
                  </p>
                </div>
              </div>
              <div className="group col-span-1 sm:col-span-1">
                <label
                  htmlFor="speciality"
                  className="block text-sm font-medium text-gray-700"
                >
                  Specialité
                </label>
                <div className="mt-1 ">
                  <input
                    type="text"
                    {...register('speciality', {
                      required: 'Champs requis',
                    })}
                    id="speciality"
                    className="block w-full flex-1 border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Designe l origine du plat"
                  />
                  <p className="pt-1 font-stratos-light text-xs text-red-600">
                    {errors?.speciality?.message}
                  </p>
                </div>
              </div>
              <div className="group col-span-1 sm:col-span-1">
                <label
                  htmlFor="ingredients"
                  className="block text-sm font-medium text-gray-700"
                >
                  Ingredients
                </label>
                <div className="mt-1 ">
                  <input
                    type="text"
                    {...register('ingredients', {
                      required: 'Champs requis',
                    })}
                    id="ingredients"
                    className="block w-full flex-1 border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Les ingredients du plat"
                  />
                  <p className="pt-1 font-stratos-light text-xs text-red-600">
                    {errors?.ingredients?.message}
                  </p>
                </div>
              </div>
              <div className="col-span-1 sm:col-span-1">
                <label
                  htmlFor="foodGenericId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Type de plat
                </label>

                <div className="mt-1">
                  <SimpleSelect
                    required={'Champs requis'}
                    name="foodGenericId"
                    control={control}
                    options={foodGenerics}
                    placeholder="Selectionner un foodGenericId"
                  />
                </div>
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.foodGenericId?.message}
                </p>
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 sm:items-end sm:gap-4 ">
              <label
                htmlFor="cover-photo"
                className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
              >
                Image du dish
              </label>
              <div className="mt-1 sm:col-span-2 sm:mt-0">
                <div className="rounded-xs flex max-w-lg justify-center border-2 border-dashed border-gray-300 px-2 pt-5 pb-6">
                  <div className="space-y-1 text-center">
                    {formData?.imageUrl?.length > 0 ? (
                      <img
                        src={URL.createObjectURL(formData?.imageUrl[0])}
                        alt="preview"
                      />
                    ) : dish ? (
                      <img src={dish.imageUrl1000} alt="preview" />
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
                              !dish?.imageUrl,
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

            <div
              className={`p-2 px-4 ${
                formData?.isActive ? 'bg-green-200' : 'bg-red-200'
              }`}
            >
              <Toggle
                setToggleValue={setValue}
                control={control}
                name={'isActive'}
              />
            </div>
          </div>
        </div>
      </DrawerForm>
    </>
  )
}

export default DishFormDrawer
