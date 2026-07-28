import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import {
  RiArrowLeftLine,
  RiEditLine,
  RiDeleteBinLine,
  RiMailLine,
  RiPhoneLine,
  RiHome4Line,
  RiFileTextLine,
  RiWallet3Line,
  RiMoneyDollarCircleLine,
  RiPieChartLine,
  RiToolsLine,
  RiBillLine,
} from 'react-icons/ri'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import DrawerForm from '@/components/DrawerForm'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import { formatGNF } from '@/utils/format'
import Loader from '@/components/Loader'
import BiensTab from '@/components/rentalManagement/BiensTab'
import BauxTab from '@/components/rentalManagement/BauxTab'
import PaiementsTab from '@/components/rentalManagement/PaiementsTab'
import ProprietaireTab from '@/components/rentalManagement/ProprietaireTab'
import OccupationTab from '@/components/rentalManagement/OccupationTab'
import EntretienTab from '@/components/rentalManagement/EntretienTab'
import DepensesTab from '@/components/rentalManagement/DepensesTab'
import { getPropertyOwnerById, editPropertyOwner, deletePropertyOwner } from '@/lib/services/propertyOwners'
import { getPropertiesByOwner } from '@/lib/services/managedProperties'

const TABS = [
  { value: 'biens', label: 'Biens', icon: RiHome4Line },
  { value: 'baux', label: 'Locataires & baux', icon: RiFileTextLine },
  { value: 'paiements', label: 'Paiements', icon: RiWallet3Line },
  { value: 'proprietaire', label: 'Transactions du mois', icon: RiMoneyDollarCircleLine },
  { value: 'occupation', label: 'Occupation', icon: RiPieChartLine },
  { value: 'entretien', label: 'Entretien', icon: RiToolsLine },
  { value: 'depenses', label: 'Dépenses', icon: RiBillLine },
]

