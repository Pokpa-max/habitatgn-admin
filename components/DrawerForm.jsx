import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { RiCloseFill } from 'react-icons/ri'

export default function DrawerForm({
  title,
  description,
  open,
  setOpen,
  footerButtons,
  children,
  onSubmit,
}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 overflow-hidden"
        onClose={setOpen}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Dialog.Overlay className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-500 sm:duration-500"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-500 sm:duration-500"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="pointer-events-auto w-screen max-w-7xl">
                <form
                  onSubmit={onSubmit}
                  className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl"
                >
                  <div className="h-0 flex-1 overflow-y-auto">
                    <div className="bg-cyan-500 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-xl font-bold text-white">
                          {title}
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="text-primary-200 bg-white hover:text-white focus:outline-none focus:ring-2 focus:ring-white "
                            onClick={() => setOpen(false)}
                          >
                            <span className="sr-only">Close panel</span>
                            <RiCloseFill
                              className="h-6 w-6"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm font-light italic text-white">
                          {description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      {children}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 justify-end px-4 py-4">
                    {footerButtons}
                  </div>
                </form>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
