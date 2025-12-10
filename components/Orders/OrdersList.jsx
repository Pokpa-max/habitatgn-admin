import React, { useState } from 'react'
import { RiFileCopy2Line } from 'react-icons/ri'
import { columnsOrder } from './_dataTable'
import OrderDetailsDrawer from './OrderDetailsDrawer'
import PaginationButton from './PaginationButton'

function OrdersList({
  data,
  orders,
  showMore,
  pagination,
  isLoading,
  isLoadingP,
}) {
  const [selectedOrder, setSelectedOrder] = useState(null)

  return (
    <OrdersTable
      selectedOrder={selectedOrder}
      setSelectedOrder={setSelectedOrder}
      data={data}
      newOrders={orders}
      showMore={showMore}
      pagination={pagination}
      isLoading={isLoading}
      // isLoading={isLoadingP || isLoading}
      isLoadingP={isLoadingP}
    />
  )
}

function OrdersTable({
  selectedOrder,
  setSelectedOrder,
  data,
  isLoading,
  isLoadingP,
  pagination,
  newOrders,
  showMore,
}) {
  const [openDrawer, setOpenDrawer] = useState(false)

  return isLoading ? (
    <OrderSkleton />
  ) : (
    <div className="">
      <OrderDetailsDrawer
        order={selectedOrder}
        open={openDrawer}
        setOpen={setOpenDrawer}
      />
      <div className="mt-4 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden ring-1 ring-black ring-opacity-5 md:rounded-sm">
              <table className="min-w-full table-auto divide-y divide-gray-300 text-left">
                <thead className="bg-gray-50">
                  <tr>
                    {columnsOrder.map((column, index) => (
                      <th
                        key={index}
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold uppercase text-slate-500 sm:pl-6"
                      >
                        {column.Header}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold uppercase text-slate-500 sm:pl-6"
                    >
                      <span className="sr-only">Modifier</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {newOrders?.map((row, index) => (
                    <tr key={index}>
                      {columnsOrder.map((column, index) => {
                        const cell = row[column.accessor]
                        const element = column.Cell?.(cell) ?? cell
                        return <td key={index}>{element}</td>
                      })}
                      <td className="relative flex space-x-2 whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => {
                            setSelectedOrder(row)
                            setOpenDrawer(true)
                          }}
                          type="button"
                          className="text-black-900 inline-flex items-center rounded-full border border-transparent bg-gray-200 p-3 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          <RiFileCopy2Line
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <p className="mt-5">{newOrders.length + ' Commandes'}</p>
              {pagination && newOrders.length > 0 && (
                <PaginationButton getmoreData={showMore} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrdersList

export function OrderSkleton() {
  return (
    <div class="animate-pulse">
      <div class="mt-3 mb-6 h-4 rounded bg-gray-200"></div>
      <div class="mb-6 h-4 rounded bg-gray-300"></div>
      <div class="mb-6 h-4 rounded bg-gray-200"></div>
      <div class="mb-6 h-4 rounded bg-gray-300"></div>
      <div class="mb-6 h-4 rounded bg-gray-200"></div>
      <div class="mt-3 mb-6 h-4 rounded bg-gray-200"></div>
      <div class="mb-6 h-4 rounded bg-gray-300"></div>
      <div class="mb-6 h-4 rounded bg-gray-200"></div>
      <div class="mb-6 h-4 rounded bg-gray-300"></div>
      <div class="mb-6 h-4 rounded bg-gray-200"></div>
    </div>
  )
}
