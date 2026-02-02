import { serverTimestamp } from 'firebase/firestore'

export const landConstructorCreate = ({
    area,
    price,
    // Common fields
    phoneNumber,
    section,
    imageUrl,
    houseType, // usually "Terrain"
    description,
    long,
    lat,
    houseInsides,
    zone,
    offerType, // usually "Vendre"
    isAvailable,
    userId,
    town,
}) => {
    // Normalize select objects
    const commune = zone && zone.label && zone.value ? { label: zone.label, value: zone.value, lat: Number(lat) || 0, long: Number(long) || 0 } : zone || null
    const quartier = section && section.label && section.value ? { label: section.label, value: section.value } : section || null
    const townObj = town && town.label && town.value ? { label: town.label, value: town.value } : { label: 'Conakry', value: 'conakry' }

    return {
        // Specific Land fields
        area: Number(area) || 0,
        price: Number(price) || 0,

        // Common fields
        phoneNumber,
        isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
        address: {
            commune: commune,
            town: townObj,
            // Fix: save section/quartier correctly so it can be reloaded
            section: quartier,
            zone: quartier ? quartier.value : '',
            lat: Number(lat) || 0,
            long: Number(long) || 0,
        },
        zone: quartier ? quartier.value : '', // Structure shows separate zone field as well? "zone": "Tanerie"

        offerType: offerType && offerType.value ? { label: offerType.label, value: offerType.value } : offerType,
        imageUrl: imageUrl,
        description: description,
        houseType: houseType && houseType.value ? { label: houseType.label, value: houseType.value } : houseType,
        houseInsides: houseInsides,

        type: 'land',
        userId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    }
}

export const autoFillLandForm = (reset, setValue, data) => {
    if (!data) {
        reset()
        return
    }

    const {
        address,
        area,
        price,
        phoneNumber,
        isAvailable,
        imageUrl,
        description,
        houseType,
        offerType,
        houseInsides
    } = data

    const addr = address || data.address || {}

    setValue('description', description)
    setValue('area', area)
    setValue('price', price)

    setValue('offerType', { value: offerType?.value, label: offerType?.value })
    const displayPhone = phoneNumber ? String(phoneNumber).replace(/^(?:\+224|00224)/, '') : undefined
    setValue('phoneNumber', displayPhone)

    setValue('houseType', houseType && houseType.value ? { value: houseType.value, label: houseType.label } : houseType)

    // Address fields
    const sectionValue = addr?.section
        ? (addr.section.value || addr.section)
        : (typeof addr?.zone === 'string' ? addr.zone : undefined)

    setValue('section', sectionValue ? { value: sectionValue, label: sectionValue } : undefined)
    setValue('long', Number(addr?.long))
    setValue('lat', Number(addr?.lat))
    setValue('zone', addr?.commune ? { value: addr?.commune.value || addr?.zone, label: addr?.commune.label || addr?.zone } : addr?.zone ? { value: addr.zone, label: addr.zone } : undefined)

    setValue('isAvailable', isAvailable)
    setValue('imageUrl', imageUrl)
    setValue('houseInsides', houseInsides)

    // Town
    setValue('town', data?.address?.town ? { value: data.address.town.value, label: data.address.town.label } : undefined)
}
