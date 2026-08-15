import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { RiCloseLine } from 'react-icons/ri'
import { useColors } from '../contexts/ColorContext'

export default function DrawerForm({
  title,
  description,
  open,
  setOpen,
  footerButtons,
  children,
  onSubmit,
  maxWidth = 'max-w-2xl',
}) {
  const colors = useColors()

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-hidden"
        onClose={setOpen}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-16">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-500 sm:duration-500"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-500 sm:duration-500"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className={`pointer-events-auto w-screen ${maxWidth}`}>
                <form
                  onSubmit={onSubmit}
                  className="flex h-full flex-col overflow-hidden bg-white shadow-2xl sm:rounded-l-2xl"
                >
                  <div className="relative border-b border-gray-100 bg-white px-6 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-7 w-1.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: colors.primary }}
                        />
                        <div>
                          <Dialog.Title className="text-lg font-bold tracking-tight text-gray-900">
                            {title}
                          </Dialog.Title>
                          {description && (
                            <p className="mt-0.5 text-sm text-gray-500">
                              {description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center">
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
                          onClick={() => setOpen(false)}
                        >
                          <span className="sr-only">Fermer</span>
                          <RiCloseLine className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-white p-6">
                    {children}
                  </div>
                  <div className="flex flex-shrink-0 justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
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
