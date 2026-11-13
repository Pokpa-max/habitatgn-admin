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
  variant = 'default',
  eyebrow,
}) {
  const colors = useColors()
  const detailStyle = variant === 'detail'

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
              <Dialog.Panel
                as="form"
                onSubmit={onSubmit}
                className={`pointer-events-auto flex h-full w-screen flex-col overflow-hidden bg-white shadow-2xl ${detailStyle ? 'sm:rounded-l-xl' : 'sm:rounded-l-2xl'} ${maxWidth}`}
              >
                <div className={`relative border-b px-5 py-5 sm:px-7 ${detailStyle ? 'border-gray-200 bg-white' : 'border-gray-100 bg-white'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      {detailStyle && eyebrow && (
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: colors.primary }}>
                          {eyebrow}
                        </p>
                      )}
                      <div>
                        <Dialog.Title className="text-lg font-bold tracking-tight text-gray-900">
                          {title}
                        </Dialog.Title>
                        {description && (
                          <p className="mt-1 text-sm leading-relaxed text-gray-500">
                            {description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center">
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                        onClick={() => setOpen(false)}
                        aria-label="Fermer"
                      >
                        <span className="sr-only">Fermer</span>
                        <RiCloseLine className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className={`min-h-0 flex-1 overflow-y-auto ${detailStyle ? 'bg-white' : 'bg-white p-6'}`}>
                  {children}
                </div>
                <div className={`flex shrink-0 flex-wrap items-center justify-end gap-2 border-t px-5 py-4 sm:px-7 ${detailStyle ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-white'}`}>
                  {footerButtons}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
