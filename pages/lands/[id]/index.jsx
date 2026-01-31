import { useRouter } from 'next/router'
import Scaffold from '@/components/Scaffold'
import { db } from '@/lib/firebase/client_config'
import React, { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { OrderSkleton } from '../../../components/Orders/OrdersList'
import GoogleMaps from '@/components/GoogleMaps'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

function LandDetail() {
  const router = useRouter()
  const { id } = router.query 
    
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(price || 0)
  }
  
  const formatArea = (area) => {
      return new Intl.NumberFormat('fr-GN').format(area || 0)
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

  const allImages = [land.imageUrl, ...(land.houseInsides || [])].filter(Boolean)

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
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Terrain à {land.offerType?.label || land.offerType?.value || 'Vendre'}
                </h1>
                <p className="mt-2 text-gray-600">
                    {land.address?.zone}, {land.address?.commune?.label}, {land.address?.town?.label}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                    {land.address?.section?.label || land.address?.section}
                  </span>
              </div>
          </div>
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
                    className={`relative h-24 cursor-pointer overflow-hidden rounded-lg transition-all ${
                      selectedImage === img
                        ? 'ring-4 ring-cyan-500'
                        : 'hover:opacity-75'
                    }`}
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
              <div className="h-80 w-full overflow-hidden rounded-lg">
                  <GoogleMaps 
                     lat={land.address?.lat}
                     lng={land.address?.long}
                     icon={selectedImage || land.imageUrl}
                  />
              </div>
            </div>

          </div>

          {/* Sidebar - Informations */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
                
              {/* Informations Clés Card */}
              <div className="rounded-xl bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Informations Clés</h3>
                
                <div className="space-y-4">
                     <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span className="text-gray-600">Prix</span>
                        <span className="text-xl font-bold text-cyan-600">{formatPrice(land.price)}</span>
                     </div>
                     <div className="flex items-center justify-between pb-2">
                        <span className="text-gray-600">Superficie</span>
                        <span className="text-lg font-bold text-gray-900">{formatArea(land.area)} m²</span>
                     </div>
                </div>
              </div>

              {/* Contact Card */}
              <div className="rounded-xl bg-white p-6 shadow-lg">
                 <h3 className="mb-4 text-lg font-bold text-gray-900">Contact</h3>
                 <a
                    href={`tel:${land.phoneNumber}`}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="font-bold text-gray-900">{land.phoneNumber}</p>
                    </div>
                  </a>
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
