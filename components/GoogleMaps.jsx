import React, { useState } from 'react'
import { GoogleMap, LoadScriptNext, MarkerF } from '@react-google-maps/api'

const center = {
  lat: 9.550543829083447,
  lng: -13.656484042509089,
}

function GoogleMaps({ setLonLat, lng, lat }) {
  const [position, setposition] = useState(lng ? { lng, lat } : null)

  const onMapClick = (e) => {
    setposition({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    })
    setLonLat(e.latLng.lng(), e.latLng.lat())
  }

  return (
    <LoadScriptNext googleMapsApiKey="AIzaSyA0-O8o7phDIFY72L50o3mF1o336fE5p7s">
      <GoogleMap
        clickableIcons={false}
        mapContainerStyle={{
          width: '100%',
          height: '200px',
          border: '2px solid black',
        }}
        onClick={onMapClick}
        center={center}
        zoom={13}
      >
        <MarkerF icon={'images/pin.png'} position={position} />
      </GoogleMap>
    </LoadScriptNext>
  )
}

export default React.memo(GoogleMaps)
