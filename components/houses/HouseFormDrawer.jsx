// import { useAuthUser } from 'next-firebase-auth'
// import React, { useEffect, useState } from 'react'

// import { useForm } from 'react-hook-form'
// import { RiImage2Fill } from 'react-icons/ri'
// import { client } from '../../lib/algolia'
// import { addHouses, editHouse } from '../../lib/services/houses'
// import { getCurrentDateOnline } from '../../utils/date'
// import { autoFillHouseForm } from '../../utils/functionFactory'
// import { notify } from '../../utils/toast'
// import { zones, towns, houseType, offerType, commodites } from '../../_data'

// import DrawerForm from '../DrawerForm'
// import GoogleMaps from '../GoogleMaps'
// import Loader from '../Loader'
// import SimpleSelect from '../SimpleSelect'

// function HouseFormDrawer({ house, open, setOpen, setData, data }) {
//   const AuthUser = useAuthUser()
//   const [loading, setLoading] = useState(false)
//   const [images, setImages] = useState([])
//   const [imagefiles, setImageFiles] = useState([])

//   data = data || {}
//   const { houses, lastElement } = data

//   const onSelectFile = (event) => {
//     const seletedFiles = event.target.files
//     const selectedFileArray = Array.from(seletedFiles)

//     const imagesArray = selectedFileArray.map((file) => {
//       return URL.createObjectURL(file)
//     })

//     const imagesArray2 = selectedFileArray.map((file) => {
//       return file
//     })

//     setImageFiles(imagesArray2)
//     setImages(imagesArray)
//   }

//   const {
//     handleSubmit,
//     register,
//     reset,
//     setValue,
//     watch,
//     control,
//     formState: { errors },
//   } = useForm({
//     mode: 'onBlur',
//     defaultValues: {
//       isSoldOut: false,
//     },
//     reValidateMode: 'onChange',
//     shouldUnregister: false,
//   })

//   const zone = watch('zone')

//   const setLonLat = (lon, lat) => {
//     setValue('long', lon)
//     setValue('lat', lat)
//   }

//   useEffect(() => {
//     const setFormvalue = () => {
//       if (house) {
//         setImages(house.houseInsides)
//       }

//       autoFillHouseForm(reset, setValue, house)
//     }
//     setFormvalue()
//   }, [house])

//   const files = watch('imageUrl')

//   const onSubmit = async (data) => {
//     const index = client.initIndex('houses')
//     setLoading(true)

//     try {
//       const date = Date.now() / 1000
//       const seconds = parseInt(date, 10)

//       const dataFormated = { seconds }

//       if (house) {
//         const dataR = await editHouse(house, data, imagefiles)
//         const update = async () => {
//           const houseCopy = JSON.parse(JSON.stringify(houses))
//           const updatedAt = await getCurrentDateOnline()
//           const newHouses = houseCopy.map((res) => {
//             if (house.id === res.id) {
//               return {
//                 ...res,
//                 ...dataR,
//                 updatedAt,
//               }
//             }
//             return res
//           })

//           newHouses.updatedAt = dataFormated
//           newHouses.createdAt = dataFormated
//           index.partialUpdateObjects({ newHouses })

//           setData({ houses: newHouses, lastElement })
//         }

//         update(data)
//         setOpen(false)

//         notify('Modification executée avec succès', 'success')
//       } else {
//         const newHouse = await addHouses({
//           ...data,
//           insideImages: imagefiles,
//           userId: AuthUser.id,
//         })
//         const date = Date.now() / 1000
//         const seconds = parseInt(date, 10)

//         const dataFormated = { seconds }

//         newHouse.objectID = newHouse.id
//         newHouse.createdAt = dataFormated
//         newHouse.updatedAt = dataFormated
//         index.saveObjects([newHouse])

//         newHouse['createdAt'] = await getCurrentDateOnline()

//         setData({ houses: [newHouse, ...houses], lastElement })
//         setImages([])
//         setOpen(false)
//         reset()

//         notify('Votre requète s est executée avec succès', 'success')
//       }
//     } catch (error) {
//       console.log(error)
//       notify('Une erreur est survenue', 'error')
//     }
//     setLoading(false)
//   }

