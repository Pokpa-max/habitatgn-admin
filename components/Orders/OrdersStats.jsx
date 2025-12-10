import React from 'react'
import { RiTakeawayFill } from 'react-icons/ri'

function OrdersStats() {
  return (
    <div className="grid gap-4 md:grid-col-2 lg:grid-cols-4">
      <div className="col-span-1 p-5 space-y-4 border border-gray-100  bg-slate-100">
        <div className="flex items-center gap-2">
          <RiTakeawayFill className="text-black" />
          <p className="text-gray-500">
            Commandes <span className="font-bold text-gray-900">totales</span>
          </p>
        </div>
        <h1 className="text-4xl text-black xl:text-5xl">127</h1>
      </div>
      <div className="col-span-1 p-5 space-y-4 border border-gray-100 bg-slate-100">
        <div className="flex items-center gap-2">
          <RiTakeawayFill className="text-green-400" />
          <p className="text-gray-500">
            Commandes <span className="font-bold text-green-400">Livrés</span>
          </p>
        </div>
        <h1 className="text-4xl text-green-400 xl:text-5xl">127</h1>
      </div>
      <div className="col-span-1 p-5 space-y-4 border border-gray-100  bg-slate-100">
        <div className="flex items-center gap-2">
          <RiTakeawayFill className="text-orange-400" />
          <p className="text-gray-500">
            Commandes{' '}
            <span className="font-bold text-orange-400">En cours</span>{' '}
          </p>
        </div>
        <h1 className="text-4xl text-orange-400 xl:text-5xl">127</h1>
      </div>
      <div className="col-span-1 p-5 space-y-4 border border-gray-100  bg-slate-100">
        <div className="flex items-center gap-2">
          <RiTakeawayFill className="text-red-400" />
          <p className="text-gray-500">
            Commandes <span className="font-bold text-red-400">annulés</span>
          </p>
        </div>
        <h1 className="text-4xl text-red-400 xl:text-5xl">127</h1>
      </div>
    </div>
  )
}

export default OrdersStats
