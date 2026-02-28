import { useRouter } from 'next/router'
import Scaffold from '@/components/Scaffold'
import { db } from '@/lib/firebase/client_config'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { OrderSkleton } from '../../../components/Orders/OrdersList'
import GoogleMaps from '@/components/GoogleMaps'
import { useColors } from '../../../contexts/ColorContext'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

function LandDetail() {
  const router = useRouter()
  const { id } = router.query
  const colors = useColors()

  const [land, setLand] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')

  useEffect(() => {
    if (id) {
      const docRef = doc(db, 'lands', id)
      const fetchData = async () => {
        setIsLoading(true)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setLand(data)
          setSelectedImage(data?.imageUrl)
        }
        setIsLoading(false)
      }
      fetchData()
    }
  }, [id])

  const formatPrice = (price, currency = 'GNF') => {
    const curr = ['GNF', 'USD', 'EUR'].includes(currency) ? currency : 'GNF'
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
    }).format(price || 0)
  }

  if (isLoading) {
    return (
      <Scaffold>
        <OrderSkleton />
      </Scaffold>
    )
  }

  if (!land) {
    return (
      <Scaffold>
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Aucun terrain trouvé</p>
        </div>
      </Scaffold>
    )
  }

  // Rétrocompat : anciens docs utilisent houseInsides, nouveaux utilisent images
  const allImages = [
    land.imageUrl,
    ...(land.images || land.houseInsides || []),
  ].filter(Boolean)

  // Rétrocompat adresse
  const section = land.address?.section?.label ?? land.address?.section
  const commune = land.address?.commune?.label || land.address?.zone
  const town = land.address?.town?.label ?? land.address?.town

  return (
    <Scaffold>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {land.propertyType?.label || land.houseType?.label || 'Terrain'}
          </h1>
          <p className="mt-2 text-gray-600">
            {[section, commune, town]
              .filter((v) => v && typeof v === 'string')
              .join(', ')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Galerie d'images */}
          <div className="space-y-4 lg:col-span-2">
            {/* Image principale */}
            <div className="relative h-96 overflow-hidden rounded-xl bg-gray-100">
              <img
                src={selectedImage || land.imageUrl}
                alt="Terrain"
                className="h-full w-full object-cover"
              />
              {!land.isAvailable && (
                <div className="absolute top-4 right-4 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white">
                  Non disponible
                </div>
              )}
            </div>

            {/* Miniatures */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {allImages.map((img, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(img)}
                    className="relative h-24 cursor-pointer overflow-hidden rounded-lg transition-all hover:opacity-75"
                    style={
                      selectedImage === img
                        ? { boxShadow: `0 0 0 2px ${colors.primary}` }
                        : {}
                    }
                  >
                    <img
                      src={img}
                      alt={`Photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Description
              </h2>
              <p className="leading-relaxed text-gray-700">
                {land.description || 'Aucune description disponible'}
              </p>
            </div>

            {/* Map */}
            <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Localisation
              </h2>
              <div className="w-full overflow-hidden rounded-lg">
                <GoogleMaps
                  lat={land.address?.lat}
                  lng={land.address?.long}
                  readOnly={true}
                  height="320px"
                  infoContent={
                    <div style={{ padding: '6px 8px', maxWidth: '220px' }}>
                      <p
                        style={{
                          fontWeight: '700',
                          fontSize: '14px',
                          marginBottom: '4px',
                        }}
                      >
                        {land.propertyType?.label || 'Terrain'}
                      </p>
                      <p
                        style={{
                          color: colors.primary,
                          fontWeight: '600',
                          fontSize: '16px',
                          marginBottom: '4px',
                        }}
                      >
                        {formatPrice(land.price, land.currency)}
                      </p>
                      <p style={{ color: '#555', fontSize: '12px' }}>
                        {[section, commune]
                          .filter((v) => v && typeof v === 'string')
                          .join(', ')}
                      </p>
                    </div>
                  }
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-xl bg-white p-6 shadow-lg">
              {/* Prix */}
              <div className="mb-6">
                <p className="mb-1 text-sm text-gray-600">
                  {land.offerType?.label}
                </p>
                <p
                  className="text-4xl font-bold"
                  style={{ color: colors.primary }}
                >
                  {formatPrice(land.price, land.currency)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {land.offerType?.value === 'buy'
                    ? 'Prix de vente'
                    : land.offerType?.value === 'bail'
                    ? 'Bail'
                    : 'Prix total'}
                </p>
              </div>

              {/* Caractéristiques */}
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Caractéristiques
                </h3>

                {land.area > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Superficie</span>
                    <span className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('fr-GN').format(land.area)} m²
                    </span>
                  </div>
                )}

                {land.currency && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Devise</span>
                    <span className="font-semibold text-gray-900">
                      {land.currency}
                    </span>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <a
                  href={`tel:${land.phoneNumber}`}
                  className="flex items-center gap-2 text-black hover:underline"
                >
                  <svg
                    className="h-5 w-5"
                    style={{ color: colors.primary }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {land.phoneNumber}
                </a>
              </div>

              {/* Statut */}
              <div className="mt-4">
                <div
                  className={`rounded-lg py-2 px-4 text-center ${
                    land.isAvailable
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {land.isAvailable ? '✓ Disponible' : '✗ Non disponible'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Scaffold>
  )
}

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async () => {
  return {
    props: {},
  }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(LandDetail)