//   return (
//     <>
//       <DrawerForm
//         open={open}
//         setOpen={setOpen}
//         onSubmit={handleSubmit(onSubmit)}
//         title={"Enregistrement d'un  Logement"}
//         description={'Veillez remplir le formulaire suivant...'}
//         footerButtons={
//           <>
//             {loading ? (
//               <div className="ml-4 inline-flex w-[22.5rem] justify-center border border-transparent bg-gray-300 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2">
//                 <Loader />
//               </div>
//             ) : (
//               <>
//                 <button
//                   type="button"
//                   className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
//                   onClick={() => setOpen(false)}
//                 >
//                   Annuler
//                 </button>
//                 <button
//                   type="submit"
//                   className="ml-4 inline-flex justify-center border border-transparent bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
//                 >
//                   Enregistrer
//                 </button>
//               </>
//             )}
//           </>
//         }
//       >
//         <div className="mt-5 md:col-span-2 md:mt-0">
//           <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
//             <h1 className="text-primary-accent">Description du logement</h1>

//             <div className="grid grid-cols-6 gap-6 border-t pt-3">
//               <div className="col-span-12 sm:col-span-3">
//                 <label
//                   htmlFor="type de logement"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Type de Logement
//                 </label>

//                 <div className="mt-1">
//                   <SimpleSelect
//                     required={'Champs requis'}
//                     name="houseType"
//                     control={control}
//                     options={houseType}
//                     placeholder="Selectionner le type de logement"
//                   />
//                 </div>
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.houseType?.message}
//                 </p>
//               </div>
//               <div className="col-span-12 sm:col-span-3">
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.isAvailable?.message}
//                 </p>
//               </div>
//               <div className="col-span-12 sm:col-span-3">
//                 <label
//                   htmlFor="quartier"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Type d'offre
//                 </label>

//                 <div className="mt-1">
//                   <SimpleSelect
//                     required={'Champs requis'}
//                     name="offerType"
//                     control={control}
//                     options={offerType}
//                     placeholder="Selectionner le type doffre"
//                   />
//                 </div>
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.offerType?.message}
//                 </p>
//               </div>

//               <div className="col-span-6 sm:col-span-3">
//                 <label
//                   htmlFor="phoneNumber"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Telephone
//                 </label>
//                 <div className="relative mt-1">
//                   <div className="pointer-events-none absolute inset-y-0 left-0 mr-5 flex items-center pl-3">
//                     <span className="text-gray-500 sm:text-sm">+224</span>
//                   </div>
//                   <input
//                     type="tel"
//                     {...register('phoneNumber', {
//                       required: 'Champs requis',
//                       pattern:
//                         /^(\+\d{3}\s?)?\(?\d{3}\)?[\s-]*\d{2}[\s-]*\d{2}[\s-]*\d{2}$/i,
//                     })}
//                     id="phoneNumber"
//                     className="block w-full border-gray-300 pl-12 pr-20 focus:border-primary focus:ring-primary sm:text-sm"
//                     placeholder="Votre numero de telephone"
//                   />
//                   <p className="pt-1 font-stratos-light text-xs text-red-600">
//                     {errors?.phoneNumber?.type === 'pattern'
//                       ? 'Entrez un numero valide'
//                       : errors?.phoneNumber?.message}
//                   </p>
//                 </div>
//               </div>

//               <div className="col-span-6 sm:col-span-3">
//                 <label
//                   for="exampleFormControlTextarea1"
//                   class="form-label mb-2 inline-block text-gray-700"
//                 >
//                   Description du logement
//                 </label>
//                 <textarea
//                   type="text"
//                   {...register('description', {
//                     required: 'Champs requis',
//                   })}
//                   id="description"
//                   autoComplete="street"
//                   placeholder="la description ici"
//                   class="
//         form-control
//         m-0
//         block
//         w-full
//         rounded
//         border
//         border-solid
//         border-gray-300
//         bg-white bg-clip-padding
//         px-3 py-1.5 text-base
//         font-normal
//         text-gray-700
//         transition
//         ease-in-out
//         focus:border-blue-600 focus:bg-white focus:text-gray-700 focus:outline-none
//       "
//                   rows="3"
//                 ></textarea>
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.description?.message}
//                 </p>
//               </div>

//               <div className="col-span-6 sm:col-span-3">
//                 <label
//                   htmlFor="position"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Prix mensuel
//                 </label>
//                 <input
//                   type="number"
//                   {...register('price', {
//                     required: 'Champs requis',
//                   })}
//                   id="price"
//                   autoComplete="family-name"
//                   placeholder="le prix mensuel"
//                   className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
//                 />
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.price?.message}
//                 </p>
//               </div>
//               <div className="col-span-6 sm:col-span-3">
//                 <label
//                   htmlFor="position"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Nombre de mois d'avance
//                 </label>
//                 <input
//                   type="number"
//                   {...register('adVance', {
//                     required: 'Champs requis',
//                   })}
//                   id="adVance"
//                   autoComplete="family-name"
//                   placeholder="nombre de mois"
//                   className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
//                 />
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.adVance?.message}
//                 </p>
//               </div>