function StatCard({ label, value, color, bgColor }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4 shadow-sm" style={{ backgroundColor: bgColor || '#F9FAFB' }}>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

function OwnerDetail() {
  const colors = useColors()
  const router = useRouter()
  const { ownerId } = router.query

  const [owner, setOwner] = useState(null)
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('biens')
  const [showDeleteLink, setShowDeleteLink] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  useEffect(() => {
    if (!ownerId) return
    const load = async () => {
      setIsLoading(true)
      try {
        const [ownerData, propertiesData] = await Promise.all([
          getPropertyOwnerById(ownerId),
          getPropertiesByOwner(ownerId),
        ])
        setOwner(ownerData)
        setProperties(propertiesData)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [ownerId])

  const openEditOwner = () => {
    reset({ name: owner.name, phone: owner.phone, email: owner.email || '', notes: owner.notes || '' })
    setEditOpen(true)
  }

  const onSubmitOwner = async (data) => {
    setSaving(true)
    try {
      const payload = { name: data.name, phone: data.phone, email: data.email, notes: data.notes }
      await editPropertyOwner(owner.id, payload)
      setOwner((prev) => ({ ...prev, ...payload }))
      notify('Propriétaire modifié avec succès', 'success')
      setEditOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  const handleDeleteOwner = async () => {
    if (properties.length > 0) {
      notify('Ce propriétaire a encore des biens rattachés — supprimez-les ou réassignez-les avant', 'error')
      setDeleteConfirm(false)
      return
    }
    try {
      await deletePropertyOwner(owner.id)
      notify('Propriétaire supprimé avec succès', 'success')
      router.push('/gestion-locative')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const totalRent = properties.reduce((sum, p) => sum + (p.rentAmount || 0), 0)
  const occupiedCount = properties.filter((p) => p.status === 'occupied').length

  return (
    <Scaffold>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push('/gestion-locative')}
          className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <RiArrowLeftLine className="mr-1.5 h-4 w-4" />
          Retour aux propriétaires
        </button>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : !owner ? (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
            Propriétaire introuvable
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{owner.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <RiPhoneLine className="h-4 w-4" />
                      {owner.phone}
                    </span>
                    {owner.email && (
                      <span className="flex items-center gap-1.5">
                        <RiMailLine className="h-4 w-4" />
                        {owner.email}
                      </span>
                    )}
                  </div>
                  {owner.notes && <p className="mt-2 text-sm text-gray-600">{owner.notes}</p>}
                </div>
                <button
                  onClick={openEditOwner}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <RiEditLine className="h-4 w-4" />
                  Modifier
                </button>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <StatCard label="Biens gérés" value={properties.length} color={colors.primary} bgColor={colors.primaryVeryLight} />
                <StatCard label="Occupés" value={occupiedCount} color="#065F46" bgColor="#ECFDF5" />
                <StatCard label="Loyers cumulés / mois" value={formatGNF(totalRent)} color="#92400E" bgColor="#FFFBEB" />
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                {deleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Confirmer la suppression ?</span>
                    <button
                      onClick={handleDeleteOwner}
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                    >
                      Oui, supprimer
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Non
                    </button>
                  </div>
                ) : showDeleteLink ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500"
                  >
                    <RiDeleteBinLine className="h-3.5 w-3.5" />
                    Supprimer ce propriétaire
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDeleteLink(true)}
                    className="text-xs font-medium text-gray-300 hover:text-gray-500"
                  >
                    Options avancées
                  </button>
                )}
              </div>
            </div>

            <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
              {TABS.map((tab) => {
                const active = activeTab === tab.value
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className="flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
                    style={
                      active
                        ? { borderColor: colors.primary, color: colors.primary }
                        : { borderColor: 'transparent', color: colors.gray500 }
                    }
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {activeTab === 'biens' && <BiensTab ownerId={owner.id} onPropertiesChange={setProperties} />}
            {activeTab === 'baux' && <BauxTab ownerId={owner.id} />}
            {activeTab === 'paiements' && <PaiementsTab ownerId={owner.id} />}
            {activeTab === 'proprietaire' && <ProprietaireTab ownerId={owner.id} ownerName={owner.name} />}
            {activeTab === 'occupation' && <OccupationTab ownerId={owner.id} />}
            {activeTab === 'entretien' && <EntretienTab ownerId={owner.id} />}
            {activeTab === 'depenses' && <DepensesTab ownerId={owner.id} />}
          </>
        )}

        {owner && (
          <DrawerForm
            open={editOpen}
            setOpen={setEditOpen}
            onSubmit={handleSubmit(onSubmitOwner)}
            title="Modifier le propriétaire"
            description="Mettez à jour ses informations"
            footerButtons={
              <>
                {saving ? (
                  <div
                    className="inline-flex justify-center rounded px-6 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Loader />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="rounded border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      onClick={() => setEditOpen(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="ml-3 inline-flex items-center gap-2 rounded px-6 py-2 text-sm font-semibold text-white hover:shadow-md"
                      style={{ backgroundColor: colors.primary }}
                    >
                      Enregistrer
                    </button>
                  </>
                )}
              </>
            }
          >
            <div className="space-y-5 px-6 py-6 sm:p-8">
              <div>
                <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Nom *
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Requis' })}
                  className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                />
                {errors.name && <p className="mt-1 text-xs font-semibold text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Téléphone *
                </label>
                <input
                  type="text"
                  {...register('phone', { required: 'Requis' })}
                  className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                />
                {errors.phone && <p className="mt-1 text-xs font-semibold text-red-500">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Notes
                </label>
                <textarea
                  rows={2}
                  {...register('notes')}
                  className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                />
              </div>
            </div>
          </DrawerForm>
        )}
      </div>
    </Scaffold>
  )
}

const OwnerDetailPage = () => (
  <Page name="Propriétaire | BâtiServices Admin">
    <OwnerDetail />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (AuthUser.claims.userType !== 'admin') {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(OwnerDetailPage)
