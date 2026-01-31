import React, { useState } from 'react'
import { GoogleMap, LoadScriptNext, MarkerF } from '@react-google-maps/api'

const center = {
  lat: 9.550543829083447,
  lng: -13.656484042509089,
}

function MapInner({ position, onMapClick, icon }) {
  const getIcon = () => {
    if (!icon) return 'images/pin.png'
    
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      return {
        url: icon,
        scaledSize: new window.google.maps.Size(50, 50),
      }
    }
    
    return icon
  }

  return (
    <GoogleMap
      clickableIcons={false}
      mapContainerStyle={{
        width: '100%',
        height: '200px',
        border: '2px solid black',
      }}
      onClick={onMapClick}
      center={position || center}
      zoom={13}
    >
      <MarkerF icon={getIcon()} position={position} />
    </GoogleMap>
  )
}

function GoogleMaps({ setLonLat, lng, lat, icon, readOnly }) {
  const [position, setposition] = useState(lng ? { lng, lat } : null)

  const onMapClick = (e) => {
    if (readOnly) return
    setposition({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    })
    setLonLat && setLonLat(e.latLng.lng(), e.latLng.lat())
  }

  return (
    <LoadScriptNext googleMapsApiKey="AIzaSyA0-O8o7phDIFY72L50o3mF1o336fE5p7s">
      <MapInner position={position} onMapClick={onMapClick} icon={icon} />
    </LoadScriptNext>
  )
}

export default React.memo(GoogleMaps)