//               <div className="col-span-12 sm:col-span-3">
//                 <label
//                   htmlFor="commodite"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Commodité
//                 </label>

//                 <div className="mt-1">
//                   <SimpleSelect
//                     // required={'Champs requis'}
//                     name="commodite"
//                     control={control}
//                     options={commodites}
//                     placeholder="Selectionner le commodite"
//                   />
//                 </div>
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.commodite?.message}
//                 </p>
//               </div>
//               <div className="col-span-6 sm:col-span-3">
//                 <label
//                   htmlFor="position"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Nombre de Chambres
//                 </label>
//                 <input
//                   type="number"
//                   {...register('partNumber', {
//                     // required: 'Champs requis',
//                   })}
//                   id="partNumber"
//                   autoComplete="family-name"
//                   placeholder="Le nombre de chambres"
//                   className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
//                 />
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.partNumber?.message}
//                 </p>
//               </div>

//               <div className="col-span-6 sm:col-span-3">
//                 <label
//                   htmlFor="surface"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Surface en m²
//                 </label>
//                 <input
//                   type="text"
//                   {...register('surface', {
//                     required: 'Champs requis',
//                   })}
//                   id="surface"
//                   autoComplete="family-name"
//                   placeholder="la surface en m²"
//                   className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
//                 />
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.surface?.message}
//                 </p>
//               </div>
//             </div>

//             <h1 className="text-primary-accent">Adresse du logement</h1>
//             <div className="grid grid-cols-9 gap-6 border-t pt-3">
//               <div className="col-span-12 sm:col-span-3">
//                 <label
//                   htmlFor="zone"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Commune
//                 </label>

//                 <div className="mt-1">
//                   <SimpleSelect
//                     required={'Champs requis'}
//                     name="zone"
//                     control={control}
//                     options={zones}
//                     placeholder="Selectionner la commune"
//                   />
//                 </div>
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.zone?.message}
//                 </p>
//               </div>
//               <div className="col-span-12 sm:col-span-3">
//                 <label
//                   htmlFor="quartier"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Quartier
//                 </label>

//                 <div className="col-span-6 sm:col-span-3">
//                   <div className="mt-1">
//                     <SimpleSelect
//                       required={'Champs requis'}
//                       name="section"
//                       control={control}
//                       options={towns[zone?.value]}
//                       placeholder="Selectionner le quartier"
//                     />
//                   </div>

//                   <p className="pt-1 font-stratos-light text-xs text-red-600">
//                     {errors?.section?.message}
//                   </p>
//                 </div>
//               </div>

//               <div className="col-span-12 sm:col-span-3"></div>
//               <div className="col-span-12 sm:col-span-3">
//                 <div className="py-2">
//                   <label
//                     htmlFor="long"
//                     className="block text-sm font-medium text-gray-700"
//                   >
//                     Longitude
//                   </label>
//                   <input
//                     disabled
//                     type="text"
//                     {...register('long')}
//                     id="long"
//                     placeholder="Coordonnée long"
//                     className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
//                   />
//                 </div>
//                 <div className="py-2">
//                   <label
//                     htmlFor="lat"
//                     className="block text-sm font-medium text-gray-700"
//                   >
//                     Latitude
//                   </label>
//                   <input
//                     disabled
//                     type="text"
//                     {...register('lat')}
//                     id="lat"
//                     placeholder="Coordonnée lat"
//                     className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
//                   />
//                 </div>
//               </div>
//               <div className="col-span-12 sm:col-span-6 ">
//                 <GoogleMaps
//                   lat={house?.address?.commune?.lat}
//                   lng={house?.address?.commune?.long}
//                   setLonLat={setLonLat}
//                 />
//               </div>
//             </div>

//             <h1 className="text-primary-accent">Selection Dimages</h1>

//             <div className="grid grid-cols-6 gap-24 border-t pt-3">
//               <div className="col-span-2 sm:col-span-2">
//                 <label
//                   htmlFor="rccm"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Image vitrine du logement
//                 </label>

