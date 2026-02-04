// import { useAuthUser } from 'next-firebase-auth'
// import React from 'react'
// import { useState } from 'react'
// import { useForm } from 'react-hook-form'
// import Loader from 'react-spinners/BeatLoader'
// import { createAccount } from '../../lib/services/managers'
// import { notify } from '../../utils/toast'
// import { quartier, userRole, zones } from '../../_data'
// import DrawerForm from '../DrawerForm'
// import SimpleSelect from '../SimpleSelect'
// import { useColors } from '../../contexts/ColorContext'
// export default function CreateUserDrawer({ open, setOpen }) {
//   const colors = useColors()
//   const [loading, setLoading] = useState(false)

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
//       desabled: false,
//     },
//     reValidateMode: 'onChange',
//     shouldUnregister: false,
//   })

//   const CreatedAccountSubmit = async (data) => {
//     setLoading(true)
//     try {
//       await createAccount(data)
//       notify('compte creer avec succès', 'success')
//       reset()
//     } catch (error) {
//       notify('ce compte existe déja', 'error')
//     }
//     // setOpen(false)
//   }
//   return (
//     <>
//       <DrawerForm
//         open={open}
//         setOpen={setOpen}
//         title={'Ajouter un Manager'}
//         description={'Creation de compte manager'}
//         onSubmit={handleSubmit(CreatedAccountSubmit)}
//         loading={loading}
//         footerButtons={
//           <>
//             <>
//               <button
//                 type="button"
//                 className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
//                 onClick={() => setOpen(false)}
//               >
//                 Annuler
//               </button>
//               <button
//                 style={{
//                   backgroundColor: colors.primary,
//                 }}
//                 type="submit"
//                 className="ml-4 inline-flex justify-center border border-transparent bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
//               >
//                 Creer le compte
//               </button>
//             </>
//           </>
//         }
//       >
//         <div className="mt-5 md:col-span-2 md:mt-0">
//           <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
//             <div className="grid grid-cols-3 gap-6">
//               <div className="group col-span-3 sm:col-span-2">
//                 <label
//                   htmlFor="storename"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Nom de l'agence
//                 </label>
//                 <div className="mt-1 flex">
//                   <input
//                     type="text"
//                     {...register('agence', {
//                       required: 'Champs requis',
//                     })}
//                     id="agence"
//                     className="block w-full flex-1 border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
//                     placeholder="Nom du manager"
//                   />
//                   <p className="pt-1 font-stratos-light text-xs text-red-600">
//                     {errors?.agence?.message}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <h1 className="text-cyan-500">Manager</h1>

//             <div className="grid grid-cols-6 gap-6 border-t pt-3">
//               <div className="col-span-6 sm:col-span-3">
//                 <label
//                   htmlFor="firstname"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Nom
//                 </label>
//                 <input
//                   type="text"
//                   {...register('firstname', {
//                     required: 'Champs requis',
//                   })}
//                   id="firstname"
//                   autoComplete="given-name"
//                   placeholder="votre nom"
//                   className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
//                 />
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.firstname?.message}
//                 </p>
//               </div>

//               <div className="col-span-6 sm:col-span-3">
//                 <label
//                   htmlFor="lastname"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Prenom
//                 </label>
//                 <input
//                   type="text"
//                   {...register('lastname', {
//                     required: 'Champs requis',
//                   })}
//                   id="lastname"
//                   autoComplete="family-name"
//                   placeholder="votre prenom"
//                   className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
//                 />
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.lastname?.message}
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
//                   htmlFor="email"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Email
//                 </label>
//                 <input
//                   type="email"
//                   {...register('email', {
//                     required: 'Champs requis',
//                     pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
//                   })}
//                   id="email"
//                   placeholder="meloger@gmail.com"
//                   className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
//                 />
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.email?.type === 'pattern'
//                     ? 'Entrez un email valide'
//                     : errors?.email?.message}
//                 </p>
//               </div>

//               <div className="col-span-12 sm:col-span-3">
//                 <label
//                   htmlFor="zone"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Rôle
//                 </label>

//                 <div className="mt-1">
//                   <SimpleSelect
//                     required={'Champs requis'}
//                     name="userRole"
//                     control={control}
//                     options={userRole}
//                     placeholder="Selectionner la commune"
//                   />
//                 </div>
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.userRole?.message}
//                 </p>
//               </div>

//               <div className="col-span-6 sm:col-span-3">
//                 <label
//                   htmlFor="lastname"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Mot de passe
//                 </label>
//                 <input
//                   type="text"
//                   {...register('passWord', {
//                     required: 'Champs requis',
//                   })}
//                   id="passWord"
//                   autoComplete="passWord"
//                   placeholder="le mot de passe "
//                   className="mt-1 block w-full border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
//                 />
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.passWord?.message}
//                 </p>
//               </div>
//             </div>

//             <h1 className="text-cyan-500">Adresse</h1>
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

//                 <div className="mt-1">
//                   <SimpleSelect
//                     required={'Champs requis'}
//                     name="quartier"
//                     control={control}
//                     options={quartier}
//                     placeholder="Selectionner le quartier"
//                   />
//                 </div>
//                 <p className="pt-1 font-stratos-light text-xs text-red-600">
//                   {errors?.quartier?.message}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </DrawerForm>
//     </>
//   )
// }
import { useAuthUser } from 'next-firebase-auth'
import React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiCheckLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri'
import Loader from '../Loader'
import { createAccount } from '../../lib/services/managers'
import { notify } from '../../utils/toast'
import { quartier, userRole, zones } from '../../_data'
import DrawerForm from '../DrawerForm'
import SimpleSelect from '../SimpleSelect'
import { useColors } from '../../contexts/ColorContext'

