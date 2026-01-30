// import { useRouter } from 'next/router'
// import Scaffold from '@/components/Scaffold'
// import Header from '@/components/Header'
// import { db } from '@/lib/firebase/client_config'
// import React, { useEffect } from 'react'
// import { doc, getDoc } from 'firebase/firestore'
// import { useState } from 'react'
// import HouseCard from '../../../components/houses/houseCard'
// import InsideHouseCard from '../../../components/houses/insideHouseCard'
// import { OrderSkleton } from '../../../components/Orders/OrdersList'
// import {
//   AuthAction,
//   withAuthUser,
//   withAuthUserTokenSSR,
// } from 'next-firebase-auth'

// function HouseDetail() {
//   const router = useRouter()
//   const { houseId } = router.query
//   const [house, setHouse] = useState()
//   const [isLoading, setIsLoading] = useState(false)

//   useEffect(() => {
//     if (houseId) {
//       const houseRef = doc(db, 'houses', houseId)
//       const fetchHouse = async () => {
//         setIsLoading(true)
//         const docSnap = await getDoc(houseRef)
//         if (docSnap.exists()) {
//           setHouse(docSnap.data())
//         }
//         setIsLoading(false)
//       }
//       fetchHouse()
//     }
//   }, [houseId])
//   console.log('house ❤️❤️❤️❤️❤️❤️ ')
//   console.log(house)

//   return isLoading ? (
//     <Scaffold>
//       <OrderSkleton />
//     </Scaffold>
//   ) : (
//     <Scaffold>
//       <div className="flex items-end justify-between">
//         <Header title="Details du logement" />
//       </div>
//       <HouseCard
//         imageUrl={house?.imageUrl}
//         description={house?.description}
//         title={house?.offerType?.value}
//         price={house?.price}
//         partNumber={house?.partNumber}
//         address={house?.address}
//       />
//       <p className="py-5 text-2xl text-cyan-500">Details Images du Logement</p>
//       <InsideHouseCard houseInsides={house?.houseInsides} />
//     </Scaffold>
//   )
// }

// export const getServerSideProps = withAuthUserTokenSSR({
//   whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
// })(async () => {
//   return {
//     props: {},
//   }
// })
// export default withAuthUser({
//   whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
// })(HouseDetail)
import { useRouter } from 'next/router'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import { db } from '@/lib/firebase/client_config'
import React, { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { OrderSkleton } from '../../../components/Orders/OrdersList'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import Image from 'next/image'

function HouseDetail() {
  const router = useRouter()
  const { houseId } = router.query
  const [house, setHouse] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')

  useEffect(() => {
    if (houseId) {
      const houseRef = doc(db, 'houses', houseId)
      const fetchHouse = async () => {
        setIsLoading(true)
        const docSnap = await getDoc(houseRef)
        if (docSnap.exists()) {
          const houseData = docSnap.data()
          setHouse(houseData)
          setSelectedImage(houseData?.imageUrl)
        }
        setIsLoading(false)
      }
      fetchHouse()
    }
  }, [houseId])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (isLoading) {
    return (
      <Scaffold>
        <OrderSkleton />
      </Scaffold>
    )
  }

  if (!house) {
    return (
      <Scaffold>
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Aucun logement trouvé</p>
        </div>
      </Scaffold>
    )
  }

  const allImages = [house.imageUrl, ...(house.houseInsides || [])]

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
            {house.houseType?.label || 'Logement'}
          </h1>
          <p className="mt-2 text-gray-600">
            {house.address?.zone}, {house.address?.commune?.label}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Galerie d'images */}
          <div className="space-y-4 lg:col-span-2">
            {/* Image principale */}
            <div className="relative h-96 overflow-hidden rounded-xl bg-gray-100">
              <img
                src={selectedImage}
                alt="Logement"
                className="h-full w-full object-cover"
              />
              {!house.isAvailable && (
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
                {house.description || 'Aucune description disponible'}
              </p>
            </div>

            {/* Commodités */}
            {house.commodites && house.commodites.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  Commodités
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {house.commodites.map((commodite, index) => (
                    <div
                      key={index}
                      className="flex items-center text-gray-700"
                    >
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
                      {commodite}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Informations */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-xl bg-white p-6 shadow-lg">
              {/* Prix */}
              <div className="mb-6">
                <p className="mb-1 text-sm text-gray-600">
                  {house.offerType?.label}
                </p>
                <p className="text-4xl font-bold text-cyan-600">
                  {formatPrice(house.price)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {house.isPurchaseMode ? 'Prix de vente' : 'Par mois'}
                </p>
              </div>

              {/* Caractéristiques principales */}
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Caractéristiques
                </h3>

                {house.bedrooms > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Chambres</span>
                    <span className="font-semibold text-gray-900">
                      {house.bedrooms}
                    </span>
                  </div>
                )}

                {house.area > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Surface</span>
                    <span className="font-semibold text-gray-900">
                      {house.area} m²
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Meublé</span>
                  <span className="font-semibold text-gray-900">
                    {house.isFurnished ? 'Oui' : 'Non'}
                  </span>
                </div>

                {house.furnishing && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Ameublement</span>
                    <span className="font-semibold text-gray-900">
                      {house.furnishing.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Cautions */}
              {!house.isPurchaseMode && (
                <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
                  <h3 className="mb-4 font-semibold text-gray-900">
                    Conditions de location
                  </h3>

                  {house.rentalDeposit > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Caution locative</span>
                      <span className="font-semibold text-gray-900">
                        {house.rentalDeposit} mois
                      </span>
                    </div>
                  )}

                  {house.housingDeposit > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Avance</span>
                      <span className="font-semibold text-gray-900">
                        {house.housingDeposit} mois
                      </span>
                    </div>
                  )}

                  {house.rentalStatus && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Statut requis</span>
                      <span className="font-semibold text-gray-900">
                        {house.rentalStatus}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {/* Contact */}
              <a
                href={`tel:${house.phoneNumber}`}
                className="flex items-center gap-2 text-black hover:underline"
              >
                <svg
                  className="h-5 w-5 text-cyan-600"
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
                {house.phoneNumber}
              </a>
              {/* Statut */}
              <div className="mt-4">
                <div
                  className={`rounded-lg py-2 px-4 text-center ${
                    house.isAvailable
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {house.isAvailable ? '✓ Disponible' : '✗ Non disponible'}
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
})(HouseDetail)
