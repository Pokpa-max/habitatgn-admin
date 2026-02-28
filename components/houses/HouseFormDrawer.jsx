import { useAuthUser } from 'next-firebase-auth'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiImage2Fill, RiCloseLine, RiCheckLine } from 'react-icons/ri'
import { client } from '../../lib/algolia'
import { addHouses, editHouse } from '../../lib/services/houses'
import { getCurrentDateOnline } from '../../utils/date'
import { autoFillHouseForm } from '../../utils/functionFactory'
import { notify } from '../../utils/toast'
import {
  CONAKRY_COMMUNES,
  houseType,
  offerType,
  commodites,
  furnishingOptions,
  currencyOptions,
} from '../../_data'
import { useColors } from '../../contexts/ColorContext'
import DrawerForm from '../DrawerForm'
import GoogleMaps from '../GoogleMaps'
import Loader from '../Loader'
import SimpleSelect from '../SimpleSelect'
import MultiSelect from '../MultiSelect'

function HouseFormDrawer({ house, open, setOpen, setData, data }) {
  const colors = useColors()
  const AuthUser = useAuthUser()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])
  const [imagefiles, setImageFiles] = useState([])

  data = data || {}
  const { houses, lastElement } = data

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
    defaultValues: { isAvailable: true, currency: { label: 'GNF', value: 'GNF' } },
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
    if (house) {
      setImages(house.houseInsides || [])
      setImageFiles([])
      setPreviewUrl(house?.imageUrl || null)
    } else {
      setImages([])
      setImageFiles([])
      setPreviewUrl(null)
    }
    autoFillHouseForm(reset, setValue, house)
  }, [house, open])

  const files = watch('imageUrl')
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    let objectUrl = null
    if (!files) {
      setPreviewUrl(house?.imageUrl || null)
      return
    }
    if (typeof files === 'string') {
      setPreviewUrl(files)
      return
    }
    const first = files?.[0]
    if (!first) {
      setPreviewUrl(house?.imageUrl || null)
      return
    }
    if (typeof first === 'string') {
      setPreviewUrl(first)
      return
    }
    objectUrl = URL.createObjectURL(first)
    setPreviewUrl(objectUrl)
    return () => objectUrl && URL.revokeObjectURL(objectUrl)
  }, [files, house?.imageUrl])

  const onSubmit = async (data) => {
    const index = client.initIndex('houses')
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

      if (house) {
        const dataR = await editHouse(house, data, imagefiles)
        const houseCopy = JSON.parse(JSON.stringify(houses))
        const updatedAt = await getCurrentDateOnline()
        const newHouses = houseCopy.map((res) =>
          house.id === res.id ? { ...res, ...dataR, updatedAt } : res
        )
        newHouses.updatedAt = dataFormated
        newHouses.createdAt = dataFormated
        index.partialUpdateObjects({ newHouses })
        setData({ houses: newHouses, lastElement })
        setOpen(false)
        notify('Modification effectuée avec succès', 'success')
      } else {
        const newHouse = await addHouses({
          ...data,
          insideImages: imagefiles,
          userId: AuthUser.id,
        })
        newHouse.objectID = newHouse.id
        newHouse.createdAt = dataFormated
        newHouse.updatedAt = dataFormated
        index.saveObjects([newHouse])
        newHouse['createdAt'] = await getCurrentDateOnline()
        setData({ houses: [newHouse, ...houses], lastElement })
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
      <style>{`
        .form-section {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .form-section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .section-icon {
          width: 36px;
          height: 36px;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .section-icon.basic {
          background-color: rgba(59, 130, 246, 0.15);
          color: ${colors.primary || '#3b82f6'};
        }

        .section-icon.location {
          background-color: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .section-icon.images {
          background-color: rgba(168, 85, 247, 0.15);
          color: #a855f7;
        }

        .form-section-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #111827;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin: 0;
        }

        .form-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .form-input, .form-select {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          padding: 0.6rem 0.85rem;
          font-size: 0.875rem;
          color: #111827;
          background-color: #fff;
          transition: all 0.2s ease;
        }

        .form-input:focus, .form-select:focus {
          border-color: ${colors.primary || '#3b82f6'};
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .form-input::placeholder {
          color: #9ca3af;
        }

        .form-error {
          font-size: 0.7rem;
          color: #dc2626;
          margin-top: 0.2rem;
          font-weight: 600;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-row:last-child {
          margin-bottom: 0;
        }

        .form-group {
          grid-column: span 6;
        }

        .form-group.col-2 {
          grid-column: span 2;
        }

        .form-group.col-3 {
          grid-column: span 3;
        }

        @media (max-width: 640px) {
          .form-group.col-2, .form-group.col-3 {
            grid-column: span 6;
          }
        }

        .image-upload-area {
          border: 2px dashed #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem 1.25rem;
          text-align: center;
          background-color: #fff;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .image-upload-area:hover {
          border-color: ${colors.primary || '#3b82f6'};
          background-color: rgba(59, 130, 246, 0.02);
        }

        .image-preview {
          position: relative;
          border-radius: 0.375rem;
          overflow: hidden;
          aspect-ratio: 16/9;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .image-delete-btn {
          position: absolute;
          top: 0.35rem;
          right: 0.35rem;
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          border: none;
          padding: 0.35rem;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-delete-btn:hover {
          background-color: #dc2626;
        }
      `}</style>

      <DrawerForm
        open={open}
        setOpen={setOpen}
        onSubmit={handleSubmit(onSubmit)}
        title={house ? 'Modifier le Logement' : 'Ajouter un Logement'}
        description={
          house ? 'Mettez à jour les informations' : 'Remplissez le formulaire'
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
          <div className="form-section">
            <div className="form-section-header">
              <div className="section-icon basic">📋</div>
              <h3 className="form-section-title">Informations Basiques</h3>
            </div>

            {/* Ligne 1 : type logement | type offre | ville */}
            <div className="form-row">
              <div className="form-group col-2">
                <label className="form-label">Type Logement</label>
                <SimpleSelect
                  required="Requis"
                  creatable
                  name="houseType"
                  control={control}
                  options={houseType}
                  placeholder="Sélectionner"
                />
                {errors?.houseType && (
                  <span className="form-error">{errors.houseType.message}</span>
                )}
              </div>

              <div className="form-group col-2">
                <label className="form-label">Type Offre</label>
                <SimpleSelect
                  required="Requis"
                  creatable
                  name="offerType"
                  control={control}
                  options={offerType}
                  placeholder="Sélectionner"
                />
                {errors?.offerType && (
                  <span className="form-error">{errors.offerType.message}</span>
                )}
              </div>

              <div className="form-group col-2">
                <label className="form-label">Ville *</label>
                <input
                  type="text"
                  {...register('town', { required: 'Requis' })}
                  className="form-input"
                  placeholder="Ex: Conakry"
                />
                {errors?.town && (
                  <span className="form-error">{errors.town.message}</span>
                )}
              </div>
            </div>

            {/* Ligne 2 : prix | devise | téléphone */}
            <div className="form-row">
              <div className="form-group col-2">
                <label className="form-label">Prix</label>
                <input
                  type="number"
                  {...register('price', { required: 'Requis' })}
                  className="form-input"
                  placeholder="0"
                />
                {errors?.price && (
                  <span className="form-error">{errors.price.message}</span>
                )}
              </div>

              <div className="form-group col-2">
                <label className="form-label">Devise</label>
                <SimpleSelect
                  name="currency"
                  control={control}
                  options={currencyOptions}
                  placeholder="GNF"
                />
              </div>

              <div className="form-group col-2">
                <label className="form-label">Téléphone *</label>
                <input
                  type="tel"
                  {...register('phoneNumber', { required: 'Requis' })}
                  className="form-input"
                  placeholder="+224 612345678"
                />
                {errors?.phoneNumber && (
                  <span className="form-error">{errors.phoneNumber.message}</span>
                )}
              </div>
            </div>

            {/* Ligne 3 : caution | mois d'avance | meublé */}
            <div className="form-row">
              <div className="form-group col-2">
                <label className="form-label">Caution</label>
                <input
                  type="number"
                  {...register('deposit')}
                  className="form-input"
                  placeholder="0"
                />
              </div>

              <div className="form-group col-2">
                <label className="form-label">Mois d'avance *</label>
                <input
                  type="number"
                  {...register('advanceMonths', { required: 'Requis' })}
                  className="form-input"
                  placeholder="0"
                />
                {errors?.advanceMonths && (
                  <span className="form-error">{errors.advanceMonths.message}</span>
                )}
              </div>

              <div className="form-group col-2">
                <label className="form-label">Meublé</label>
                <SimpleSelect
                  name="furnishing"
                  control={control}
                  options={furnishingOptions}
                  placeholder="Sélectionner"
                />
              </div>
            </div>

            {/* Ligne 4 : chambres | salles de bain | étage */}
            <div className="form-row">
              <div className="form-group col-2">
                <label className="form-label">Chambres</label>
                <input
                  type="number"
                  {...register('bedrooms')}
                  className="form-input"
                  placeholder="0"
                />
              </div>

              <div className="form-group col-2">
                <label className="form-label">Salles de bain</label>
                <input
                  type="number"
                  {...register('bathrooms')}
                  className="form-input"
                  placeholder="0"
                />
              </div>

              <div className="form-group col-2">
                <label className="form-label">Étage</label>
                <input
                  type="number"
                  {...register('floor')}
                  className="form-input"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Ligne 5 : surface | commodités */}
            <div className="form-row">
              <div className="form-group col-3">
                <label className="form-label">Surface (m²)</label>
                <input
                  type="text"
                  {...register('surface')}
                  className="form-input"
                  placeholder="0"
                />
              </div>

              <div className="form-group col-3">
                <label className="form-label">Commodités</label>
                <MultiSelect
                  creatable
                  name="commodites"
                  control={control}
                  options={commodites}
                  placeholder="Sélectionner"
                />
              </div>
            </div>

            {/* Ligne 6 : description */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  {...register('description')}
                  className="form-input"
                  placeholder="Décrivez le logement..."
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Localisation */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="section-icon location">📍</div>
              <h3 className="form-section-title">Localisation</h3>
            </div>

            <div className="form-row">
              <div className="form-group col-2">
                <label className="form-label">Commune</label>
                <SimpleSelect
                  creatable
                  name="zone"
                  control={control}
                  options={CONAKRY_COMMUNES}
                  placeholder="Sélectionner"
                />
              </div>

              <div className="form-group col-2">
                <label className="form-label">Quartier</label>
                <input
                  type="text"
                  {...register('section', { required: 'Requis' })}
                  className="form-input"
                  placeholder="Ex: Kipé, Madina..."
                />
                {errors?.section && (
                  <span className="form-error">{errors.section.message}</span>
                )}
              </div>

              <div className="form-group col-2">
                <label className="form-label">Longitude *</label>
                <input
                  readOnly
                  type="text"
                  {...register('long', { required: 'Sélectionnez un point sur la carte' })}
                  className="form-input bg-gray-50 cursor-not-allowed"
                  placeholder="Auto (carte)"
                />
                {errors?.long && (
                  <span className="form-error">{errors.long.message}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col-2">
                <label className="form-label">Latitude *</label>
                <input
                  readOnly
                  type="text"
                  {...register('lat', { required: 'Sélectionnez un point sur la carte' })}
                  className="form-input bg-gray-50 cursor-not-allowed"
                  placeholder="Auto (carte)"
                />
                {errors?.lat && (
                  <span className="form-error">{errors.lat.message}</span>
                )}
              </div>

              <div className="form-group col-4">
                <label className="form-label">Carte Localisation</label>
                <GoogleMaps
                  lat={house?.address?.lat}
                  lng={house?.address?.long}
                  setLonLat={setLonLat}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Images */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="section-icon images">🖼️</div>
              <h3 className="form-section-title">Images</h3>
            </div>

            <div className="form-row">
              <div className="form-group col-3">
                <label className="form-label">Image Principale</label>
                <div className="image-upload-area">
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

              <div className="form-group col-3">
                <label className="form-label">Autres Images</label>
                <input
                  type="file"
                  name="images"
                  onChange={onSelectFile}
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  className="form-input text-xs"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Sélectionnez plusieurs images
                </p>
              </div>
            </div>

            {images && images.length > 0 && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Aperçu des Images</label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {images.map((image, index) => (
                      <div key={image + index} className="image-preview">
                        <img
                          src={image}
                          alt="interior"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          className="image-delete-btn"
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

export default HouseFormDrawer
