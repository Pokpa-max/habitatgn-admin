import { useAuthUser } from 'next-firebase-auth'
import React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiCheckLine, RiEyeLine, RiEyeOffLine, RiImageAddLine } from 'react-icons/ri'
import Loader from '../Loader'
import { createAccount } from '../../lib/services/managers'
import { notify } from '../../utils/toast'
import { uploadToCloudinary } from '../../utils/cloudinary'
import {
  quartier,
  userRole,
  zones,
  REGIONS,
  ALL_COMMUNES,
  AGENT_PROPERTY_TYPES,
  WORKER_SPECIALTIES,
  WORKER_PRICE_RANGES,
} from '../../_data'
import DrawerForm from '../DrawerForm'
import SimpleSelect from '../SimpleSelect'
import MultiSelect from '../MultiSelect'
import { useColors } from '../../contexts/ColorContext'

// Communes multi-select : la valeur stockée doit être le libellé affiché
// (ex: "Ratoma"), pas un slug, pour matcher exactement ce que le site public
// écrit dans `communes` (voir devenir-ouvrier/page.tsx).
const COMMUNE_MULTI_OPTIONS = ALL_COMMUNES.map((c) => ({ label: c.label, value: c.label }))

const AccountTypeToggle = ({ options, value, onChange, colors }) => (
  <div className="flex gap-3">
    {options.map((opt) => {
      const active = value === opt.value
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="flex-1 rounded-xl border-2 p-3 text-left transition-all"
          style={{
            borderColor: active ? colors.primary : colors.gray200,
            backgroundColor: active ? colors.primaryVeryLight : colors.white,
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: active ? colors.primary : colors.gray700 }}
          >
            {opt.label}
          </p>
          {opt.desc && (
            <p className="mt-0.5 text-xs" style={{ color: colors.gray400 }}>
              {opt.desc}
            </p>
          )}
        </button>
      )
    })}
  </div>
)

