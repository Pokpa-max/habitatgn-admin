import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import Select from 'react-select'

const SimpleSelect = ({
  options,
  control,
  name,
  required = false,
  ...nextProps
}) => {
  const methods = useFormContext()
  const controlToUse = control || methods?.control
  if (!controlToUse) {
    // Defensive fallback: render an uncontrolled select if no control is available
    return (
      <Select
        isClearable
        styles={{
          input: (base) => ({
            ...base,
            'input:focus': {
              boxShadow: 'none',
            },
            height: '2rem',
          }),
          placeholder: (base) => ({
            ...base,
            fontSize: '14px',
          }),
          control: (base, state) => ({
            ...base,
            border: state.isFocused ? '2px solid #000' : '1px solid #d1d5db',
            borderRadius: '0.125rem',
            '&:hover': {
              border: '1px solid #000',
            },
            boxShadow: 'none',
          }),
        }}
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
          <Select
            isClearable
            styles={{
              input: (base) => ({
                ...base,
                'input:focus': {
                  boxShadow: 'none',
                },
                height: '2rem',
              }),
              placeholder: (base) => ({
                ...base,
                fontSize: '14px',
              }),
              control: (base, state) => ({
                ...base,
                border: state.isFocused
                  ? '2px solid #000'
                  : '1px solid #d1d5db',
                borderRadius: '0.125rem',
                '&:hover': {
                  border: '1px solid #000',
                },
                boxShadow: 'none',
              }),
            }}
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
