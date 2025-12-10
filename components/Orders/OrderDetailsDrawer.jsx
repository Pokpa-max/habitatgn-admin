import React, { useState } from 'react'
import { RiDownload2Line, RiDownloadLine, RiMailLine } from 'react-icons/ri'
import {
  firebaseDateFormat,
  firebaseHour,
  getCurrentDate,
  getCurrentHour,
} from '../../utils/date'
import OrderGoogleMaps from '../OrderGoogleMap'
import SimpleDrawer from '../SimpleDrawer'
import PaymentDetailsModal from './PaymentDetailsModal'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const statuses = [
  <p className="w-min whitespace-nowrap rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-500">
    En cours de confirmation
  </p>,
  <p className="w-min whitespace-nowrap rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-500">
    En cours de préparation
  </p>,
  <p className="bg-orange-1 w-min00 whitespace-nowrap rounded-full px-2 py-1 text-xs text-orange-500">
    En cours de livraison
  </p>,
  <p className="w-min whitespace-nowrap rounded-full bg-green-100 px-2 py-1 text-xs text-green-500">
    Commande terminé
  </p>,
  <p className="w-min whitespace-nowrap rounded-full bg-red-100 px-2 py-1 text-xs text-red-500">
    Rejete par le restaurant
  </p>,
  <p className="w-min whitespace-nowrap rounded-full bg-red-100 px-2 py-1 text-xs text-red-500">
    Commande annulé
  </p>,
  <p className="w-min whitespace-nowrap rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-500">
    Pres pour recupération
  </p>,
]

function OrderDetailsDrawer({ order, open, setOpen }) {
  const [openPaymentDetailsModal, setOpenPaymentDetailsModal] = useState(false)

  return (
    <>
      <PaymentDetailsModal
        open={openPaymentDetailsModal}
        setOpen={setOpenPaymentDetailsModal}
        order={order}
      />
      <SimpleDrawer
        open={open}
        setOpen={setOpen}
        title={'Details de la commande'}
        footerButtons={
          <button
            type="button"
            className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => setOpen(false)}
          >
            Fermer
          </button>
        }
      >
        <div className="mt-2 md:col-span-2 md:mt-0">
          <div className="space-y-6 bg-white px-6 py-2 ">
            <OrderDetailsHeader
              order={order}
              setOpenPaymentDetailsModal={setOpenPaymentDetailsModal}
            />
            <div className="flex items-end justify-between">
              <div className="">
                <p className="text-xs text-gray-500">Commande effectué avec </p>
                <p className="text-xl">
                  {order?.restaurantName} /
                  <span className="ml-2 text-xs text-gray-500">
                    {order?.restaurantId}
                  </span>
                </p>
              </div>
              <div className="space-x-2">
                <button className="rounded-full bg-gray-100 p-2 hover:bg-gray-200">
                  <RiDownloadLine className="" />
                </button>
                <button className="rounded-full bg-gray-100 p-2 hover:bg-gray-200">
                  <RiMailLine className="" />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <p>Recapitulatif de la commande</p>
              <div className="space-y-2 px-4 text-gray-500">
                {order?.products?.map((item, idx) => (
                  <div
                    key={item?.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <p>{item?.quantity} x</p>
                    <div className="flex w-3/5 justify-start">
                      <p>{item?.alias}</p>
                    </div>
                    <p>{item?.price} GNF</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 ">
              <div className="flex justify-between">
                <p className="">Sous total</p>
                <p className="">{order?.total} GNF</p>
              </div>
              <div className="flex justify-between">
                <p className="">Frais de livraison</p>
                <p className="">20 000 GNF</p>
              </div>
              <div className="mb-1 flex justify-between border-b pb-1">
                <p className="">Frais de service</p>
                <p className="">2 000 GNF</p>
              </div>
              <div className="flex justify-between">
                <p className="">Total facture</p>
                <p className="">779 000 GNF</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Note</p>
              <p className="text-sm ">{order?.orderNote}</p>
            </div>
            <div className="mb-4 space-y-2">
              <p className="text-gray-500">Itineraire de livraison</p>
              <OrderGoogleMaps
                latLng={order?.pickupLocation?.latLng}
                deliveryLg={order?.deliveryLocation?.latLng}
              />
              <button
                type="button"
                className="border border-gray-300 bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Montrer itineraire
              </button>
            </div>
          </div>
        </div>
      </SimpleDrawer>
    </>
  )
}

function OrderDetailsHeader({ order, setOpenPaymentDetailsModal }) {
  return (
    <div className="space-y-4 border-b pb-5">
      <div className="flex w-full items-end justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between space-x-4">
            <td className="text-sm text-gray-500 ">Commande</td>
            <p className="rounded-full bg-orange-100 px-1 text-sm text-orange-500">
              #FD45GBD
            </p>
          </div>
          <div className="flex items-center justify-between space-x-4">
            <td className="text-sm text-gray-500 ">Avancement</td>
            {statuses[order?.status]}
          </div>
          <div className="flex items-center justify-between space-x-4">
            <td className="text-sm text-gray-500 ">Etat</td>
            <span
              className={classNames(
                order?.completed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800',
                'inline-flex items-center rounded-full  px-2.5 py-0.5 text-xs font-medium '
              )}
            >
              <svg
                className={classNames(
                  order?.completed ? 'text-green-400' : 'text-red-400',
                  '-ml-0.5 mr-1.5 h-2 w-2 '
                )}
                fill="currentColor"
                viewBox="0 0 8 8"
              >
                <circle cx={4} cy={4} r={3} />
              </svg>
              {order?.completed ? 'Terminé' : 'En cour'}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-end justify-between space-x-4">
            <td className="text-sm text-gray-500 ">Client</td>
            <div className="flex flex-col items-start">
              <p className="text-sm">Ousmane Diallo</p>
              <p className="text-xs text-gray-400">{order?.userId}</p>
            </div>
          </div>
          <div className="flex items-center justify-between space-x-4">
            <td className="text-sm text-gray-500 ">Total Facture</td>
            <p>{order?.total} GNF</p>
          </div>
          <div className="flex items-center justify-between space-x-4">
            <td className="text-sm text-gray-500 ">Paiement</td>
            <p className="w-min whitespace-nowrap rounded-full bg-sky-100 px-2 py-1 text-xs uppercase text-sky-500">
              Ecobank pay
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between space-x-4">
        <div className="text-xs text-gray-500">
          <p className="">
            Commande faite le
            <span className="ml-2 text-gray-900">
              {firebaseDateFormat(order?.createdAt)}
            </span>
          </p>
          <p>
            Heure
            <span className="ml-2 text-gray-900">
              {firebaseHour(order?.createdAt)}
            </span>
          </p>
        </div>
        <button
          onClick={() => setOpenPaymentDetailsModal(true)}
          className="w-min whitespace-nowrap rounded-sm bg-slate-100 px-2 py-2 text-xs uppercase text-gray-700 hover:bg-slate-200"
        >
          Voir details paiement
        </button>
      </div>
    </div>
  )
}

export default OrderDetailsDrawer
