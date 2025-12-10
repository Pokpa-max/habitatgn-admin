import React, { useState } from 'react'
import { GoogleMap, LoadScriptNext, MarkerF } from '@react-google-maps/api'
import { useEffect } from 'react'

const center = {
  lat: 9.550543829083447,
  lng: -13.656484042509089,
}

function OrderGoogleMaps({ latLng, deliveryLg }) {
  const [position, setposition] = useState()
  const [Orderposition, setOrderposition] = useState()

  useEffect(() => {
    setposition({
      lat: latLng?.geopoint?._lat,
      lng: latLng?.geopoint?._long,
    })
    setOrderposition({
      lat: deliveryLg?.geopoint?._lat,
      lng: deliveryLg?.geopoint?._long,
    })
  }, [])

  return (
    <LoadScriptNext googleMapsApiKey="AIzaSyA0-O8o7phDIFY72L50o3mF1o336fE5p7s">
      <GoogleMap
        clickableIcons={false}
        mapContainerStyle={{
          width: '100%',
          height: '200px',
          border: '2px solid black',
        }}
        center={center}
        zoom={13}
      >
        <MarkerF icon={'images/pin.png'} position={position} />
        <MarkerF icon={'images/pin.png'} position={Orderposition} />
      </GoogleMap>
    </LoadScriptNext>
  )
}

export default React.memo(OrderGoogleMaps)