//                 <div className="mt-1 sm:col-span-2 sm:mt-0">
//                   <div className="rounded-xs flex max-w-lg justify-center border-2 border-dashed border-gray-300 px-2 pt-5 pb-6">
//                     <div className="space-y-1 text-center">
//                       {files?.length > 0 ? (
//                         house?.imageUrl > 0 ? (
//                           <img
//                             src={URL.createObjectURL(files[0])}
//                             alt="preview"
//                           />
//                         ) : (
//                           <img
//                             src={
//                               files?.length == 1
//                                 ? URL.createObjectURL(files[0])
//                                 : house?.imageUrl
//                             }
//                             alt="preview"
//                           />
//                         )
//                       ) : house ? (
//                         <img src={house.imageUrl} alt="preview" />
//                       ) : (
//                         <RiImage2Fill className="mx-auto h-12 w-12 text-gray-400" />
//                       )}

//                       <div className="flex text-sm text-gray-600">
//                         <label
//                           htmlFor="file-upload"
//                           className="relative cursor-pointer rounded-sm bg-white font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 hover:text-primary-500"
//                         >
//                           <span>Charger image</span>
//                           <input
//                             id="file-upload"
//                             {...register('imageUrl', {
//                               required: files == 0 && !house?.imageUrl,
//                             })}
//                             type="file"
//                             className="sr-only"
//                           />
//                         </label>
//                       </div>
//                       <p className="text-xs text-gray-500">
//                         PNG, JPG, GIF up to 10MB
//                       </p>
//                     </div>
//                     <p className="pt-1 font-stratos-light text-xs text-red-600">
//                       {errors?.imageUrl && 'veuillez selectionnez une image'}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="col-span-6 w-full  sm:col-span-4">
//                 <label
//                   htmlFor="position"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Charger les images interieurs
//                 </label>
//                 <input
//                   // required
//                   type="file"
//                   name="images"
//                   onChange={onSelectFile}
//                   multiple
//                   accept="image/png,image/jpeg,image/webp"
//                 />
//                 <div className=" flex w-full gap-5">
//                   {images &&
//                     images.map((image, index) => {
//                       return (
//                         <div key={image + index} className="mt-5 ">
//                           <img
//                             src={image}
//                             alt=""
//                             className="h-48 w-96 object-fill"
//                           />
//                           {images.length > 0 ? (
//                             <button
//                               className="w-full p-5 text-center text-sm text-gray-400  "
//                               onClick={() =>
//                                 setImages(images.filter((e) => e !== image))
//                               }
//                             >
//                               suprimer limage
//                             </button>
//                           ) : (
//                             <RiImage2Fill className="mx-auto h-12 w-12 text-gray-400" />
//                           )}
//                         </div>
//                       )
//                     })}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </DrawerForm>
//     </>
//   )
// }

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
          font-size: 1.125rem;
          font-weight: 700;
          color: ${colors.primary};
          margin: 1.5rem 0 1rem 0;
          border-top: 2px solid ${colors.gray200};
          padding-top: 1rem;
        }

        .form-input {
          border: 2px solid ${colors.gray200};
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          transition: all 0.3s ease;
          background-color: ${colors.white};
          color: ${colors.gray900};
        }

        .form-input:focus {
          border-color: ${colors.primary};
          box-shadow: 0 0 0 3px ${colors.primaryVeryLight};
          outline: none;
        }

        .form-input::placeholder {
          color: ${colors.gray400};
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: ${colors.gray700};
          margin-bottom: 0.5rem;
        }

        .form-error {
          font-size: 0.75rem;
          color: ${colors.error};
          margin-top: 0.25rem;
          display: block;
        }

        .image-upload-area {
          border: 2px dashed ${colors.gray300};
          border-radius: 0.75rem;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
          background-color: ${colors.gray50};
        }

        .image-upload-area:hover {
          border-color: ${colors.primary};
          background-color: ${colors.primaryVeryLight};
        }

        .image-preview {
          position: relative;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .image-delete-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background-color: ${colors.error};
          color: white;
          border: none;
          padding: 0.5rem;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-delete-btn:hover {
          background-color: #991B1B;
          transform: scale(1.1);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 1.5rem;
        }

        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
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

              <div className="form-grid mt-4">
                {/* Type de Logement */}
                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Type de Logement</label>
                  <SimpleSelect
                    required={'Champs requis'}
                    name="houseType"
                    control={control}
                    options={houseType}
                    placeholder="Sélectionner le type"
                  />
                  {errors?.houseType && (
                    <span className="form-error">
                      {errors.houseType.message}
                    </span>
                  )}
                </div>

                {/* Type d'offre */}
                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Type d'Offre</label>
                  <SimpleSelect
                    required={'Champs requis'}
                    name="offerType"
                    control={control}
                    options={offerType}
                    placeholder="Sélectionner l'offre"
                  />
                  {errors?.offerType && (
                    <span className="form-error">
                      {errors.offerType.message}
                    </span>
                  )}
                </div>

                {/* Telephone */}
                <div className="col-span-6 sm:col-span-3">
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
                        required: 'Champs requis',
                        pattern:
                          /^(\+\d{3}\s?)?\(?\d{3}\)?[\s-]*\d{2}[\s-]*\d{2}[\s-]*\d{2}$/i,
                      })}
                      className="form-input w-full pl-12"
                      placeholder="Votre numéro"
                    />
                  </div>
                  {errors?.phoneNumber && (
                    <span className="form-error">
                      {errors.phoneNumber.type === 'pattern'
                        ? 'Numéro invalide'
                        : errors.phoneNumber.message}
                    </span>
                  )}
                </div>

                {/* Prix */}
                <div className="col-span-6 sm:col-span-3">
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

                {/* Avance */}
                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Mois d'Avance</label>
                  <input
                    type="number"
                    {...register('adVance', {
                      required: 'Champs requis',
                    })}
                    className="form-input w-full"
                    placeholder="Nombre de mois"
                  />
                  {errors?.adVance && (
                    <span className="form-error">{errors.adVance.message}</span>
                  )}
                </div>

                {/* Chambres */}
                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Nombre de Chambres</label>
                  <input
                    type="number"
                    {...register('bedrooms')}
                    className="form-input w-full"
                    placeholder="0"
                  />
                </div>

                {/* Surface + Area */}
                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Surface (m²)</label>
                  <input
                    type="text"
                    {...register('surface', {
                      required: 'Champs requis',
                    })}
                    className="form-input w-full"
                    placeholder="0"
                  />
                  {errors?.surface && (
                    <span className="form-error">{errors.surface.message}</span>
                  )}
                </div>

                {/* Area */}
                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Area (m²)</label>
                  <input
                    type="number"
                    {...register('area')}
                    className="form-input w-full"
                    placeholder="0"
                  />
                </div>

                {/* Commodités (multi) */}
                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Commodités</label>
                  <MultiSelect
                    name="commodites"
                    control={control}
                    options={commodites}
                    placeholder="Sélectionner"
                  />
                </div>

                {/* Furnishing + Town */}
                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Furnishing</label>
                  <SimpleSelect
                    name="furnishing"
                    control={control}
                    options={furnishingOptions}
                    placeholder="Sélectionner"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Town</label>
                  <SimpleSelect
                    name="town"
                    control={control}
                    options={townOptions}
                    placeholder="Sélectionner"
                  />
                </div>

                {/* Description */}
                <div className="col-span-6">
                  <label className="form-label">Description du Logement</label>
                  <textarea
                    {...register('description', {
                      required: 'Champs requis',
                    })}
                    className="form-input w-full"
                    placeholder="Décrivez votre logement..."
                    rows="3"
                  />
                  {errors?.description && (
                    <span className="form-error">
                      {errors.description.message}
                    </span>
                  )}
                </div>

                {/* Financial & Extras */}
                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Housing Deposit</label>
                  <input
                    type="number"
                    {...register('housingDeposit')}
                    className="form-input w-full"
                    placeholder="0"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Rental Deposit</label>
                  <input
                    type="number"
                    {...register('rentalDeposit')}
                    className="form-input w-full"
                    placeholder="0"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Rental Status</label>
                  <input
                    type="text"
                    {...register('rentalStatus')}
                    className="form-input w-full"
                    placeholder="Ex: Marié"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Reservation Details</label>
                  <input
                    type="text"
                    {...register('reservationDetails')}
                    className="form-input w-full"
                    placeholder="Détails de la réservation"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Is Furnished</label>
                  <Toggle
                    {...register('isFurnished')}
                    checked={watch('isFurnished')}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label className="form-label">Is Purchase Mode</label>
                  <Toggle
                    {...register('isPurchaseMode')}
                    checked={watch('isPurchaseMode')}
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
                    name="zone"
                    control={control}
                    options={zones}
                    placeholder="Sélectionner la commune"
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
                    name="section"
                    control={control}
                    options={towns[zone?.value]}
                    placeholder="Sélectionner le quartier"
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
