import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import _ from 'lodash'
import { RiCloseLine } from 'react-icons/ri'
import Header from '@/components/Header'

import {
  addHomeInfo,
  deleteHomeInfo,
  getHomeInfos,
  getBundles,
  getCategories,
} from '../../lib/services/settings'
import SimpleSelect from '../SimpleSelect'
import { getSliders } from '../../lib/services/marketing'

function HomeInfo() {
  const [homeInfos, setHomeInfos] = useState([])
  const [sliders, setSliders] = useState([])
  const [bundles, setBundles] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const unsubscribe = () => {
      getHomeInfos(setHomeInfos)
      getBundles(setBundles)
      getCategories(setCategories)
      getSliders(setSliders)
    }
    return () => {
      unsubscribe()
    }
  }, [])

  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldUnregister: false,
  })

  return (
    <div className="flex-1 py-6">
      <div className="mx-auto px-4 sm:px-6 md:px-8">
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
                inputName={'bundles'}
                label={'Bundles'}
                placeholder="Selectionner vos bundles"
                register={register}
                errors={errors}
                control={control}
                onSubmit={handleSubmit(async (data) => {
                  await addHomeInfo(data?.bundles, 'bundles')
                  reset()
                })}
                elements={
                  homeInfos.find((el) => el.id === 'bundles')?.bundles || []
                }
                options={
                  bundles?.map((el) => ({
                    label: el.name,
                    value: el,
                  })) || []
                }
              />
              <CategoryPageSelect
                inputName={'categories'}
                label={'Categories a afficher a l acceuil'}
                placeholder="Selectionner vos categories"
                register={register}
                errors={errors}
                control={control}
                onSubmit={handleSubmit(async (data) => {
                  await addHomeInfo(data?.categories, 'categories')
                  reset()
                })}
                elements={
                  homeInfos.find((el) => el.id === 'categories')?.categories ||
                  []
                }
                options={
                  categories?.map((el) => ({
                    label: el.name,
                    value: el,
                  })) || []
                }
              />
              <CategoryPageSelect
                inputName={'sliders'}
                label={'Sliders a afficher'}
                placeholder="Sliders a selectionner"
                register={register}
                errors={errors}
                control={control}
                onSubmit={handleSubmit(async (data) => {
                  await addHomeInfo(data?.sliders, 'sliders')
                  reset()
                })}
                elements={
                  homeInfos.find((el) => el.id === 'sliders')?.sliders || []
                }
                options={
                  sliders?.map((el) => ({
                    label: el.sliderDetails.title,
                    value: el,
                  })) || []
                }
              />
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

const CategoryPageSelect = ({
  errors,
  onSubmit,
  label,
  inputName,
  elements,
  options,
  control,
}) => {
  return (
    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 flex justify-between text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        <div className="flex flex-col">
          <form onSubmit={onSubmit}>
            <div className="mt-1 ">
              <div className="flex">
                <SimpleSelect
                  name={inputName}
                  control={control}
                  options={options}
                  className="block w-full flex-1 border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Selectionner le type"
                />
                <button
                  type="submit"
                  className="ml-4 inline-flex justify-center border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Ajouter
                </button>
              </div>
              <p className="pt-1 font-stratos-light text-xs text-red-600">
                {errors[inputName]?.message}
              </p>
            </div>
          </form>

          <div className="my-6 flex flex-wrap space-x-2">
            {elements?.length === 0
              ? 'Rien à afficher pour le moment'
              : elements?.map((el) => (
                  <div
                    key={el.id || el.name || el.title || el.sliderDetails.title}
                    className="my-1 flex items-center space-x-1 whitespace-nowrap rounded-full border-primary-500 bg-primary px-4 py-2 text-white"
                  >
                    <p className="">
                      {el.name || el.title || el.sliderDetails.title}
                    </p>
                    <button
                      onClick={() => {
                        deleteHomeInfo(el, inputName)
                      }}
                    >
                      <RiCloseLine className="h-5 w-5 rounded-full hover:bg-gray-600" />
                    </button>
                  </div>
                ))}
          </div>
        </div>
      </dd>
    </div>
  )
}

export default HomeInfo
