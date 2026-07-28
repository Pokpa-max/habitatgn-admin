import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'
import { useColors } from '../contexts/ColorContext'

const MultiSelect = ({
  options,
  required = false,
  control,
  name,
  creatable = false,
  ...nextProps
}) => {
  const methods = useFormContext()
  const controlToUse = control || methods?.control
  const SelectComponent = creatable ? CreatableSelect : Select
  const colors = useColors()

  const customStyles = {
    input: (base) => ({
      ...base,
      'input:focus': {
        boxShadow: 'none',
      },
      height: 'auto',
      padding: '0.1rem 0',
    }),
    placeholder: (base) => ({
      ...base,
      color: colors.gray400,
      fontSize: '0.95rem',
    }),
    control: (base, state) => ({
      ...base,
      border: state.isFocused
        ? `1px solid ${colors.gray900}`
        : `1px solid ${colors.gray300}`,
      borderRadius: '0.5rem',
      backgroundColor: '#fff',
      padding: '0.1rem',
      boxShadow: 'none',
      '&:hover': {
        border: `1px solid ${colors.gray900}`,
      },
      transition: 'all 0.2s ease-in-out',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: colors.gray100,
      borderRadius: '0.25rem',
      border: `1px solid ${colors.gray200}`,
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: colors.gray800,
      fontWeight: 500,
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: colors.gray500,
      ':hover': {
        backgroundColor: colors.gray200,
        color: colors.error,
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.5rem',
      zIndex: 100,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? colors.gray900
        : state.isFocused
        ? colors.gray100
        : undefined,
      color: state.isSelected ? 'white' : colors.gray900,
      cursor: 'pointer',
      ':active': {
        ...base[':active'],
        backgroundColor: colors.gray200,
      },
    }),
  }

  if (!controlToUse) {
    return (
      <SelectComponent
        isClearable
        styles={customStyles}
        options={options}
        isMulti={true}
        defaultValue={null}
        {...nextProps}
      />
    )
  }

  return (
    <Controller
      name={name}
      rules={{ required }}
      control={controlToUse}
      render={({ field: { value, onChange, onBlur } }) => {
        return (
          <SelectComponent
            isClearable
            styles={customStyles}
            options={options}
            onChange={(newValue) => {
              // For creatable, newValue contains objects { label, value, __isNew__: true }
              // The original logic just mapped to values: onChange(options?.map((option) => option.value))
              // We need to handle created options. Usually we persist them or just pass the value string.
              // If we just pass the string value for new items, the backend needs to handle it.
              // Assuming the backend just stores strings for amenities since it was a simple selection before?
              // Let's check `HouseFormDrawer`... it passes `commodites` options.
              // If I just pass value, the new item value is likely the same as label.

              if (!newValue) {
                onChange([])
                return
              }
              const values = newValue.map((option) => option.value)
              onChange(values)
            }}
            isMulti={true}
            onBlur={onBlur}
            // Value reconstruction: we need to map selected strings back to option objects.
            // For new items that aren't in `options`, we need to create temporary option objects so they show up.
            value={
               value?.map(val => {
                 const found = options.find(opt => opt.value === val);
                 return found || { label: val, value: val };
               })
            }
            defaultValue={null}
            {...nextProps}
          />
        )
      }}
    />
  )
}

export default MultiSelect

