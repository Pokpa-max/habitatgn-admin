import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'
import { useColors } from '../contexts/ColorContext'

const SimpleSelect = ({
  options,
  control,
  name,
  required = false,
  creatable = false,
  ...nextProps
}) => {
  const methods = useFormContext()
  const controlToUse = control || methods?.control
  const colors = useColors()
  const SelectComponent = creatable ? CreatableSelect : Select

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
    singleValue: (base) => ({
      ...base,
      color: colors.gray900,
      fontSize: '0.95rem',
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
    // Defensive fallback: render an uncontrolled select if no control is available
    return (
      <SelectComponent
        isClearable
        styles={customStyles}
        options={options}
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
            onChange={onChange}
            onBlur={onBlur}
            value={value}
            {...nextProps}
          />
        )
      }}
    />
  )
}

export default SimpleSelect
