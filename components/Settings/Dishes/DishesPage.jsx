import React from 'react'
import Header from '@/components/Header'
import DishesList from './DishesList'

function DishesPage() {
  return (
    <div className="flex-1 py-6">
      <div className="px-4 mx-auto sm:px-6 md:px-8">
        <Header title={'Dishes'} />
        <DishesList />
      </div>
    </div>
  )
}

export default DishesPage
