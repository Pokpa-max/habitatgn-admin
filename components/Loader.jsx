import React from 'react'
import BeatLoader from 'react-spinners/BeatLoader'

function Loader({ size = 6, margin = 1, color = 'white' }) {
  return (
    <div className="flex items-center justify-center space-x-2">
      <BeatLoader color="white" size={size} margin={margin} />
    </div>
  )
}

export default Loader
