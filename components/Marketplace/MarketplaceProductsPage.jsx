import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuthUser } from 'next-firebase-auth'
import { Timestamp } from 'firebase/firestore'
import {
  RiAddLine,
  RiSearchLine,
  RiEditLine,
  RiDeleteBinLine,
  RiShoppingBag3Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiImageAddLine,
  RiCloseLine,
  RiRocketLine,
  RiMore2Fill,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import StatusPill from '@/components/ui/StatusPill'
import DrawerForm from '@/components/DrawerForm'
import ConfirmModal from '@/components/ConfirmModal'
import PaginationButton from '@/components/Orders/PaginationButton'
import { formatGNF } from '@/utils/format'
import {
  getProducts,
  addProduct,
  updateProduct,
  toggleProductActive,
  setProductBoost,
  deleteProduct,
} from '@/lib/services/products'
import { uploadToCloudinary } from '@/utils/cloudinary'
import { CONAKRY_COMMUNES } from '../../_data'
import { useCanManage } from '@/hooks/useCanManage'

const PAGE_SIZE = 10

export const PRODUCT_CATEGORIES = [
  { value: 'furniture', label: 'Meubles' },
  { value: 'electronics', label: 'Électronique' },
  { value: 'appliances', label: 'Électroménager' },
  { value: 'decoration', label: 'Décoration' },
  { value: 'materials', label: 'Matériaux de construction' },
  { value: 'tools', label: 'Outillage' },
  { value: 'autre', label: 'Autre' },
]

export default function MarketplaceProductsPage() {
  const colors = useColors()
  const AuthUser = useAuthUser()
  const canProcess = useCanManage('marketplace', 'process')
  const canDelete = useCanManage('marketplace', 'delete')
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Drawer / Form state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [saving, setSaving] = useState(false)
  const [imageFiles, setImageFiles] = useState([])
  const [existingImageUrls, setExistingImageUrls] = useState([])

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Sélection multiple / actions groupées
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkActing, setBulkActing] = useState(false)
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)

  // Menu d'actions groupées (par ligne)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuOpenId) return
      const target = event.target
      if (target instanceof HTMLElement && !target.closest('[data-menu-root]')) {
        setMenuOpenId(null)
        setMenuAnchor(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [searchTerm, categoryFilter, statusFilter])

  const openMenu = (event, productId) => {
    event.stopPropagation()
    if (menuOpenId === productId) {
      setMenuOpenId(null)
      setMenuAnchor(null)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const left = Math.max(16, Math.min(rect.right - 224, window.innerWidth - 240 - 16))
    const top = Math.min(rect.bottom + 8, window.innerHeight - 260 - 16)
    setMenuOpenId(productId)
    setMenuAnchor({ left, top })
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (e) {
      notify('Erreur lors du chargement des produits', 'error')
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleOpenAdd = () => {
    setEditingProduct(null)
    setImageFiles([])
    setExistingImageUrls([])
    reset({
      title: '',
      category: 'furniture',
      commune: '',
      price: '',
      phone: '',
      description: '',
      active: true,
    })
    setDrawerOpen(true)
  }

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod)
    setImageFiles([])
    setExistingImageUrls(prod.imageUrls || [])
    reset({
      title: prod.title || '',
      category: prod.category || 'furniture',
      commune: prod.commune || '',
      price: prod.price || '',
      phone: prod.phone || '',
      description: prod.description || '',
      active: prod.active !== false,
    })
    setDrawerOpen(true)
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length) {
      setImageFiles((prev) => [...prev, ...files])
    }
    e.target.value = ''
  }

  const removeNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    if (!canProcess) return
    setSaving(true)
    try {
      const uploadedUrls = await Promise.all(
        imageFiles.map((file) => uploadToCloudinary(file))
      )
      const imageUrls = [...existingImageUrls, ...uploadedUrls]

      const payload = {
        title: data.title,
        category: data.category,
        commune: data.commune || '',
        price: Number(data.price || 0),
        phone: data.phone || '',
        description: data.description || '',
        imageUrls,
        active: Boolean(data.active),
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload)
        notify('Produit mis à jour avec succès', 'success')
      } else {
        await addProduct({ ...payload, userId: AuthUser?.id || '' })
        notify('Produit ajouté à la Marketplace avec succès', 'success')
      }

      setDrawerOpen(false)
      loadProducts()
    } catch (e) {
      console.error(e)
      notify('Une erreur est survenue lors de l’enregistrement', 'error')
    }

    setSaving(false)
  }

  const handleToggleStatus = async (prod) => {
    if (!canProcess) return
    const nextStatus = !prod.active
    try {
      await toggleProductActive(prod.id, nextStatus)
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, active: nextStatus } : p))
      )
      notify(
        `Statut du produit ${nextStatus ? 'activé' : 'désactivé'}`,
        'success'
      )
    } catch (e) {
      notify('Erreur lors du changement de statut', 'error')
    }
  }

  const isProductBoosted = (prod) => {
    const until = prod?.boostedUntil
    if (!until) return false
    const untilDate = typeof until?.toDate === 'function' ? until.toDate() : new Date(until)
    return untilDate.getTime() > Date.now()
  }

  const handleSetProductBoost = async (prod, days) => {
    if (!canProcess) return
    setMenuOpenId(null)
    setMenuAnchor(null)
    try {
      const boostedUntil = days
        ? Timestamp.fromDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000))
        : null
      await setProductBoost(prod.id, boostedUntil)
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, boostedUntil } : p))
      )
      notify(days ? `Produit mis en avant pour ${days} jours` : 'Mise en avant retirée', 'success')
    } catch (e) {
      notify('Erreur lors de la mise à jour de la mise en avant', 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !canDelete) return
    try {
      await deleteProduct(deleteTarget.id)
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      notify('Produit supprimé avec succès', 'success')
      setDeleteModalOpen(false)
    } catch (e) {
      notify('Erreur lors de la suppression', 'error')
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchCategory =
      categoryFilter === 'all' || p.category === categoryFilter
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.active) ||
      (statusFilter === 'inactive' && !p.active)

    if (!matchCategory || !matchStatus) return false
    if (!searchTerm) return true

    const lower = searchTerm.toLowerCase()
    return (
      p.title?.toLowerCase().includes(lower) ||
      p.commune?.toLowerCase().includes(lower) ||
      p.category?.toLowerCase().includes(lower)
    )
  })

  const visible = filteredProducts.slice(0, visibleCount)

  const activeCount = products.filter((p) => p.active).length
  const inactiveCount = products.filter((p) => !p.active).length

  const canBulkSelect = canProcess || canDelete
  const selectableIds = canBulkSelect ? visible.map((p) => p.id) : []
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(selectableIds))
  }

  const handleBulkSetActive = async (nextStatus) => {
    if (!canProcess) return
    const targets = products.filter((p) => selectedIds.has(p.id))
    if (targets.length === 0) return
    setBulkActing(true)
    try {
      await Promise.all(targets.map((p) => toggleProductActive(p.id, nextStatus)))
      const targetIds = new Set(targets.map((p) => p.id))
      setProducts((prev) =>
        prev.map((p) => (targetIds.has(p.id) ? { ...p, active: nextStatus } : p))
      )
      notify(
        `${targets.length} produit${targets.length > 1 ? 's' : ''} ${nextStatus ? 'activé(s)' : 'désactivé(s)'}`,
        'success'
      )
      setSelectedIds(new Set())
    } catch (e) {
      notify('Erreur lors de la mise à jour groupée', 'error')
    }
    setBulkActing(false)
  }

  const handleBulkDelete = async () => {
    if (!canDelete) return
    const targetIds = new Set(selectedIds)
    if (targetIds.size === 0) return
    setBulkActing(true)
    try {
      await Promise.all([...targetIds].map((id) => deleteProduct(id)))
      setProducts((prev) => prev.filter((p) => !targetIds.has(p.id)))
      notify(`${targetIds.size} produit${targetIds.size > 1 ? 's' : ''} supprimé(s)`, 'success')
      setSelectedIds(new Set())
      setBulkDeleteModalOpen(false)
    } catch (e) {
      notify('Erreur lors de la suppression groupée', 'error')
    }
    setBulkActing(false)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 md:px-8">
      {/* Modal de suppression */}
      <ConfirmModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        title="Supprimer le produit"
        message={`Êtes-vous sûr de vouloir supprimer définitivement "${deleteTarget?.title}" de la Marketplace ? Cette action est irréversible.`}
        confirmFunction={handleDeleteConfirm}
      />

      {/* Modal de suppression groupée */}
      <ConfirmModal
        open={bulkDeleteModalOpen}
        setOpen={setBulkDeleteModalOpen}
        title="Supprimer les produits sélectionnés"
        message={`Êtes-vous sûr de vouloir supprimer définitivement ${selectedIds.size} produit${selectedIds.size > 1 ? 's' : ''} de la Marketplace ? Cette action est irréversible.`}
        confirmFunction={handleBulkDelete}
      />

      {/* Drawer d'ajout / modification */}
      <DrawerForm
        open={drawerOpen}
        setOpen={setDrawerOpen}
        onSubmit={handleSubmit(onSubmit)}
        title={
          editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'
        }
        description="Renseignez les détails du produit Marketplace"
        footerButtons={
          <>
            {saving ? (
              <div
                className="inline-flex justify-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: colors.primary }}
              >
                <Loader />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  onClick={() => setDrawerOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="ml-3 inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md"
                  style={{ backgroundColor: colors.primary }}
                >
                  {editingProduct ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </>
            )}
          </>
        }
      >
        <div className="space-y-5 px-6 py-6 sm:p-8">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Titre du produit *
            </label>
            <input
              type="text"
              {...register('title', {
                required: 'Le titre du produit est requis',
              })}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="ex: Machine a laver, Canapé 3 places"
            />
            {errors.title && (
              <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Catégorie *
              </label>
              <select
                {...register('category')}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Prix (GNF) *
              </label>
              <input
                type="number"
                {...register('price', { required: 'Le prix est requis' })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="ex: 2500000"
              />
              {errors.price && (
                <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>
                  {errors.price.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Commune
              </label>
              <select
                {...register('commune')}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sélectionner une commune</option>
                {CONAKRY_COMMUNES.map((c) => (
                  <option key={c.value} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Téléphone
              </label>
              <input
                type="text"
                {...register('phone')}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="ex: +224 626610357"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Images du produit
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {existingImageUrls.map((url, i) => (
                <div
                  key={`existing-${i}`}
                  className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200"
                >
                  <img
                    src={url}
                    alt="Aperçu"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(i)}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <RiCloseLine className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {imageFiles.map((file, i) => (
                <div
                  key={`new-${i}`}
                  className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Aperçu"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <RiCloseLine className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100">
                <RiImageAddLine className="h-6 w-6 text-gray-400" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Description
            </label>
            <textarea
              rows={3}
              {...register('description')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Description détaillée des caractéristiques du produit..."
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="active"
              {...register('active')}
              className="h-4 w-4 rounded border-gray-300 focus:ring-0 focus:ring-offset-0"
              style={{ accentColor: colors.primary }}
            />
            <label
              htmlFor="active"
              className="cursor-pointer text-sm font-semibold text-gray-700"
            >
              Produit actif sur la Marketplace
            </label>
          </div>
        </div>
      </DrawerForm>

      {/* Cartes d'aperçu Marketplace */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: RiShoppingBag3Line,
            label: 'Total Produits',
            value: products.length,
            iconBg: colors.primaryVeryLight,
            iconColor: colors.primary,
          },
          {
            icon: RiCheckboxCircleLine,
            label: 'Actifs',
            value: activeCount,
            filled: true,
          },
          {
            icon: RiCloseCircleLine,
            label: 'Inactifs',
            value: inactiveCount,
            iconBg: '#FEF2F2',
            iconColor: colors.error,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="flex flex-col gap-2.5 rounded-xl p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={
              card.filled
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.white, border: `1px solid ${colors.gray100}` }
            }
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: card.filled ? 'rgba(255,255,255,0.2)' : card.iconBg }}
            >
              <card.icon
                className="h-4 w-4"
                style={{ color: card.filled ? '#FFFFFF' : card.iconColor }}
              />
            </div>
            <p
              className="text-xs font-semibold"
              style={{ color: card.filled ? 'rgba(255,255,255,0.85)' : colors.gray500 }}
            >
              {card.label}
            </p>
            <p
              className="font-mono text-xl font-semibold tracking-tight"
              style={{ color: card.filled ? '#FFFFFF' : colors.gray900 }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* En-tête de section & Recherche */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Produits Marketplace
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Gérez les produits en vente sur la plateforme
            </p>
          </div>

          {canProcess && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
              style={{ backgroundColor: colors.orangeAccent }}
            >
              <RiAddLine className="h-4 w-4" />
              Ajouter un produit
            </button>
          )}
        </div>

        {/* Barre de Recherche & Filtres */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-72">
            <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre, commune..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 focus:border-gray-400 focus:outline-none"
            >
              <option value="all">Toutes les catégories</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 focus:border-gray-400 focus:outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>

        {/* Actions groupées */}
        {selectedIds.size > 0 && (
          <div
            className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3"
            style={{ borderColor: colors.primary, backgroundColor: colors.primaryVeryLight }}
          >
            <span className="text-sm font-semibold" style={{ color: colors.primary }}>
              {selectedIds.size} produit{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {canProcess && (
                <>
                  <button
                    type="button"
                    disabled={bulkActing}
                    onClick={() => handleBulkSetActive(true)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                    style={{ borderColor: colors.success, color: colors.success, backgroundColor: 'transparent' }}
                  >
                    Activer
                  </button>
                  <button
                    type="button"
                    disabled={bulkActing}
                    onClick={() => handleBulkSetActive(false)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                    style={{ borderColor: colors.warning, color: colors.warning, backgroundColor: 'transparent' }}
                  >
                    Désactiver
                  </button>
                </>
              )}
              {canDelete && (
                <button
                  type="button"
                  disabled={bulkActing}
                  onClick={() => setBulkDeleteModalOpen(true)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                  style={{ borderColor: colors.error, color: colors.error, backgroundColor: 'transparent' }}
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tableau des Produits */}
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
            <RiShoppingBag3Line className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">
              Aucun produit dans cette catégorie
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: colors.gray50 }}>
                  <tr>
                    <th scope="col" className="w-8 px-4 py-2.5">
                      {selectableIds.length > 0 && (
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 cursor-pointer rounded"
                          style={{ accentColor: colors.primary }}
                          title="Tout sélectionner"
                        />
                      )}
                    </th>
                    {[
                      { label: 'Produit' },
                      { label: 'Catégorie', secondary: true },
                      { label: 'Commune', secondary: true },
                      { label: 'Prix (GNF)' },
                      { label: 'Téléphone' },
                      { label: 'Statut' },
                      { label: 'Actions' },
                    ].map((col) => (
                      <th
                        key={col.label}
                        scope="col"
                        className={`px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700 ${
                          col.secondary ? 'hidden lg:table-cell' : ''
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {visible.map((prod) => {
                    const catLabel =
                      PRODUCT_CATEGORIES.find((c) => c.value === prod.category)
                        ?.label || prod.category

                    return (
                      <tr key={prod.id} className="hover:bg-gray-50">
                        <td className="w-8 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {canBulkSelect && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(prod.id)}
                              onChange={() => toggleSelect(prod.id)}
                              className="h-4 w-4 cursor-pointer rounded"
                              style={{ accentColor: colors.primary }}
                            />
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                              {prod.imageUrls?.[0] ? (
                                <img
                                  src={prod.imageUrls[0]}
                                  alt={prod.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <RiShoppingBag3Line className="h-5 w-5 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {prod.title}
                              </p>
                              {prod.description && (
                                <p className="text-xs text-gray-400 line-clamp-1">
                                  {prod.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-6 py-3 lg:table-cell">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: colors.gray100, color: colors.gray600 }}
                          >
                            {catLabel}
                          </span>
                        </td>
                        <td className="hidden px-6 py-3 text-xs text-gray-500 lg:table-cell">
                          {prod.commune || '—'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3">
                          <span className="font-mono text-sm font-bold text-gray-900">
                            {formatGNF(prod.price)}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-gray-500">
                          {prod.phone || '—'}
                        </td>
                        <td className="px-6 py-3">
                          <StatusPill tone={prod.active ? 'success' : 'error'}>
                            {prod.active ? 'Actif' : 'Inactif'}
                          </StatusPill>
                        </td>
                        <td
                          className="px-6 py-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-end" data-menu-root>
                            <button
                              type="button"
                              onClick={(event) => openMenu(event, prod.id)}
                              className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                              title="Actions"
                            >
                              <RiMore2Fill className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {visibleCount < filteredProducts.length && (
              <PaginationButton
                getmoreData={() => setVisibleCount((c) => c + PAGE_SIZE)}
              />
            )}
          </div>
        )}
      </div>

      {menuOpenId && menuAnchor && (() => {
        const prod = products.find((p) => p.id === menuOpenId)
        if (!prod) return null
        return (
          <div
            className="fixed z-[100] w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-2xl"
            style={{ left: menuAnchor.left, top: menuAnchor.top }}
            data-menu-root
          >
            {canProcess && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpenId(null)
                  setMenuAnchor(null)
                  handleOpenEdit(prod)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <RiEditLine className="h-4 w-4 text-gray-400" />
                Modifier
              </button>
            )}
            {canProcess && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpenId(null)
                  setMenuAnchor(null)
                  handleToggleStatus(prod)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {prod.active ? (
                  <RiCloseCircleLine className="h-4 w-4" style={{ color: colors.warning }} />
                ) : (
                  <RiCheckboxCircleLine className="h-4 w-4" style={{ color: colors.success }} />
                )}
                {prod.active ? 'Désactiver' : 'Activer'}
              </button>
            )}

            {canProcess && (isProductBoosted(prod) ? (
              <button
                type="button"
                onClick={() => handleSetProductBoost(prod, null)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <RiRocketLine className="h-4 w-4 text-gray-400" />
                Retirer la mise en avant
              </button>
            ) : (
              <div className="px-3 py-1.5">
                <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <RiRocketLine className="h-3.5 w-3.5" />
                  Mettre en avant
                </p>
                <div className="flex gap-1.5">
                  {[7, 15, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleSetProductBoost(prod, days)}
                      className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    >
                      {days}j
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpenId(null)
                  setMenuAnchor(null)
                  setDeleteTarget(prod)
                  setDeleteModalOpen(true)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold hover:bg-red-50"
                style={{ color: colors.error }}
              >
                <RiDeleteBinLine className="h-4 w-4" />
                Supprimer
              </button>
            )}
          </div>
        )
      })()}
    </div>
  )
}
