// Entity constructor for the data model

export const getObjectInString = (str) => {
  return JSON.parse(str.substring(str.indexOf('{'), str.lastIndexOf('}') + 1))
}

