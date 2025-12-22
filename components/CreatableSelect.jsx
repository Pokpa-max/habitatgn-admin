import { Controller, useFormContext } from 'react-hook-form'
import CreatableSelect from 'react-select/creatable'

const CreatableOnSelect = ({
  options,
  control,
  name,
  required = false,
  inputStyle,
  ...nextProps
}) => {
  const methods = useFormContext()
  const controlToUse = control || methods?.control
  if (!controlToUse) {
    return (
      <CreatableSelect
        isClearable
        onChange={() => {}}
        options={options}
        styles={{
          input: (base) => ({
            ...base,
            'input:focus': {
              boxShadow: 'none',
            },

            height: '1.875rem',
            ...inputStyle,
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
              border: '1px solid #d1d5db',
            },
            boxShadow: 'none',
          }),
        }}
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
          <CreatableSelect
            isClearable
            onChange={onChange}
            options={options}
            styles={{
              input: (base) => ({
                ...base,
                'input:focus': {
                  boxShadow: 'none',
                },

                height: '1.875rem',
                ...inputStyle,
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
                  border: '1px solid #d1d5db',
                },
                boxShadow: 'none',
              }),
            }}
            onBlur={onBlur}
            value={value}
            {...nextProps}
          />
        )
      }}
    />
  )
}

export default CreatableOnSelect