export default function CreateUserDrawer({ open, setOpen, defaultRole, ...props }) {
  const colors = useColors()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

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
      agentAccountType: 'particulier',
      workerAccountType: 'individual',
    },
    reValidateMode: 'onChange',
    shouldUnregister: true,
  })

  const role = watch('userRole')?.value
  const agentAccountType = watch('agentAccountType')
  const workerAccountType = watch('workerAccountType')
  const workerSpecialty = watch('workerSpecialty')

  React.useEffect(() => {
    if (open && defaultRole) {
      const foundOption = userRole.find((r) => r.value === defaultRole)
      if (foundOption) {
        setValue('userRole', foundOption)
      }
    }
  }, [open, defaultRole, setValue])

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const CreatedAccountSubmit = async (data) => {
    setLoading(true)
    try {
      let imageUrl = ''
      if (role === 'worker' && photoFile) {
        imageUrl = await uploadToCloudinary(photoFile)
      }

      const newUser = await createAccount({ ...data, imageUrl })
      notify('Compte créé avec succès', 'success')
      reset()
      setPhotoFile(null)
      setPhotoPreview(null)
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
        .form-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: ${colors.gray500 || '#6b7280'};
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin: 0;
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
        title={
          role === 'agent'
            ? 'Ajouter un Agent'
            : role === 'worker'
            ? 'Ajouter un Ouvrier'
            : 'Ajouter un Manager'
        }
        description="Création de compte"
        onSubmit={handleSubmit(CreatedAccountSubmit)}
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
                  Créer le compte
                </button>
              </>
            )}
          </>
        }
      >
        <div className="space-y-5 px-6 py-6 sm:p-8">
          {/* Rôle en premier : détermine les champs affichés en dessous */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Rôle
            </label>
            <SimpleSelect
              required="Champs requis"
              name="userRole"
              control={control}
              options={userRole}
              placeholder="Sélectionner le rôle"
            />
            {errors?.userRole && (
              <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.userRole.message}</p>
            )}
          </div>

          {/* Champs communs à tous les rôles */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Email
              </label>
              <input
                type="email"
                {...register('email', {
                  required: 'Champs requis',
                  pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="meloger@gmail.com"
              />
              {errors?.email && (
                <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>
                  {errors.email.type === 'pattern' ? 'Entrez un email valide' : errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Téléphone
              </label>
              <div className="relative">
                <span className="phone-prefix">+224</span>
                <input
                  type="tel"
                  {...register('phoneNumber', {
                    required: 'Champs requis',
                    pattern: /^(\+\d{3}\s?)?\(?\d{3}\)?[\s-]*\d{2}[\s-]*\d{2}[\s-]*\d{2}$/i,
                  })}
                  className="phone-input w-full rounded-2xl border-0 bg-gray-100 py-3 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="612345678"
                />
              </div>
              {errors?.phoneNumber && (
                <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>
                  {errors.phoneNumber.type === 'pattern' ? 'Entrez un numéro valide' : errors.phoneNumber.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('passWord', { required: 'Champs requis' })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <RiEyeOffLine className="h-5 w-5" /> : <RiEyeLine className="h-5 w-5" />}
              </button>
            </div>
            {errors?.passWord && (
              <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.passWord.message}</p>
            )}
          </div>

          {/* Manager / Admin : comptes internes, pas d'équivalent sur le site public */}
          {(role === 'manager' || role === 'admin' || !role) && (
            <div className="border-t border-gray-100 pt-5">
              <p className="form-section-title mb-3">Informations {role === 'admin' ? 'administrateur' : 'manager'}</p>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Nom de l'agence
                </label>
                <input
                  type="text"
                  {...register('agence')}
                  className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nom de l'agence"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    Nom
                  </label>
                  <input
                    type="text"
                    {...register('firstname', { required: role !== 'agent' && role !== 'worker' ? 'Champs requis' : false })}
                    className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Votre nom"
                  />
                  {errors?.firstname && (
                    <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.firstname.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    Prénom
                  </label>
                  <input
                    type="text"
                    {...register('lastname', { required: role !== 'agent' && role !== 'worker' ? 'Champs requis' : false })}
                    className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Votre prénom"
                  />
                  {errors?.lastname && (
                    <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.lastname.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    Commune
                  </label>
                  <SimpleSelect name="zone" control={control} options={zones} placeholder="Sélectionner la commune" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    Quartier
                  </label>
                  <SimpleSelect name="quartier" control={control} options={quartier} placeholder="Sélectionner le quartier" />
                </div>
              </div>
            </div>
          )}

          {/* Agent immobilier : mêmes champs que /devenir-agent */}
          {role === 'agent' && (
            <div className="border-t border-gray-100 pt-5">
              <p className="form-section-title mb-3">Informations agent</p>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Type de compte
                </label>
                <AccountTypeToggle
                  colors={colors}
                  value={agentAccountType}
                  onChange={(v) => setValue('agentAccountType', v)}
                  options={[
                    { value: 'particulier', label: 'Particulier', desc: 'Agent indépendant' },
                    { value: 'agence', label: 'Agence', desc: "Pour le compte d'une agence" },
                  ]}
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Nom complet
                </label>
                <input
                  type="text"
                  {...register('fullName', { required: 'Champs requis' })}
                  className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nom et prénom de l'agent"
                />
                {errors?.fullName && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.fullName.message}</p>
                )}
              </div>

              {agentAccountType === 'agence' && (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    Nom de l'agence
                  </label>
                  <input
                    type="text"
                    {...register('agencyName', { required: agentAccountType === 'agence' ? 'Champs requis' : false })}
                    className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nom de l'agence"
                  />
                  {errors?.agencyName && (
                    <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.agencyName.message}</p>
                  )}
                </div>
              )}

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Commune
                </label>
                <select
                  {...register('agentCommune', { required: 'Champs requis' })}
                  className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Sélectionner une commune
                  </option>
                  {REGIONS.map((region) => (
                    <optgroup key={region.name} label={region.name}>
                      {region.communes.map((c) => (
                        <option key={c.value} value={c.label}>
                          {c.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {errors?.agentCommune && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.agentCommune.message}</p>
                )}
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Types de biens
                </label>
                <MultiSelect
                  name="propertyTypes"
                  control={control}
                  options={AGENT_PROPERTY_TYPES}
                  placeholder="Sélectionner les types de biens"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Message (optionnel)
                </label>
                <textarea
                  rows={3}
                  {...register('message')}
                  className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Motivation, expérience..."
                />
              </div>
            </div>
          )}

          {/* Ouvrier / Artisan : mêmes champs que /devenir-ouvrier */}
          {role === 'worker' && (
            <div className="border-t border-gray-100 pt-5">
              <p className="form-section-title mb-3">Informations ouvrier</p>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Photo (optionnel)
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-50">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Photo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <RiImageAddLine className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="worker-photo-upload"
                    className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Choisir une photo
                    <input
                      id="worker-photo-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Type de compte
                </label>
                <AccountTypeToggle
                  colors={colors}
                  value={workerAccountType}
                  onChange={(v) => setValue('workerAccountType', v)}
                  options={[
                    { value: 'individual', label: 'Particulier', desc: '1 spécialité' },
                    { value: 'enterprise', label: 'Entreprise', desc: 'Plusieurs spécialités' },
                  ]}
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Nom complet
                </label>
                <input
                  type="text"
                  {...register('fullName', { required: 'Champs requis' })}
                  className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nom et prénom de l'ouvrier"
                />
                {errors?.fullName && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.fullName.message}</p>
                )}
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  WhatsApp (optionnel)
                </label>
                <input
                  type="tel"
                  {...register('whatsapp')}
                  className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+224 6XX XXX XXX"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  {workerAccountType === 'enterprise' ? 'Spécialités' : 'Spécialité'}
                </label>
                {workerAccountType === 'enterprise' ? (
                  <MultiSelect
                    name="specialties"
                    control={control}
                    options={WORKER_SPECIALTIES}
                    placeholder="Sélectionner les spécialités"
                  />
                ) : (
                  <select
                    {...register('workerSpecialty', { required: 'Champs requis' })}
                    className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Choisir une spécialité
                    </option>
                    {WORKER_SPECIALTIES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
                {errors?.workerSpecialty && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.workerSpecialty.message}</p>
                )}
              </div>

              {(workerAccountType === 'enterprise' ? watch('specialties')?.includes('autre') : workerSpecialty === 'autre') && (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    Préciser la spécialité
                  </label>
                  <input
                    type="text"
                    {...register('otherSpecialty', { required: 'Champs requis' })}
                    className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ex: Vitrerie"
                  />
                </div>
              )}

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Communes d'intervention
                </label>
                <MultiSelect
                  name="communes"
                  control={control}
                  options={COMMUNE_MULTI_OPTIONS}
                  placeholder="Sélectionner les communes"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    Années d'expérience (optionnel)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    {...register('experienceYears')}
                    className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ex: 5"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    Tarif indicatif (optionnel)
                  </label>
                  <select
                    {...register('priceRange')}
                    className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    defaultValue=""
                  >
                    <option value="">Non précisé</option>
                    {WORKER_PRICE_RANGES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-gray-900">
                  Description
                </label>
                <textarea
                  rows={3}
                  {...register('description', {
                    required: 'Champs requis (20 caractères minimum)',
                    minLength: { value: 20, message: 'Minimum 20 caractères' },
                  })}
                  className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Présentation, expérience, savoir-faire..."
                />
                {errors?.description && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.description.message}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DrawerForm>
    </>
  )
}
