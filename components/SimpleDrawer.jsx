import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { RiCloseFill } from 'react-icons/ri'

export default function SimpleDrawer({
  title,
  description,
  open,
  setOpen,
  footerButtons,
  children,
}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 overflow-hidden"
        onClose={setOpen}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Dialog.Overlay className="absolute inset-0 transition-opacity bg-gray-500 bg-opacity-75" />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none sm:pl-16">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-500 sm:duration-500"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-500 sm:duration-500"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="w-screen max-w-2xl pointer-events-auto">
                <div className="flex flex-col h-full bg-white divide-y divide-gray-200 shadow-xl">
                  <div className="flex-1 h-0 overflow-y-auto">
                    <div className="px-4 py-6 bg-primary-500 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-xl font-bold text-white">
                          {title}
                        </Dialog.Title>
                        <div className="flex items-center ml-3 h-7">
                          <button
                            type="button"
                            className="bg-white text-primary-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white "
                            onClick={() => setOpen(false)}
                          >
                            <span className="sr-only">Close panel</span>
                            <RiCloseFill
                              className="w-6 h-6"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm italic font-light text-white">
                          {description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between flex-1">
                      {children}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end flex-shrink-0 px-4 py-4">
                  {footerButtons}
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
