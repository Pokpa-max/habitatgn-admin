import { useAuthUser } from 'next-firebase-auth'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiCloseLine, RiCheckLine } from 'react-icons/ri'
import { client } from '../../lib/algolia'
import { addLand, editLand } from '../../lib/services/lands'
import { getCurrentDateOnline } from '../../utils/date'
import { autoFillLandForm } from '../../lib/models/Land'
import { notify } from '../../utils/toast'
import { CONAKRY_COMMUNES, currencyOptions, offerType as offerTypeOptions } from '../../_data'
import { useColors } from '../../contexts/ColorContext'
import DrawerForm from '../DrawerForm'
import GoogleMaps from '../GoogleMaps'
import Loader from '../Loader'
import SimpleSelect from '../SimpleSelect'

function LandFormDrawer({ land, open, setOpen, setData, data }) {
  const colors = useColors()
  const AuthUser = useAuthUser()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])
  const [imagefiles, setImageFiles] = useState([])

  data = data || {}
  const { lands, lastElement } = data

  const onSelectFile = (event) => {
    const selectedFileArray = Array.from(event.target.files)
    const imagesArray = selectedFileArray.map((file) =>
      URL.createObjectURL(file)
    )
    setImageFiles(selectedFileArray)
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
      isAvailable: true,
      currency: { label: 'GNF', value: 'GNF' },
    },
    reValidateMode: 'onChange',
    shouldUnregister: false,
  })

  const setLonLat = (lon, lat) => {
    setValue('long', lon)
    setValue('lat', lat)
  }

  useEffect(() => {
    if (!open) {
      setImages([])
      setImageFiles([])
      setPreviewUrl(null)
      reset()
      return
    }
    if (land) {
      setImages(land.images || land.houseInsides || [])
      setImageFiles([])
      setPreviewUrl(land?.imageUrl || null)
    } else {
      setImages([])
      setImageFiles([])
      setPreviewUrl(null)
    }
    autoFillLandForm(reset, setValue, land)
  }, [land, open])

  const files = watch('imageUrl')
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    let objectUrl = null
    if (!files) {
      setPreviewUrl(land?.imageUrl || null)
      return
    }
    if (typeof files === 'string') {
      setPreviewUrl(files)
      return
    }
    const first = files?.[0]
    if (!first) {
      setPreviewUrl(land?.imageUrl || null)
      return
    }
    if (typeof first === 'string') {
      setPreviewUrl(first)
      return
    }
    objectUrl = URL.createObjectURL(first)
    setPreviewUrl(objectUrl)
    return () => objectUrl && URL.revokeObjectURL(objectUrl)
  }, [files, land?.imageUrl])

  const onSubmit = async (data) => {
    setLoading(true)

    const normalizePhone = (p) => {
      if (!p) return null
      const digits = String(p).replace(/\D/g, '')
      if (digits.length === 8) return `+224${digits}`
      if (digits.length === 11 && digits.startsWith('224')) return `+${digits}`
      if (digits.length === 12 && digits.startsWith('00224'))
        return `+${digits.slice(2)}`
      return p
    }

    if (data?.phoneNumber) data.phoneNumber = normalizePhone(data.phoneNumber)

    try {
      const date = Date.now() / 1000
      const seconds = parseInt(date, 10)
      const dataFormated = { seconds }

      if (land) {
        const dataR = await editLand(land, data, imagefiles)
        const itemsCopy = JSON.parse(JSON.stringify(lands || []))
        const updatedAt = await getCurrentDateOnline()
        const newItems = itemsCopy.map((res) =>
          land.id === res.id ? { ...res, ...dataR, updatedAt } : res
        )
        newItems.updatedAt = dataFormated
        newItems.createdAt = dataFormated
        setData({ lands: newItems, lastElement })
        setOpen(false)
        notify('Modification effectuée avec succès', 'success')
      } else {
        const newItem = await addLand({
          ...data,
          insideImages: imagefiles,
          userId: AuthUser.id,
        })
        newItem.objectID = newItem.id
        newItem.createdAt = dataFormated
        newItem.updatedAt = dataFormated
        newItem['createdAt'] = await getCurrentDateOnline()
        setData({ lands: [newItem, ...(lands || [])], lastElement })
        setImages([])
        setOpen(false)
        reset()
        notify("Votre requête s'est exécutée avec succès", 'success')
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
        title={land ? 'Modifier le Terrain' : 'Ajouter un Terrain'}
        description={
          land ? 'Mettez à jour les informations' : 'Remplissez le formulaire'
        }
        footerButtons={
          <>
            {loading ? (
              <div
                className="inline-flex justify-center rounded px-6 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: colors.primary || '#3b82f6' }}
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
                  style={{ backgroundColor: colors.primary || '#3b82f6' }}
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
          {/* SECTION 1: Informations Basiques */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <div className="mb-5 flex items-center gap-3 border-b-2 border-gray-200 pb-4">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: colors.primary || '#3b82f6' }}
              >📋</div>
              <h3 className="m-0 text-sm font-bold uppercase tracking-wide text-gray-900">Informations Basiques</h3>
            </div>

            {/* Row 1: offerType | price | currency */}
            <div className="mb-4 grid grid-cols-6 gap-4 last:mb-0">
              <div className="col-span-6 sm:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Type d'offre</label>
                <SimpleSelect
                  required="Requis"
                  name="offerType"
                  control={control}
                  options={offerTypeOptions}
                  placeholder="Sélectionner"
                />
                {errors?.offerType && (
                  <span className="mt-1 text-xs font-semibold text-red-600">{errors.offerType.message}</span>
                )}
              </div>

              <div className="col-span-6 sm:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Prix</label>
                <input
                  type="number"
                  {...register('price', { required: 'Requis' })}
                  className="w-full rounded-md border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  placeholder="0"
                />
                {errors?.price && (
                  <span className="mt-1 text-xs font-semibold text-red-600">{errors.price.message}</span>
                )}
              </div>

              <div className="col-span-6 sm:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Devise</label>
                <SimpleSelect
                  name="currency"
                  control={control}
                  options={currencyOptions}
                  placeholder="GNF"
                />
              </div>
            </div>

            {/* Row 2: area | phoneNumber */}
            <div className="mb-4 grid grid-cols-6 gap-4 last:mb-0">
              <div className="col-span-6 sm:col-span-3">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Superficie (m²)</label>
                <input
                  type="number"
                  {...register('area')}
                  className="w-full rounded-md border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  placeholder="0"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Téléphone *</label>
                <input
                  type="tel"
                  {...register('phoneNumber', { required: 'Requis' })}
                  className="w-full rounded-md border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  placeholder="+224 612345678"
                />
                {errors?.phoneNumber && (
                  <span className="mt-1 text-xs font-semibold text-red-600">{errors.phoneNumber.message}</span>
                )}
              </div>
            </div>

            {/* Row 3: description */}
            <div className="mb-4 grid grid-cols-6 gap-4 last:mb-0">
              <div className="col-span-6">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Description</label>
                <textarea
                  {...register('description')}
                  className="w-full rounded-md border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  placeholder="Décrivez le terrain..."
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Localisation */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <div className="mb-5 flex items-center gap-3 border-b-2 border-gray-200 pb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100/15 text-xl text-green-500">📍</div>
              <h3 className="m-0 text-sm font-bold uppercase tracking-wide text-gray-900">Localisation</h3>
            </div>

            <div className="mb-4 grid grid-cols-6 gap-4 last:mb-0">
              <div className="col-span-6 sm:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Commune</label>
                <SimpleSelect
                  creatable
                  name="zone"
                  control={control}
                  options={CONAKRY_COMMUNES}
                  placeholder="Sélectionner"
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Ville *</label>
                <input
                  type="text"
                  {...register('town', { required: 'Requis' })}
                  className="w-full rounded-md border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  placeholder="Ex: Conakry"
                />
                {errors?.town && (
                  <span className="mt-1 text-xs font-semibold text-red-600">{errors.town.message}</span>
                )}
              </div>

              <div className="col-span-6 sm:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Quartier *</label>
                <input
                  type="text"
                  {...register('section', { required: 'Requis' })}
                  className="w-full rounded-md border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  placeholder="Ex: Kipé, Madina..."
                />
                {errors?.section && (
                  <span className="mt-1 text-xs font-semibold text-red-600">{errors.section.message}</span>
                )}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-6 gap-4 last:mb-0">
              <div className="col-span-6 sm:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Longitude *</label>
                <input
                  readOnly
                  type="text"
                  {...register('long', { required: 'Sélectionnez un point sur la carte' })}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 transition-all"
                  placeholder="Auto"
                />
                {errors?.long && (
                  <span className="mt-1 text-xs font-semibold text-red-600">{errors.long.message}</span>
                )}
              </div>
              <div className="col-span-6 sm:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Latitude *</label>
                <input
                  readOnly
                  type="text"
                  {...register('lat', { required: 'Sélectionnez un point sur la carte' })}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 transition-all"
                  placeholder="Auto"
                />
                {errors?.lat && (
                  <span className="mt-1 text-xs font-semibold text-red-600">{errors.lat.message}</span>
                )}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-6 gap-4 last:mb-0">
              <div className="col-span-6">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Carte Localisation</label>
                <GoogleMaps
                  lat={land?.address?.lat}
                  lng={land?.address?.long}
                  setLonLat={setLonLat}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Images */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <div className="mb-5 flex items-center gap-3 border-b-2 border-gray-200 pb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-100/15 text-xl text-pink-500">🖼️</div>
              <h3 className="m-0 text-sm font-bold uppercase tracking-wide text-gray-900">Images</h3>
            </div>

            <div className="mb-4 grid grid-cols-6 gap-4 last:mb-0">
              <div className="col-span-6 sm:col-span-3">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Image Principale</label>
                <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-200 bg-white px-5 py-6 text-center transition-all hover:border-blue-500 hover:bg-blue-500/5">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="mx-auto h-20 w-20 rounded object-cover"
                    />
                  ) : (
                    <div className="text-3xl">📸</div>
                  )}
                  <div className="mt-2 flex justify-center">
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer rounded px-3 py-1 text-xs font-semibold transition-all"
                      style={{
                        color: colors.primary || '#3b82f6',
                        backgroundColor: `rgba(59, 130, 246, 0.1)`,
                      }}
                    >
                      Charger
                      <input
                        id="file-upload"
                        {...register('imageUrl')}
                        type="file"
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF</p>
                </div>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Autres Images</label>
                <input
                  type="file"
                  name="images"
                  onChange={onSelectFile}
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  className="w-full rounded-md border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Sélectionnez plusieurs images
                </p>
              </div>
            </div>

            {images && images.length > 0 && (
              <div className="mb-4 grid grid-cols-6 gap-4 last:mb-0">
                <div className="col-span-6">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-800">Aperçu des Images</label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {images.map((image, index) => (
                      <div key={image + index} className="relative aspect-video overflow-hidden rounded-md shadow-sm">
                        <img
                          src={image}
                          alt="interior"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-none bg-black/60 text-white transition-all hover:bg-red-600"
                          onClick={() =>
                            setImages(images.filter((e) => e !== image))
                          }
                        >
                          <RiCloseLine className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DrawerForm>
    </>
  )
}

export default LandFormDrawer
