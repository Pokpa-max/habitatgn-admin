import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { RiCloseLine } from 'react-icons/ri'

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
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full sm:pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-300 sm:duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200 sm:duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto flex h-full w-screen max-w-2xl flex-col bg-white shadow-2xl">
                  <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-5 py-5 sm:px-7">
                    <div className="min-w-0">
                      <Dialog.Title className="text-lg font-bold tracking-tight text-gray-900">
                        {title}
                      </Dialog.Title>
                      {description && (
                        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                          {description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="-mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                      onClick={() => setOpen(false)}
                      aria-label="Fermer"
                    >
                      <RiCloseLine className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </header>

                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {children}
                  </div>

                  {footerButtons && (
                    <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:px-7">
                      {footerButtons}
                    </footer>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
