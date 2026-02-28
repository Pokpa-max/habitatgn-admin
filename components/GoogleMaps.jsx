import React, { useState } from 'react'
import { GoogleMap, LoadScriptNext, MarkerF, InfoWindowF } from '@react-google-maps/api'

const center = {
  lat: 9.550543829083447,
  lng: -13.656484042509089,
}

function MapInner({ position, onMapClick, icon, height = '320px', infoContent }) {
  const [showInfo, setShowInfo] = useState(true)

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
        height: height,
        border: '2px solid black',
      }}
      onClick={onMapClick}
      center={position || center}
      zoom={13}
    >
      <MarkerF
        icon={getIcon()}
        position={position}
        onClick={() => infoContent && setShowInfo(true)}
      />
      {showInfo && infoContent && position && (
        <InfoWindowF position={position} onCloseClick={() => setShowInfo(false)}>
          {infoContent}
        </InfoWindowF>
      )}
    </GoogleMap>
  )
}

function GoogleMaps({ setLonLat, lng, lat, icon, readOnly, height, infoContent }) {
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
      <MapInner position={position} onMapClick={onMapClick} icon={icon} height={height} infoContent={infoContent} />
    </LoadScriptNext>
  )
}

export default React.memo(GoogleMaps)
