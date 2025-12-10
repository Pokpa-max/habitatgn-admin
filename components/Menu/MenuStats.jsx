import React from 'react'

function MenuStats() {
  return (
    <div>
      <div className="grid grid-cols-12 gap-3">
        <div className="flex justify-between h-32 col-span-12 p-4 bg-slate-100 lg:col-span-4">
          <div className="space-y-2">
            <p className="text-gray-500">Menu</p>
            <p className="text-5xl text-gray-900">
              20 <span className="text-sm">elements</span>
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-gray-500">Menu active</p>
            <p className="text-xl text-gray-900 ">Menu principal</p>
          </div>
        </div>
        <div className="h-32 col-span-12 p-4 space-y-2 bg-slate-100 lg:col-span-4">
          <p className="text-gray-500">Categories</p>
          <p className="text-5xl text-gray-900">
            20 <span className="text-sm">elements</span>
          </p>
        </div>
        <div className="h-32 col-span-12 p-4 space-y-2 bg-slate-100 lg:col-span-4">
          <p className="text-gray-500">Elements</p>
          <p className="text-5xl text-gray-900">
            20 <span className="text-sm">elements</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default MenuStats
