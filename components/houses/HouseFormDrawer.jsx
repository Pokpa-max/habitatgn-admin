import { useAuthUser } from 'next-firebase-auth'
import React, { useEffect, useState } from 'react'

import { useForm } from 'react-hook-form'
import { RiImage2Fill } from 'react-icons/ri'
import { client } from '../../lib/algolia'
import { addHouses, editHouse } from '../../lib/services/houses'
import { getCurrentDateOnline } from '../../utils/date'
import { autoFillHouseForm } from '../../utils/functionFactory'
import { notify } from '../../utils/toast'
import { zones, towns, houseType, offerType, commodites } from '../../_data'

import DrawerForm from '../DrawerForm'
import GoogleMaps from '../GoogleMaps'
import Loader from '../Loader'
import SimpleSelect from '../SimpleSelect'

function HouseFormDrawer({ house, open, setOpen, setData, data }) {
  const AuthUser = useAuthUser()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])
  const [imagefiles, setImageFiles] = useState([])

  data = data || {}
  const { houses, lastElement } = data

  const onSelectFile = (event) => {
    const seletedFiles = event.target.files
    const selectedFileArray = Array.from(seletedFiles)

    const imagesArray = selectedFileArray.map((file) => {
      return URL.createObjectURL(file)
    })

    const imagesArray2 = selectedFileArray.map((file) => {
      return file
    })

    setImageFiles(imagesArray2)
    setImages(imagesArray)
  }

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
      isSoldOut: false,
    },
    reValidateMode: 'onChange',
    shouldUnregister: false,
  })

  const zone = watch('zone')

  const setLonLat = (lon, lat) => {
    setValue('long', lon)
    setValue('lat', lat)
  }

  useEffect(() => {
    const setFormvalue = () => {
      if (house) {
        setImages(house.houseInsides)
      }

      autoFillHouseForm(reset, setValue, house)
    }
    setFormvalue()
  }, [house])

  const files = watch('imageUrl')

  const onSubmit = async (data) => {
    const index = client.initIndex('houses')
    setLoading(true)

    try {
      const date = Date.now() / 1000
      const seconds = parseInt(date, 10)

      const dataFormated = { seconds }

      if (house) {
        const dataR = await editHouse(house, data, imagefiles)
        const update = async () => {
          const houseCopy = JSON.parse(JSON.stringify(houses))
          const updatedAt = await getCurrentDateOnline()
          const newHouses = houseCopy.map((res) => {
            if (house.id === res.id) {
              return {
                ...res,
                ...dataR,
                updatedAt,
              }
            }
            return res
          })

          newHouses.updatedAt = dataFormated
          newHouses.createdAt = dataFormated
          index.partialUpdateObjects({ newHouses })

          setData({ houses: newHouses, lastElement })
        }

        update(data)
        setOpen(false)

        notify('Modification executée avec succès', 'success')
      } else {
        const newHouse = await addHouses({
          ...data,
          insideImages: imagefiles,
          userId: AuthUser.id,
        })
        const date = Date.now() / 1000
        const seconds = parseInt(date, 10)

        const dataFormated = { seconds }

        newHouse.objectID = newHouse.id
        newHouse.createdAt = dataFormated
        newHouse.updatedAt = dataFormated
        index.saveObjects([newHouse])

        newHouse['createdAt'] = await getCurrentDateOnline()

        setData({ houses: [newHouse, ...houses], lastElement })
        setImages([])
        setOpen(false)
        reset()

        notify('Votre requète s est executée avec succès', 'success')
      }
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
        title={"Enregistrement d'un  Logement"}
        description={'Veillez remplir le formulaire suivant...'}
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
                  className="ml-4 inline-flex justify-center border border-transparent bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
            <h1 className="text-primary-accent">Description du logement</h1>

            <div className="grid grid-cols-6 gap-6 border-t pt-3">
              <div className="col-span-12 sm:col-span-3">
                <label
                  htmlFor="type de logement"
                  className="block text-sm font-medium text-gray-700"
                >
                  Type de Logement
                </label>

                <div className="mt-1">
                  <SimpleSelect
                    required={'Champs requis'}
                    name="houseType"
                    control={control}
                    options={houseType}
                    placeholder="Selectionner le type de logement"
                  />
                </div>
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.houseType?.message}
                </p>
              </div>
              <div className="col-span-12 sm:col-span-3">
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.isAvailable?.message}
                </p>
              </div>
              <div className="col-span-12 sm:col-span-3">
                <label
                  htmlFor="quartier"
                  className="block text-sm font-medium text-gray-700"
                >
                  Type d'offre
                </label>

                <div className="mt-1">
                  <SimpleSelect
                    required={'Champs requis'}
                    name="offerType"
                    control={control}
                    options={offerType}
                    placeholder="Selectionner le type doffre"
                  />
                </div>
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.offerType?.message}
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
                  for="exampleFormControlTextarea1"
                  class="form-label mb-2 inline-block text-gray-700"
                >
                  Description du logement
                </label>
                <textarea
                  type="text"
                  {...register('description', {
                    required: 'Champs requis',
                  })}
                  id="description"
                  autoComplete="street"
                  placeholder="la description ici"
                  class="
        form-control
        m-0
        block
        w-full
        rounded
        border
        border-solid
        border-gray-300
        bg-white bg-clip-padding
        px-3 py-1.5 text-base
        font-normal
        text-gray-700
        transition
        ease-in-out
        focus:border-blue-600 focus:bg-white focus:text-gray-700 focus:outline-none
      "
                  rows="3"
                ></textarea>
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.description?.message}
                </p>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label
                  htmlFor="position"
                  className="block text-sm font-medium text-gray-700"
                >
                  Prix mensuel
                </label>
                <input
                  type="number"
                  {...register('price', {
                    required: 'Champs requis',
                  })}
                  id="price"
                  autoComplete="family-name"
                  placeholder="le prix mensuel"
                  className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                />
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.price?.message}
                </p>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label
                  htmlFor="position"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre de mois d'avance
                </label>
                <input
                  type="number"
                  {...register('adVance', {
                    required: 'Champs requis',
                  })}
                  id="adVance"
                  autoComplete="family-name"
                  placeholder="nombre de mois"
                  className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                />
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.adVance?.message}
                </p>
              </div>

              <div className="col-span-12 sm:col-span-3">
                <label
                  htmlFor="commodite"
                  className="block text-sm font-medium text-gray-700"
                >
                  Commodité
                </label>

                <div className="mt-1">
                  <SimpleSelect
                    // required={'Champs requis'}
                    name="commodite"
                    control={control}
                    options={commodites}
                    placeholder="Selectionner le commodite"
                  />
                </div>
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.commodite?.message}
                </p>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label
                  htmlFor="position"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre de Chambres
                </label>
                <input
                  type="number"
                  {...register('partNumber', {
                    // required: 'Champs requis',
                  })}
                  id="partNumber"
                  autoComplete="family-name"
                  placeholder="Le nombre de chambres"
                  className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                />
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.partNumber?.message}
                </p>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label
                  htmlFor="surface"
                  className="block text-sm font-medium text-gray-700"
                >
                  Surface en m²
                </label>
                <input
                  type="text"
                  {...register('surface', {
                    required: 'Champs requis',
                  })}
                  id="surface"
                  autoComplete="family-name"
                  placeholder="la surface en m²"
                  className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                />
                <p className="pt-1 font-stratos-light text-xs text-red-600">
                  {errors?.surface?.message}
                </p>
              </div>
            </div>

            <h1 className="text-primary-accent">Adresse du logement</h1>
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

                <div className="col-span-6 sm:col-span-3">
                  <div className="mt-1">
                    <SimpleSelect
                      required={'Champs requis'}
                      name="section"
                      control={control}
                      options={towns[zone?.value]}
                      placeholder="Selectionner le quartier"
                    />
                  </div>

                  <p className="pt-1 font-stratos-light text-xs text-red-600">
                    {errors?.section?.message}
                  </p>
                </div>
              </div>

              <div className="col-span-12 sm:col-span-3"></div>
              <div className="col-span-12 sm:col-span-3">
                <div className="py-2">
                  <label
                    htmlFor="long"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Longitude
                  </label>
                  <input
                    disabled
                    type="text"
                    {...register('long')}
                    id="long"
                    placeholder="Coordonnée long"
                    className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div className="py-2">
                  <label
                    htmlFor="lat"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Latitude
                  </label>
                  <input
                    disabled
                    type="text"
                    {...register('lat')}
                    id="lat"
                    placeholder="Coordonnée lat"
                    className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
              <div className="col-span-12 sm:col-span-6 ">
                <GoogleMaps
                  lat={house?.address?.commune?.lat}
                  lng={house?.address?.commune?.long}
                  setLonLat={setLonLat}
                />
              </div>
            </div>

            <h1 className="text-primary-accent">Selection Dimages</h1>

            <div className="grid grid-cols-6 gap-24 border-t pt-3">
              <div className="col-span-2 sm:col-span-2">
                <label
                  htmlFor="rccm"
                  className="block text-sm font-medium text-gray-700"
                >
                  Image vitrine du logement
                </label>

                <div className="mt-1 sm:col-span-2 sm:mt-0">
                  <div className="rounded-xs flex max-w-lg justify-center border-2 border-dashed border-gray-300 px-2 pt-5 pb-6">
                    <div className="space-y-1 text-center">
                      {files?.length > 0 ? (
                        house?.imageUrl > 0 ? (
                          <img
                            src={URL.createObjectURL(files[0])}
                            alt="preview"
                          />
                        ) : (
                          <img
                            src={
                              files?.length == 1
                                ? URL.createObjectURL(files[0])
                                : house?.imageUrl
                            }
                            alt="preview"
                          />
                        )
                      ) : house ? (
                        <img src={house.imageUrl} alt="preview" />
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
                              required: files == 0 && !house?.imageUrl,
                            })}
                            type="file"
                            className="sr-only"
                          />
                        </label>
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

              <div className="col-span-6 w-full  sm:col-span-4">
                <label
                  htmlFor="position"
                  className="block text-sm font-medium text-gray-700"
                >
                  Charger les images interieurs
                </label>
                <input
                  // required
                  type="file"
                  name="images"
                  onChange={onSelectFile}
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                />
                <div className=" flex w-full gap-5">
                  {images &&
                    images.map((image, index) => {
                      return (
                        <div key={image + index} className="mt-5 ">
                          <img
                            src={image}
                            alt=""
                            className="h-48 w-96 object-fill"
                          />
                          {images.length > 0 ? (
                            <button
                              className="w-full p-5 text-center text-sm text-gray-400  "
                              onClick={() =>
                                setImages(images.filter((e) => e !== image))
                              }
                            >
                              suprimer limage
                            </button>
                          ) : (
                            <RiImage2Fill className="mx-auto h-12 w-12 text-gray-400" />
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrawerForm>
    </>
  )
}

export default HouseFormDrawer
