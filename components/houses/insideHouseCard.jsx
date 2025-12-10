import React from 'react'

function InsideHouseCard({ houseInsides }) {
  return (
    <div class="grid grid-cols-1 gap-5 p-10 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
      {houseInsides?.map((imageUrl, index) => {
        return (
          <div class="overflow-hidden rounded shadow-lg" key={index + 1}>
            <div className="imageInsid">
              <img class="h-60 w-96 object-fill" src={imageUrl} alt="image" />
              <div class="px-6 py-4">
                <div class="mb-2 text-gray-400">image {index + 1}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default InsideHouseCard
