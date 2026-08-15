
// export default AdvertisingFormDrawer
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiImage2Fill, RiCloseLine, RiCheckLine } from 'react-icons/ri'
import { notify } from '../../utils/toast'
import DrawerForm from '../DrawerForm'
import Loader from '../Loader'
import { useColors } from '../../contexts/ColorContext'
import { autoFillAdvertisingForm } from '../../utils/functionFactory'
import { addAdvertising, editCommercial } from '../../lib/services/advertising'

function AdvertisingFormDrawer({ commercial, open, setOpen }) {
  const [loading, setLoading] = useState(false)
  const colors = useColors()
  const [previewUrl, setPreviewUrl] = useState(null)

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
  const imageUrl = watch('imageUrl')

  useEffect(() => {
    if (!open) {
      setPreviewUrl(null)
      reset()
      return
    }
    if (commercial) {
      setPreviewUrl(commercial?.imageUrl || null)
    }
    autoFillAdvertisingForm(reset, setValue, commercial)
  }, [commercial, open])

  useEffect(() => {
    let objectUrl = null
    if (!imageUrl) {
      setPreviewUrl(commercial?.imageUrl || null)
      return
    }
    if (typeof imageUrl === 'string') {
      setPreviewUrl(imageUrl)
      return
    }
    const first = imageUrl?.[0]
    if (!first) {
      setPreviewUrl(commercial?.imageUrl || null)
      return
    }
    if (typeof first === 'string') {
      setPreviewUrl(first)
      return
    }
    objectUrl = URL.createObjectURL(first)
    setPreviewUrl(objectUrl)
    return () => objectUrl && URL.revokeObjectURL(objectUrl)
  }, [imageUrl, commercial?.imageUrl])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      if (commercial)
        await editCommercial(
          commercial.id,
          data,
          imageUrl?.length > 0,
          commercial.imageUrl,
          commercial.imageUrl1000
        )
      else {
        await addAdvertising(data)
      }

      setOpen(false)
      notify('Votre requête s\'est exécutée avec succès', 'success')
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
          font-size: 0.75rem;
          font-weight: 700;
          color: ${colors.gray500 || '#6b7280'};
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin: 0;
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
          border-color: ${colors.primary || '#0A4D9C'};
          background-color: ${colors.primaryVeryLight || '#F2F6FC'};
        }

        .image-preview {
          position: relative;
          border-radius: 0.375rem;
          overflow: hidden;
          aspect-ratio: 16/9;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
      `}</style>

      <DrawerForm
        open={open}
        setOpen={setOpen}
        onSubmit={handleSubmit(onSubmit)}
        title={commercial ? 'Modifier la publicité' : 'Ajouter une publicité'}
        description={
          commercial
            ? 'Mettez à jour les informations'
            : 'Remplissez le formulaire'
        }
        footerButtons={
          <>
            {loading ? (
              <div
                className="inline-flex justify-center rounded px-6 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: colors.primary || '#0A4D9C' }}
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
                  style={{ backgroundColor: colors.primary || '#0A4D9C' }}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Titre
              </label>
              <input
                type="text"
                {...register('title', {
                  required: 'Champs requis',
                })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Titre de la publicité"
              />
              {errors?.title && (
                <p className="mt-1 text-xs font-semibold text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Slogan
              </label>
              <input
                type="text"
                {...register('slogan', {
                  required: 'Champs requis',
                })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Petit slogan"
              />
              {errors?.slogan && (
                <p className="mt-1 text-xs font-semibold text-red-500">{errors.slogan.message}</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="form-section-title mb-3">Image publicitaire</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Image
                </label>
                <div className="image-upload-area">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="mx-auto h-20 w-20 rounded object-cover"
                    />
                  ) : (
                    <RiImage2Fill className="mx-auto h-8 w-8 text-gray-300" />
                  )}
                  <div className="mt-2 flex justify-center">
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer rounded px-3 py-1 text-xs font-semibold transition-all"
                      style={{
                        color: colors.primary || '#0A4D9C',
                        backgroundColor: colors.primaryVeryLight || '#F2F6FC',
                      }}
                    >
                      Charger
                      <input
                        id="file-upload"
                        {...register('imageUrl', {
                          required:
                            imageUrl?.length === 0 && !commercial?.imageUrl,
                        })}
                        type="file"
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF</p>
                </div>
                {errors?.imageUrl && (
                  <p className="mt-1 text-xs font-semibold text-red-500">
                    Veuillez sélectionner une image
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Aperçu
                </label>
                <div className="image-preview">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-100">
                      <RiImage2Fill className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
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