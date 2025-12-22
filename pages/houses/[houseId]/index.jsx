import { useRouter } from 'next/router'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import { db } from '@/lib/firebase/client_config'
import React, { useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { useState } from 'react'
import HouseCard from '../../../components/houses/houseCard'
import InsideHouseCard from '../../../components/houses/insideHouseCard'
import { OrderSkleton } from '../../../components/Orders/OrdersList'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

function HouseDetail() {
  const router = useRouter()
  const { houseId } = router.query
  const [house, setHouse] = useState()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (houseId) {
      const houseRef = doc(db, 'houses', houseId)
      const fetchHouse = async () => {
        setIsLoading(true)
        const docSnap = await getDoc(houseRef)
        if (docSnap.exists()) {
          setHouse(docSnap.data())
        }
        setIsLoading(false)
      }
      fetchHouse()
    }
  }, [houseId])

  return isLoading ? (
    <Scaffold>
      <OrderSkleton />
    </Scaffold>
  ) : (
    <Scaffold>
      <div className="flex items-end justify-between">
        <Header title="Details du logement" />
      </div>
      <HouseCard
        imageUrl={house?.imageUrl}
        description={house?.description}
        title={house?.offerType?.value}
        price={house?.price}
        partNumber={house?.partNumber}
        address={house?.address}
      />
      <p className="py-5 text-2xl text-cyan-500">Details Images du Logement</p>
      <InsideHouseCard houseInsides={house?.houseInsides} />
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
