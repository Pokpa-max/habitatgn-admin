import React from 'react'
import { columnsItems } from './_dataTable'
import { RiArrowUpSLine, RiDeleteRow } from 'react-icons/ri'
import { menuItems } from '../../_data'
import { Disclosure } from '@headlessui/react'

function ItemsList() {
  return <ItemsTable />
}

function ItemsTable() {
  return (
    <div className="">
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-left bg-black border-b hover:bg-gray-700 ">
              <div>
                <p className="text-white">Liste des elements de menu</p>
              </div>
              <RiArrowUpSLine
                className={`${
                  open ? 'rotate-180 transform' : ''
                } h-5 w-5 text-white`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-2 ">
              <div className="flex flex-col mt-4">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div className="overflow-hidden ring-1 ring-black ring-opacity-5 md:rounded-sm">
                      <table className="min-w-full text-left divide-y divide-gray-300 table-auto">
                        <thead className="bg-gray-50">
                          <tr>
                            {columnsItems.map((column, index) => (
                              <th
                                key={index}
                                scope="col"
                                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold uppercase text-slate-500 sm:pl-6"
                              >
                                {column.Header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {menuItems?.map((row, index) => (
                            <tr key={index}>
                              {columnsItems.map((column, index) => {
                                const cell = row[column.accessor]
                                const element = column.Cell?.(cell) ?? cell
                                return <td key={index}>{element}</td>
                              })}
                              <td className="relative flex py-4 pl-3 pr-4 space-x-2 text-sm font-medium text-right whitespace-nowrap sm:pr-6">
                                <button
                                  type="button"
                                  className="inline-flex items-center p-3 text-white bg-red-500 border border-transparent rounded-full shadow-sm hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                >
                                  <RiDeleteRow
                                    className="w-4 h-4"
                                    aria-hidden="true"
                                  />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  )
}

export default ItemsList
