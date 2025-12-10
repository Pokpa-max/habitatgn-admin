import DynamicSelect from './AlgoliaSelect'

const defaultFormat = (data) => {
  const { restaurant, objectID, openHours } = data
  return {
    value: {
      id: objectID,
      name: restaurant.name,
      openHours,
      imageUrl: restaurant.imageUrl1000,
      imageHash: restaurant.imageHash,
    },
    label: restaurant.name,
  }
}

export const collectionFormatData = (data) => {
  const { restaurant, objectID } = data
  return {
    value: objectID,
    label: restaurant.name,
  }
}

export default function RestaurantSelect({
  control,
  required,
  selectOptions,
  formatData = defaultFormat,
  name = 'restaurant',
}) {
  return (
    <DynamicSelect
      placeholder="Selectionner le restaurant "
      indexName="restaurants"
      formatData={formatData}
      searchOptions={{ filters: 'isActive:true' }}
      selectOptions={selectOptions}
      control={control}
      name={name}
      required={required}
    />
  )
}
