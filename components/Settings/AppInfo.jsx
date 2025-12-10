import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import CreatableOnSelect from '../CreatableSelect'
import _ from 'lodash'
import { RiCloseLine } from 'react-icons/ri'
import Header from '@/components/Header'

import { quartier } from '../../_data'
import {
  addAppInfo,
  addGenericDish,
  deleteAppInfo,
  deletegenericDish,
  getAppInfos,
  getGenericDishes,
} from '../../lib/services/settings'
import { notify } from '../../utils/toast'

function AppInfo() {
  const [appInfos, setAppInfos] = useState([])
  const [foodGenerics, setFoodGenerics] = useState([])

  useEffect(() => {
    const unsubscribe = () => {
      getAppInfos(setAppInfos)
      getGenericDishes(setFoodGenerics)
    }
    return () => {
      unsubscribe()
    }
  }, [])

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldUnregister: false,
  })

  return (
    <div className="flex-1 py-6">
      <div className="px-4 mx-auto sm:px-6 md:px-8">
        <Header title={'Info'} />
        <div className="divide-y divide-gray-200 ">
          <div className="flex ">
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Information de lapplication
              </h3>
              <p className="max-w-2xl text-sm text-gray-500">
                Espace de creation du contenu de l'application
              </p>
            </div>
          </div>

          <div className="mt-6">
            <dl className="divide-y divide-gray-200">
              <CategoryPageSelect
                inputName={'dishDay'}
                label={'Repas de la journée servis'}
                placeholder="Selectionner vos repas"
                register={register}
                errors={errors}
                onSubmit={handleSubmit(async (data) => {
                  await addAppInfo(data?.dishDay, 'dishDay')
                  reset()
                })}
                elements={
                  appInfos.find((el) => el.id === 'dishDay')?.dishDay || []
                }
              />
              <CategoryPageSelect
                inputName={'installations'}
                label={'Installations'}
                placeholder="Selectionner vos installations"
                register={register}
                errors={errors}
                onSubmit={handleSubmit(async (data) => {
                  await addAppInfo(data?.installations, 'installations')
                  reset()
                })}
                elements={
                  appInfos.find((el) => el.id === 'installations')
                    ?.installations || []
                }
              />
              <CategoryPageSelect
                inputName={'genericDish'}
                label={'Plats Generiques'}
                placeholder="Creer un plat"
                register={register}
                errors={errors}
                onSubmit={handleSubmit(async (data) => {
                  await addGenericDish(data?.genericDish)
                  reset()
                })}
                elements={foodGenerics || []}
              />
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

const CategoryPageSelect = ({
  register,
  errors,
  onSubmit,
  label,
  placeholder,
  inputName,
  elements,
}) => {
  return (
    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="flex justify-between mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        <div className="flex flex-col">
          <form onSubmit={onSubmit}>
            <div className="mt-1 ">
              <div className="flex">
                <input
                  type="text"
                  {...register(inputName)}
                  id={inputName}
                  className="flex-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder={placeholder}
                />
                <button
                  type="submit"
                  className="inline-flex justify-center px-4 py-2 ml-4 text-sm font-medium text-white border border-transparent bg-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Ajouter
                </button>
              </div>
              <p className="pt-1 text-xs text-red-600 font-stratos-light">
                {errors[inputName]?.message}
              </p>
            </div>
          </form>

          <div className="flex flex-wrap my-6 space-x-2">
            {elements?.length === 0
              ? 'Rien à afficher pour le moment'
              : elements?.map(({ id, name }) => (
                  <div
                    key={id || name}
                    className="flex items-center px-4 py-2 my-1 space-x-1 text-white rounded-full whitespace-nowrap border-primary-500 bg-primary"
                  >
                    <p className="">{name}</p>
                    <button
                      onClick={() => {
                        if (inputName === 'genericDish') deletegenericDish(name)
                        else deleteAppInfo({ name, id }, inputName)
                      }}
                    >
                      <RiCloseLine className="w-5 h-5 rounded-full hover:bg-gray-600" />
                    </button>
                  </div>
                ))}
          </div>
        </div>
      </dd>
    </div>
  )
}

export default AppInfo
