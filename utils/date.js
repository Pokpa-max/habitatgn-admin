import fr from 'date-fns/locale/fr'
import fetcher from "./fetcher";
import { format } from 'date-fns'

export const firebaseDateFormat = (date, formatString = 'PP') => {
  const convertedDate = firebaseDateToJsDate(date)
  if (!convertedDate) return ''
  try {
    return format(convertedDate, formatString, { locale: fr })
  } catch (e) {
    console.error('firebaseDateFormat error:', e, { date, convertedDate })
    return ''
  }
}

export const getOnlineDate = async () => {
  const data = await fetcher(
    'https://www.timeapi.io/api/Time/current/zone?timeZone=Africa/Conakry'
  )
  return data.date
}

const firebaseDateToJsDate = (firebaseDate) => {
  if (!firebaseDate) return null

  // Already a native Date
  if (firebaseDate instanceof Date) return firebaseDate

  // Firestore Timestamp instance
  if (firebaseDate && typeof firebaseDate.toDate === 'function') {
    try {
      const dt = firebaseDate.toDate()
      if (dt instanceof Date && !isNaN(dt.getTime())) return dt
    } catch (e) {
      // fallthrough
    }
  }

  // Firestore-like plain object with _seconds or seconds
  const seconds = firebaseDate?._seconds ?? firebaseDate?.seconds
  const nanoseconds = firebaseDate?._nanoseconds ?? firebaseDate?.nanoseconds
  if (typeof seconds === 'number') {
    const ms = seconds * 1000 + Math.floor((nanoseconds || 0) / 1e6)
    const dt = new Date(ms)
    if (!isNaN(dt.getTime())) return dt
  }

  // Numeric value (could be seconds or milliseconds)
  if (typeof firebaseDate === 'number') {
    const dt = new Date(firebaseDate > 1e12 ? firebaseDate : firebaseDate * 1000)
    if (!isNaN(dt.getTime())) return dt
  }

  // String parse
  const parsed = new Date(firebaseDate)
  if (!isNaN(parsed.getTime())) return parsed

  // Fallback
  return null
}

