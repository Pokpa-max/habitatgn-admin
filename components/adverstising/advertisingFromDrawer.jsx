
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

        .section-icon.advertising {
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

        .form-input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          padding: 0.6rem 0.85rem;
          font-size: 0.875rem;
          color: #111827;
          background-color: #fff;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          border-color: ${colors.primary || '#3b82f6'};
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
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
          {/* SECTION: Informations Publicitaires */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="section-icon advertising">📢</div>
              <h3 className="form-section-title">Informations Publicitaires</h3>
            </div>

            <div className="form-row">
              <div className="form-group col-3">
                <label className="form-label">Titre</label>
                <input
                  type="text"
                  {...register('title', {
                    required: 'Champs requis',
                  })}
                  className="form-input"
                  placeholder="Titre de la publicité"
                />
                {errors?.title && (
                  <span className="form-error">{errors.title.message}</span>
                )}
              </div>

              <div className="form-group col-3">
                <label className="form-label">Slogan</label>
                <input
                  type="text"
                  {...register('slogan', {
                    required: 'Champs requis',
                  })}
                  className="form-input"
                  placeholder="Petit slogan"
                />
                {errors?.slogan && (
                  <span className="form-error">{errors.slogan.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION: Image Publicitaire */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="section-icon advertising">🖼️</div>
              <h3 className="form-section-title">Image Publicitaire</h3>
            </div>

            <div className="form-row">
              <div className="form-group col-3">
                <label className="form-label">Image</label>
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
                  <span className="form-error">Veuillez sélectionner une image</span>
                )}
              </div>

              <div className="form-group col-3">
                <label className="form-label">Aperçu</label>
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