import React from 'react'
import Header from '@/components/Header'
import CategoriesList from './CategoriesList'

function CategoriesPage() {
  return (
    <div className="flex-1 py-6">
      <div className="px-4 mx-auto sm:px-6 md:px-8">
        <Header title={'Categories'} />
        <CategoriesList />
      </div>
    </div>
  )
}

export default CategoriesPage
