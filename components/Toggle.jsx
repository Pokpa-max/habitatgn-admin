import { Switch } from '@headlessui/react'
import { useEffect, useState } from 'react'
import { Controller } from 'react-hook-form'
import ConfirmModal from './ConfirmModal'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Toggle({
  control,
  name,
  setToggleValue,
  description = "Rendre accessible l'etablissement sur l'application B2C",
  title = 'Activer',
}) {
  const [openWarning, setOpenWarning] = useState(false) // modal state for active restaurant warning
  const [value, setValue] = useState(null)

  useEffect(() => {
    if (value !== null) {
      setOpenWarning(true)
    }
  }, [value])

  return (
    <>
      <ConfirmModal
        confirmFunction={async () => {
          setOpenWarning(false)
        }}
        cancelFuction={() => {
          setToggleValue(name, !value)
          setValue(null)
        }}
        description={
          value
            ? 'Veuillez bien verifier si toutes les informations sont valides avant d activer le restaurant'
            : 'Si vous deactivez ce restaurant, cet restaurant ne sera pas visible au niveau de l applicaton'
        }
        open={openWarning}
        setOpen={setOpenWarning}
      />

      <Switch.Group as="div" className="flex items-center justify-between">
        <span className="flex flex-grow flex-col">
          <Switch.Label
            as="span"
            className="text-sm font-medium text-gray-900 "
            passive
          >
            {title}
          </Switch.Label>
          <Switch.Description as="span" className="text-sm text-gray-500">
            {description}
          </Switch.Description>
        </span>
        <Controller
          control={control}
          name={name}
          defaultValue={false}
          render={({ field }) => {
            return (
              <Switch
                checked={field.value}
                onChange={(e) => {
                  setValue(e)
                  field.onChange(e)
                }}
                className={classNames(
                  field.value ? 'bg-primary' : 'bg-gray-200',
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                )}
              >
                <span
                  aria-hidden="true"
                  className={classNames(
                    field.value ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                  )}
                />
              </Switch>
            )
          }}
        />
      </Switch.Group>
    </>
  )
}
