// export default DesableConfirmModal
import { Fragment, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { RiFolderWarningLine, RiCheckLine, RiCloseLine } from 'react-icons/ri'
import { useColors } from '../contexts/ColorContext'

function DesableConfirmModal({
  title,
  open,
  setOpen,
  confirmFunction,
  desable,
}) {
  const cancelButtonRef = useRef(null)
  const colors = useColors()

  return (
    <>
      <style>{`
        .modal-content {
          background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
        }

        .modal-header {
          background-color: ${desable ? '#fee2e2' : '#dcfce7'};
          border-bottom: 2px solid ${desable ? '#fecaca' : '#bbf7d0'};
        }

        .modal-icon-wrapper {
          background-color: ${desable ? 'rgba(220, 38, 38, 0.1)' : 'rgba(34, 197, 94, 0.1)'};
          border: 2px solid ${desable ? 'rgba(220, 38, 38, 0.2)' : 'rgba(34, 197, 94, 0.2)'};
        }

        .modal-icon {
          color: ${desable ? '#dc2626' : '#16a34a'};
        }

        .modal-title {
          color: ${colors.gray900 || '#111827'};
          font-weight: 700;
          font-size: 1.125rem;
        }

        .modal-description {
          color: ${colors.gray600 || '#4b5563'};
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .modal-footer {
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
          padding: 1.25rem 1.5rem;
        }

        .btn-confirm {
          background-color: ${desable ? '#dc2626' : colors.primary || '#3b82f6'};
          transition: all 0.3s ease;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-confirm:hover {
          background-color: ${desable ? '#b91c1c' : colors.primary ? colors.primary.replace(')', ', 0.9)').replace('rgb', 'rgba') : 'rgba(59, 130, 246, 0.9)'};
          box-shadow: 0 4px 12px ${desable ? 'rgba(220, 38, 38, 0.2)' : 'rgba(59, 130, 246, 0.2)'};
          transform: translateY(-1px);
        }

        .btn-cancel {
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          color: ${colors.gray700 || '#374151'};
          transition: all 0.3s ease;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-cancel:hover {
          background-color: #e5e7eb;
          border-color: ${colors.gray400 || '#9ca3af'};
        }
      `}</style>

      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          initialFocus={cancelButtonRef}
          onClose={setOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="modal-content relative transform overflow-hidden rounded-lg shadow-xl transition-all sm:w-full sm:max-w-md">
                  {/* Header */}
                  <div className="modal-header px-6 py-5">
                    <div className="flex items-start gap-4">
                      <div className="modal-icon-wrapper flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg">
                        <RiFolderWarningLine
                          className="modal-icon h-6 w-6"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex-1">
                        <Dialog.Title className="modal-title">
                          {title}
                        </Dialog.Title>
                        <p className="modal-description mt-2">
                          {`Voulez-vous ${
                            desable ? 'Désactiver' : 'Activer'
                          } ce compte ?`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="modal-footer flex gap-3 sm:flex-row-reverse">
                    <button
                      type="button"
                      className="btn-confirm justify-center rounded-lg border border-transparent px-5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: desable ? '#dc2626' : colors.primary ,
                        focusRingColor: desable ? '#dc2626' : colors.primary ,
                      }}
                      onClick={() => confirmFunction()}
                    >
                      {desable ? (
                        <>
                          <RiFolderWarningLine className="h-4 w-4" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <RiCheckLine className="h-4 w-4" />
                          Activer
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn-cancel justify-center rounded-lg px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        focusRingColor: colors.primary ,
                      }}
                      onClick={() => setOpen(false)}
                      ref={cancelButtonRef}
                    >
                      <RiCloseLine className="h-4 w-4" />
                      Annuler
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}

export default DesableConfirmModal