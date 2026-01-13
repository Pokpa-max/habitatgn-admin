
// export default HouseFormDrawer
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
  zones,
  towns,
  houseType,
  offerType,
  commodites,
  furnishingOptions,
  townOptions,
} from '../../_data'
import { useColors } from '../../contexts/ColorContext'
import DrawerForm from '../DrawerForm'
import GoogleMaps from '../GoogleMaps'
import Loader from '../Loader'
import SimpleSelect from '../SimpleSelect'
import MultiSelect from '../MultiSelect'
import Toggle from '../Toggle'

function HouseFormDrawer({ house, open, setOpen, setData, data }) {
  const colors = useColors()
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
      isAvailable: true,
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
    // Clear form state when the drawer is closed
    if (!open) {
      setImages([])
      setImageFiles([])
      setPreviewUrl(null)
      reset()
      return
    }

    const setFormvalue = () => {
      if (house) {
        // Prefill images for edit
        setImages(house.houseInsides || [])
        setImageFiles([])
        setPreviewUrl(house?.imageUrl || null)
      } else {
        // New house: ensure no leftover images remain
        setImages([])
        setImageFiles([])
        setPreviewUrl(null)
      }

      autoFillHouseForm(reset, setValue, house)
    }
    setFormvalue()
  }, [house, open])

  const files = watch('imageUrl')
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    let objectUrl = null
    // If there are no files, show house image or nothing
    if (!files) {
      setPreviewUrl(house?.imageUrl || null)
      return
    }

    // If files is a string (saved url), use it directly
    if (typeof files === 'string') {
      setPreviewUrl(files)
      return
    }

    // FileList or array
    const first = files && files[0]
    if (!first) {
      setPreviewUrl(house?.imageUrl || null)
      return
    }

    if (typeof first === 'string') {
      setPreviewUrl(first)
      return
    }

    // first is File or Blob
    objectUrl = URL.createObjectURL(first)
    setPreviewUrl(objectUrl)

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
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
        .form-section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: ${colors.gray800};
          margin: 2rem 0 1.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .form-section-title::before {
          content: '';
          display: block;
          width: 4px;
          height: 1.5rem;
          background-color: ${colors.primary};
          border-radius: 2px;
        }

        .form-input, .form-select {
          width: 100%;
          border: 1px solid ${colors.gray300};
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.95rem;
          color: ${colors.gray900};
          background-color: #fff;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .form-input:focus, .form-select:focus {
          border-color: ${colors.primary};
          box-shadow: 0 0 0 4px ${colors.primaryVeryLight};
          outline: none;
        }

        .form-input::placeholder {
          color: ${colors.gray400};
        }

        .form-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: ${colors.gray700};
          margin-bottom: 0.375rem;
          letter-spacing: 0.01em;
        }

        .form-error {
          font-size: 0.75rem;
          color: ${colors.error};
          margin-top: 0.25rem;
          font-weight: 500;
        }

        .image-upload-area {
          border: 2px dashed ${colors.gray200};
          border-radius: 0.75rem;
          padding: 2.5rem 1.5rem;
          text-align: center;
          background-color: ${colors.gray50};
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .image-upload-area:hover {
          border-color: ${colors.primary};
          background-color: ${colors.primaryVeryLight};
        }

        .image-preview {
          position: relative;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          aspect-ratio: 16/9;
        }

        .image-delete-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background-color: rgba(255, 255, 255, 0.9);
          color: ${colors.error};
          border: none;
          padding: 0.4rem;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .image-delete-btn:hover {
          background-color: ${colors.error};
          color: white;
          transform: scale(1.05);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 1.25rem;
        }

        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>

      <DrawerForm
        open={open}
        setOpen={setOpen}
        onSubmit={handleSubmit(onSubmit)}
        title={house ? 'Modifier le Logement' : 'Enregistrer un Logement'}
        description={
          house
            ? 'Mettez à jour les informations du logement'
            : 'Veuillez remplir le formulaire suivant...'
        }
        footerButtons={
          <>
            {loading ? (
              <div
                className="ml-4 inline-flex w-[22.5rem] justify-center rounded-lg border-2 px-4 py-2 text-sm font-medium text-white"
                style={{
                  borderColor: colors.primary,
                  backgroundColor: colors.primary,
                }}
              >
                <Loader />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded-lg border-2 px-6 py-2 text-sm font-bold transition-all"
                  style={{
                    borderColor: colors.gray300,
                    backgroundColor: colors.white,
                    color: colors.gray700,
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = colors.gray50)
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = colors.white)
                  }
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="ml-4 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-bold text-white transition-all hover:shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                  }}
                >
                  <RiCheckLine className="h-4 w-4" />
                  Enregistrer
                </button>
              </>
            )}
          </>
        }
      >
        <div className="mt-5 md:col-span-2 md:mt-0">
          <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
            {/* Description Section */}
            <div>
              <h2 className="form-section-title">Description du Logement</h2>

                {/* Row 1: Type, Offre, Ville */}
              <div className="form-grid mt-4">
                <div className="col-span-6 sm:col-span-2">
                  <label className="form-label">Type de Logement</label>
                  <SimpleSelect
                    required={'Champs requis'}
                    creatable={true}
                    name="houseType"
                    control={control}
                    options={houseType}
                    placeholder="Sélectionner ou créer"
                  />
                  {errors?.houseType && (
                    <span className="form-error">
                      {errors.houseType.message}
                    </span>
                  )}
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label className="form-label">Type d'Offre</label>
                  <SimpleSelect
                    required={'Champs requis'}
                    creatable={true}
                    name="offerType"
                    control={control}
                    options={offerType}
                    placeholder="Sélectionner ou créer"
                  />
                  {errors?.offerType && (
                    <span className="form-error">
                      {errors.offerType.message}
                    </span>
                  )}
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label className="form-label">Ville</label>
                  <SimpleSelect
                    creatable={true}
                    name="town"
                    control={control}
                    options={townOptions}
                    placeholder="Sélectionner ou créer"
                  />
                </div>

                {/* Row 2: Prix, Cautions */}
                <div className="col-span-6 sm:col-span-2">
                  <label className="form-label">Prix Mensuel (GNF)</label>
                  <input
                    type="number"
                    {...register('price', {
                      required: 'Champs requis',
                    })}
                    className="form-input w-full"
                    placeholder="0"
                  />
                  {errors?.price && (
                    <span className="form-error">{errors.price.message}</span>
                  )}
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label className="form-label">Caution Logement</label>
                  <input
                    type="number"
                    {...register('housingDeposit')}
                    className="form-input w-full"
                    placeholder="0"
                  />
                </div>



                {/* Row 3: Phone, Surface, Chambres */}
                <div className="col-span-6 sm:col-span-2">
                  <label className="form-label">Téléphone</label>
                  <div className="relative">
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
                      style={{ color: colors.gray500 }}
                    >
                      <span className="text-sm font-medium">+224</span>
                    </div>
                    <input
                      type="tel"
                      {...register('phoneNumber', {
                        pattern: /^(?:\+224|00224)?\s?[2-9]\d{7}$/,
                      })}
                      className="form-input w-full pl-12"
                      placeholder="Ex: 612345678"
                    />
                  </div>
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label className="form-label">Nombre de Chambres</label>
                  <input
                    type="number"
                    {...register('bedrooms')}
                    className="form-input w-full"
                    placeholder="0"
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label className="form-label">Surface (m²)</label>
                  <input
                    type="text"
                    {...register('surface')}
                    className="form-input w-full"
                    placeholder="0"
                  />
                </div>

                {/* Row 4: Specs */}
                <div className="col-span-6 sm:col-span-2">
                  <label className="form-label">Meublé (Type)</label>
                  <SimpleSelect
                    name="furnishing"
                    control={control}
                    options={furnishingOptions}
                    placeholder="Sélectionner"
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <label className="form-label">Statut Location</label>
                  <input
                    type="text"
                    {...register('rentalStatus')}
                    className="form-input w-full"
                    placeholder="Ex: Marié"
                  />
                </div>



                {/* Commodités (Full Width) */}
                <div className="col-span-6">
                  <label className="form-label">Commodités</label>
                  <MultiSelect
                    creatable={true}
                    name="commodites"
                    control={control}
                    options={commodites}
                    placeholder="Sélectionner ou créer"
                  />
                </div>

                {/* Description */}
                <div className="col-span-6">
                  <label className="form-label">Description du Logement</label>
                  <textarea
                    {...register('description')}
                    className="form-input w-full"
                    placeholder="Décrivez votre logement..."
                    rows="3"
                  />
                </div>
              </div>
            </div>

            {/* Adresse Section */}
            <div>
              <h2 className="form-section-title">Adresse du Logement</h2>

              <div className="form-grid mt-4">
                {/* Commune */}
                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Commune</label>
                  <SimpleSelect
                    required={'Champs requis'}
                    creatable={true}
                    name="zone"
                    control={control}
                    options={zones}
                    placeholder="Sélectionner ou créer"
                  />
                  {errors?.zone && (
                    <span className="form-error">{errors.zone.message}</span>
                  )}
                </div>

                {/* Quartier */}
                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Quartier</label>
                  <SimpleSelect
                    required={'Champs requis'}
                    creatable={true}
                    name="section"
                    control={control}
                    options={towns[zone?.value] || []}
                    placeholder="Sélectionner ou créer"
                  />
                  {errors?.section && (
                    <span className="form-error">{errors.section.message}</span>
                  )}
                </div>

                {/* Coordonnées */}
                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Longitude</label>
                  <input
                    disabled
                    type="text"
                    {...register('long')}
                    className="form-input w-full"
                    style={{
                      backgroundColor: colors.gray50,
                      cursor: 'not-allowed',
                    }}
                    placeholder="Auto-rempli"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Latitude</label>
                  <input
                    disabled
                    type="text"
                    {...register('lat')}
                    className="form-input w-full"
                    style={{
                      backgroundColor: colors.gray50,
                      cursor: 'not-allowed',
                    }}
                    placeholder="Auto-rempli"
                  />
                </div>

                {/* Carte */}
                <div className="col-span-6">
                  <label className="form-label">Localisation sur Carte</label>
                  <GoogleMaps
                    lat={house?.address?.lat}
                    lng={house?.address?.long}
                    setLonLat={setLonLat}
                  />
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div>
              <h2 className="form-section-title">Images du Logement</h2>

              <div className="form-grid mt-4">
                {/* Image Vitrine */}
                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Image Vitrine</label>
                  <div className="image-upload-area">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="preview"
                        className="mx-auto h-32 w-32 rounded object-cover"
                      />
                    ) : (
                      <RiImage2Fill
                        className="mx-auto h-12 w-12"
                        style={{ color: colors.gray400 }}
                      />
                    )}

                    <div className="mt-2 flex justify-center">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                        style={{
                          color: colors.primary,
                          backgroundColor: colors.primaryVeryLight,
                        }}
                      >
                        <span>Charger image</span>
                        <input
                          id="file-upload"
                          {...register('imageUrl', {
                            required: files?.length === 0 && !house?.imageUrl,
                          })}
                          type="file"
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p
                      style={{ color: colors.gray500 }}
                      className="mt-2 text-xs"
                    >
                      PNG, JPG, GIF jusqu'à 10MB
                    </p>
                  </div>
                  {errors?.imageUrl && (
                    <span className="form-error">
                      Veuillez sélectionner une image
                    </span>
                  )}
                </div>

                {/* Images Intérieures */}
                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Images Intérieures</label>
                  <input
                    type="file"
                    name="images"
                    onChange={onSelectFile}
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    className="form-input w-full"
                  />
                </div>
              </div>

              {/* Image Previews */}
              {images && images.length > 0 && (
                <div className="mt-6">
                  <p className="form-label mb-4">Aperçu des images</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {images.map((image, index) => {
                      return (
                        <div key={image + index} className="image-preview">
                          <img
                            src={image}
                            alt="interior"
                            className="h-48 w-full object-cover"
                          />
                          <button
                            type="button"
                            className="image-delete-btn"
                            onClick={() =>
                              setImages(images.filter((e) => e !== image))
                            }
                          >
                            <RiCloseLine className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
      
      </DrawerForm>
    </>
  )
}

export default HouseFormDrawer
