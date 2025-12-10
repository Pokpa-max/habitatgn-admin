import React from 'react'
import { RiSearchLine } from 'react-icons/ri'
import Header from '@/components/Header'
import MenuPopover from '../MenuPopover'
import OrdersStats from './OrdersStats'

const sortOptions = [
  { name: 'En cours de livraison', href: '#', current: true },
  { name: 'Livrés', href: '#', current: false },
  { name: 'Annulés', href: '#', current: false },
  { name: 'En attente de confirmation', href: '#', current: false },
  { name: 'En preparation', href: '#', current: false },
]

const periods = [
  { name: 'Jour', href: '#', current: true },
  { name: 'Semaine', href: '#', current: false },
  { name: 'Mois', href: '#', current: false },
  { name: 'Anneé', href: '#', current: false },
]

function OrdersPageHeader() {
  return (
    <div>
      <Header title={'Commandes'} />
      <div className="mb-8 sm:flex sm:items-center">
        <div className="flex-auto space-y-2 lg:flex">
          <div className="flex items-center flex-1 ">
            <div className="w-full max-w-lg lg:max-w-xs">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <RiSearchLine
                    className="w-5 h-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full py-2 pl-10 pr-3 leading-5 placeholder-gray-500 bg-white border border-gray-300 rounded-sm focus:border-primary-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                  placeholder="Rechercher une commande"
                  type="search"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-4 ">
            <div className="p-2 bg-gray-900 rounded-sm hover:bg-gray-700">
              <MenuPopover options={sortOptions} label={'Avancement'} />
            </div>
            <div className="p-2 bg-gray-900 rounded-sm hover:bg-gray-700">
              <MenuPopover options={periods} label={'Periode'} />
            </div>
          </div>
        </div>
      </div>
      <OrdersStats />
    </div>
  )
}

export default OrdersPageHeader