export default function CreateUserDrawer({ open, setOpen, ...props }) {
  const colors = useColors()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
      desabled: false,
    },
    reValidateMode: 'onChange',
    shouldUnregister: false,
  })

  const CreatedAccountSubmit = async (data) => {
    setLoading(true)
    try {
      const newUser = await createAccount(data)
      notify('Compte créé avec succès', 'success')
      reset()
      setOpen(false)
      if (props.onCreate) {
        props.onCreate(newUser)
      }
    } catch (error) {
      notify('Ce compte existe déjà ou une erreur est survenue', 'error')
      console.error(error)
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

        .section-icon.agency {
          background-color: rgba(59, 130, 246, 0.15);
          color: ${colors.primary || '#3b82f6'};
        }

        .section-icon.manager {
          background-color: rgba(168, 85, 247, 0.15);
          color: #a855f7;
        }

        .section-icon.address {
          background-color: rgba(16, 185, 129, 0.15);
          color: #10b981;
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

        .phone-prefix {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: ${colors.gray500 || '#6b7280'};
          font-size: 0.875rem;
          font-weight: 600;
        }

        .phone-input {
          padding-left: 3.5rem;
        }
      `}</style>

      <DrawerForm
        open={open}
        setOpen={setOpen}
        title="Ajouter un Manager"
        description="Création de compte manager"
        onSubmit={handleSubmit(CreatedAccountSubmit)}
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
                  Créer le compte
                </button>
              </>
            )}
          </>
        }
      >
        <div className="space-y-5 px-6 py-6 sm:p-8">
          {/* SECTION 1: Agence */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="section-icon agency">🏢</div>
              <h3 className="form-section-title">Informations Agence</h3>
            </div>

            <div className="form-row">
              <div className="form-group col-3">
                <label className="form-label">Nom de l'Agence</label>
                <input
                  type="text"
                  {...register('agence', {
                    required: 'Champs requis',
                  })}
                  className="form-input"
                  placeholder="Nom du manager"
                />
                {errors?.agence && (
                  <span className="form-error">{errors.agence.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: Manager */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="section-icon manager">👤</div>
              <h3 className="form-section-title">Informations Manager</h3>
            </div>

            <div className="form-row">
              <div className="form-group col-2">
                <label className="form-label">Nom</label>
                <input
                  type="text"
                  {...register('firstname', {
                    required: 'Champs requis',
                  })}
                  className="form-input"
                  placeholder="Votre nom"
                />
                {errors?.firstname && (
                  <span className="form-error">{errors.firstname.message}</span>
                )}
              </div>

              <div className="form-group col-2">
                <label className="form-label">Prénom</label>
                <input
                  type="text"
                  {...register('lastname', {
                    required: 'Champs requis',
                  })}
                  className="form-input"
                  placeholder="Votre prénom"
                />
                {errors?.lastname && (
                  <span className="form-error">{errors.lastname.message}</span>
                )}
              </div>

              <div className="form-group col-2">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Champs requis',
                    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                  })}
                  className="form-input"
                  placeholder="meloger@gmail.com"
                />
                {errors?.email && (
                  <span className="form-error">
                    {errors.email.type === 'pattern'
                      ? 'Entrez un email valide'
                      : errors.email.message}
                  </span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col-2">
                <label className="form-label">Téléphone</label>
                <div className="relative">
                  <span className="phone-prefix">+224</span>
                  <input
                    type="tel"
                    {...register('phoneNumber', {
                      required: 'Champs requis',
                      pattern:
                        /^(\+\d{3}\s?)?\(?\d{3}\)?[\s-]*\d{2}[\s-]*\d{2}[\s-]*\d{2}$/i,
                    })}
                    className="form-input phone-input"
                    placeholder="612345678"
                  />
                </div>
                {errors?.phoneNumber && (
                  <span className="form-error">
                    {errors.phoneNumber.type === 'pattern'
                      ? 'Entrez un numéro valide'
                      : errors.phoneNumber.message}
                  </span>
                )}
              </div>

              <div className="form-group col-2">
                <label className="form-label">Mot de Passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('passWord', {
                      required: 'Champs requis',
                    })}
                    className="form-input pr-10"
                    placeholder="Mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <RiEyeOffLine className="h-5 w-5" />
                    ) : (
                      <RiEyeLine className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors?.passWord && (
                  <span className="form-error">{errors.passWord.message}</span>
                )}
              </div>

              <div className="form-group col-2">
                <label className="form-label">Rôle</label>
                <SimpleSelect
                  required="Champs requis"
                  name="userRole"
                  control={control}
                  options={userRole}
                  placeholder="Sélectionner le rôle"
                />
                {errors?.userRole && (
                  <span className="form-error">{errors.userRole.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: Adresse */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="section-icon address">📍</div>
              <h3 className="form-section-title">Adresse</h3>
            </div>

            <div className="form-row">
              <div className="form-group col-3">
                <label className="form-label">Commune</label>
                <SimpleSelect
                  required="Champs requis"
                  name="zone"
                  control={control}
                  options={zones}
                  placeholder="Sélectionner la commune"
                />
                {errors?.zone && (
                  <span className="form-error">{errors.zone.message}</span>
                )}
              </div>

              <div className="form-group col-3">
                <label className="form-label">Quartier</label>
                <SimpleSelect
                  required="Champs requis"
                  name="quartier"
                  control={control}
                  options={quartier}
                  placeholder="Sélectionner le quartier"
                />
                {errors?.quartier && (
                  <span className="form-error">{errors.quartier.message}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </DrawerForm>
    </>
  )
}