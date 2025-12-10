import React from 'react'
import { Controller } from 'react-hook-form'
import Select from 'react-select'

const SimpleSelect = ({
  options,
  control,
  name,
  required = false,
  ...nextProps
}) => (
  <Controller
    name={name}
    rules={{ required }}
    control={control}
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
              border: state.isFocused ? '2px solid #000' : '1px solid #d1d5db',
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

export default SimpleSelect
