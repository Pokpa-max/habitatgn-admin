import { useRouter } from 'next/router'
import Scaffold from '@/components/Scaffold'
import { db } from '@/lib/firebase/client_config'
import React, { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { OrderSkleton } from '../../../components/Orders/OrdersList'
import GoogleMaps from '@/components/GoogleMaps'
import { useColors } from '@/contexts/ColorContext'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

function DailyRentalDetail() {
  const router = useRouter()
  const colors = useColors()
  const { id } = router.query
  const [dailyRental, setDailyRental] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')

  useEffect(() => {
    if (id) {
      const docRef = doc(db, 'daily_rentals', id)
      const fetchData = async () => {
        setIsLoading(true)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setDailyRental(data)
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

  if (!dailyRental) {
    return (
      <Scaffold>
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Aucune location trouvée</p>
        </div>
      </Scaffold>
    )
  }

  const allImages = [dailyRental.imageUrl, ...(dailyRental.images || dailyRental.houseInsides || [])].filter(Boolean)

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
            {dailyRental.houseType?.label || dailyRental.houseType?.value || 'Logement Journalier'}
          </h1>
          <p className="mt-2 text-gray-600">
            {[
              dailyRental.address?.commune?.label || dailyRental.address?.zone,
              dailyRental.address?.town?.label ?? dailyRental.address?.town,
            ].filter(v => v && typeof v === 'string').join(', ')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Galerie d'images */}
          <div className="space-y-4 lg:col-span-2">
            {/* Image principale */}
            <div className="relative h-96 overflow-hidden rounded-xl bg-gray-100">
              <img
                src={selectedImage || dailyRental.imageUrl}
                alt="Logement journalier"
                className="h-full w-full object-cover"
              />
              {!dailyRental.isAvailable && (
                <div className="absolute top-4 right-4 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white">
                  Occupé
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
                    style={selectedImage === img ? { boxShadow: `0 0 0 2px ${colors.primary}` } : {}}
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
                {dailyRental.description || 'Aucune description disponible'}
              </p>
            </div>

            {/* Map */}
            <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Localisation
              </h2>
              <div className="w-full overflow-hidden rounded-lg">
                <GoogleMaps
                  lat={dailyRental.address?.lat}
                  lng={dailyRental.address?.long}
                  readOnly={true}
                  height="320px"
                  infoContent={
                    <div style={{ padding: '6px 8px', maxWidth: '220px' }}>
                      <p style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
                        {dailyRental.houseType?.label || 'Location journalière'}
                      </p>
                      {dailyRental.pricePerDay > 0 && (
                        <p style={{ color: colors.primary, fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                          {formatPrice(dailyRental.pricePerDay, dailyRental.currency)}
                          <span style={{ fontSize: '11px', color: '#888', fontWeight: '400', marginLeft: '4px' }}>
                            / jour
                          </span>
                        </p>
                      )}
                      <p style={{ color: '#555', fontSize: '12px' }}>
                        {[
                          dailyRental.address?.commune?.label || dailyRental.address?.zone,
                        ].filter(v => v && typeof v === 'string').join(', ')}
                      </p>
                    </div>
                  }
                />
              </div>
            </div>

            {/* Commodités */}
            {dailyRental.amenities && dailyRental.amenities.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  Commodités
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {dailyRental.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center text-gray-700">
                      <svg
                        className="mr-2 h-5 w-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">

              {/* Tarification */}
              <div className="rounded-xl bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Tarification</h3>
                <div className="space-y-3">
                  {dailyRental.pricePerDay > 0 && (
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-600">Par jour</span>
                      <span className="font-bold" style={{ color: colors.primary }}>
                        {formatPrice(dailyRental.pricePerDay, dailyRental.currency)}
                      </span>
                    </div>
                  )}
                  {dailyRental.pricePerNight > 0 && (
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-gray-600">Par nuit</span>
                      <span className="font-bold" style={{ color: colors.primary }}>
                        {formatPrice(dailyRental.pricePerNight, dailyRental.currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Détails Séjour */}
              <div className="rounded-xl bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Détails Séjour</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase">Check-in</p>
                      <p className="font-bold text-gray-900">{dailyRental.checkInHour || '14'}h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase">Check-out</p>
                      <p className="font-bold text-gray-900">{dailyRental.checkOutHour || '11'}h</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    {dailyRental.maxGuests > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Invités max</span>
                        <span className="font-semibold text-gray-900">{dailyRental.maxGuests}</span>
                      </div>
                    )}
                    {dailyRental.bedrooms > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Chambres</span>
                        <span className="font-semibold text-gray-900">{dailyRental.bedrooms}</span>
                      </div>
                    )}
                    {dailyRental.minStay > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Séjour min.</span>
                        <span className="font-semibold text-gray-900">{dailyRental.minStay} jours</span>
                      </div>
                    )}
                    {dailyRental.maxStay > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Séjour max.</span>
                        <span className="font-semibold text-gray-900">{dailyRental.maxStay} jours</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact & Statut */}
              <div className="rounded-xl bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Contact</h3>
                <a
                  href={`tel:${dailyRental.phoneNumber}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${colors.primary}20` }}
                  >
                    <svg
                      className="h-5 w-5"
                      style={{ color: colors.primary }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-bold text-gray-900">{dailyRental.phoneNumber}</p>
                  </div>
                </a>

                <div className="mt-4">
                  <div
                    className={`rounded-lg py-2 px-4 text-center ${
                      dailyRental.isAvailable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {dailyRental.isAvailable ? '✓ Disponible' : '✗ Occupé'}
                  </div>
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
})(DailyRentalDetail)
