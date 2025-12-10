import { Disclosure } from '@headlessui/react'
import React from 'react'
import { useEffect } from 'react'
import { RiArrowUpSLine } from 'react-icons/ri'
import { useState } from 'react'
import { getSelectedMenu } from '../../lib/services/menu'
import { OrderSkleton } from '../Orders/OrdersList'

function MenuPreview({ restaurantId, isAccountCreated }) {
  const [generatedMenu, setGeneratedMenu] = useState({ menuSections: [] })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const getCurrentMenu = async () => {
      setIsLoading(true)
      if (isAccountCreated) {
        const menu = await getSelectedMenu(restaurantId)
        setGeneratedMenu(menu)
      }
      setIsLoading(false)
    }
    getCurrentMenu()
  }, [isAccountCreated])

  return isLoading ? (
    <OrderSkleton />
  ) : (
    <div className="flex flex-col gap-2 text-teal-500">
      <p>Menu principal</p>
      <div>
        {generatedMenu?.menuSections.map((menu) => {
          return (
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex w-full justify-between border-b bg-slate-100 px-4 py-2 text-left text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
                    <span>{menu?.name}</span>
                    <RiArrowUpSLine
                      className={`${
                        open ? 'rotate-180 transform' : ''
                      } h-5 w-5 text-black`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-4 pt-4 pb-2 ">
                    {menu?.items.map((item) => {
                      return (
                        <div className="border-b p-2">
                          <div className="flex items-center justify-between">
                            <p className="">{item?.alias}</p>
                            <p className="">{item?.price}</p>
                          </div>
                          <p className="p-2 text-sm text-gray-500">
                            {item?.description}
                          </p>
                        </div>
                      )
                    })}
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          )
        })}
      </div>
    </div>
  )
}

export default MenuPreview
