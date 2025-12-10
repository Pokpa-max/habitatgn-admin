import AsyncSelect from 'react-select/async'

import React from 'react'
import { searchForSelect } from '@/lib/algolia'
import debounce from 'debounce-promise'
import { Controller } from 'react-hook-form'
export default function AlgoliaSelect({
  indexName,
  placeholder,
  formatData,
  defaultOptions,
  searchOptions,
  selectOptions,
  control,
  required = false,
  name,
}) {
  const debounceFunc = debounce(
    async (inputValue) =>
      searchForSelect(inputValue, indexName, formatData, searchOptions),
    800
  )

  return (
    <Controller
      name={name}
      rules={{ required }}
      control={control}
      render={({ field: { value, onChange, onBlur } }) => {
        return (
          <AsyncSelect
            {...selectOptions}
            onBlur={onBlur}
            defaultOptions={defaultOptions}
            placeholder={placeholder}
            isClearable
            value={value}
            loadOptions={debounceFunc}
            onChange={onChange}
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
          />
        )
      }}
    />
  )
}

AlgoliaSelect.defaultProps = {
  defaultOptions: false,
}
