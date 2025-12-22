import React from 'react'

function HouseCard({
  imageUrl,
  title,
  description,
  price,
  partNumber,
  address,
}) {
  return (
    <div class="p-10">
      <div class=" w-full gap-2 lg:flex lg:max-w-full">
        <div class="h-48 flex-none overflow-hidden rounded rounded-t bg-cover text-center shadow-sm lg:h-auto lg:w-96 lg:rounded-t-none lg:rounded-l ">
          <img
            class="h-full w-full object-fill"
            src={imageUrl}
            alt="image vitrine"
          />
        </div>
        <div class="flex flex-col justify-between rounded-b border border-gray-400 bg-white p-4 leading-normal lg:rounded-b-none lg:rounded-r lg:border-gray-200">
          <div class="mb-8">
            <p class=" mb-5 flex items-center text-2xl font-bold text-gray-900">
              {'Logement en '}
              {title}
            </p>

            <div className="mb-10 flex items-center justify-between">
              <div>
                <p className="mb-2 text-gray-600">
                  Commune: {address?.commune?.label || '—'}
                </p>
                <p className="text-gray-600">
                  Quartier: {address?.section?.label || address?.zone || '—'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-gray-500">
                  {' '}
                  Prix:<span className="text-xl text-gray-900">{price}</span>gnf
                </p>
                <p className="text-gray-600">
                  Nombre de Chambre : {partNumber}
                </p>
              </div>
            </div>

            <div class="mb-2 text-xl font-bold text-cyan-500 ">Description</div>
            <p class="text-base text-gray-700">{description}</p>
          </div>
        </div>
      </div>
      {/* <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/1.1.2/tailwind.min.css"> */}
    </div>
  )
}

export default HouseCard
