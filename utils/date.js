import fr from 'date-fns/locale/fr'
import { Timestamp } from '@firebase/firestore'
import fetcher from "./fetcher";
import { format, formatDistance, differenceInCalendarDays } from 'date-fns'

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

export const timeSince = (firebaseDate) => {
  const date = firebaseDateToJsDate(firebaseDate)
  if (!date) return ''
  try {
    return formatDistance(date, new Date(), { addSuffix: true, locale: fr })
  } catch (e) {
    console.error('timeSince error:', e, { firebaseDate, date })
    return ''
  }
}

export const timeBetween = (firebaseDateStart, firebaseDateEnd) => {
  const dateStart = firebaseDateToJsDate(firebaseDateStart)
  const dateEnd = firebaseDateToJsDate(firebaseDateEnd)
  if (!dateStart || !dateEnd) return 0
  try {
    return differenceInCalendarDays(dateEnd, dateStart)
  } catch (e) {
    console.error('timeBetween error:', e, { firebaseDateStart, firebaseDateEnd })
    return 0
  }
}


const firebaseDateToTimestamp = (firebaseDate) => {
  let { _seconds, _nanoseconds } = firebaseDate

  if (!_seconds) {
    ; (_seconds = firebaseDate.seconds),
      (_nanoseconds = firebaseDate.nanoseconds)
  }

  const timestamp = new Timestamp(_seconds, _nanoseconds)
  return timestamp.toDate()
}

export const getCurrentDateOnline = async () => {
  const data = await fetcher("/api/infos/getDate");
  return Timestamp.fromDate(new Date(data.date));
};


export const getOnlineDate = async () => {
  const data = await fetcher(
    'https://www.timeapi.io/api/Time/current/zone?timeZone=Africa/Conakry'
  )
  return data.date
}

export const getCurrentDate = () => {
  const date = new Date()
  return format(date, 'PP', { locale: fr })
}

export const getCurrentHour = () => {
  const date = new Date()
  return format(date, 'HH:MM', { locale: fr })
}

export const firebaseHour = (data) => {
  var date = new Date(0);
  date.setSeconds(data?.seconds);
  var timeString = date.toISOString().substring(11, 19);
  return timeString
}

export const firebaseDateHour = (data) => {

  let options = { hour: "2-digit", minute: "2-digit", year: "numeric", month: "short", day: "numeric", weekday: "long", };
  let dateHoure = new Date(data?.seconds * 1000).toLocaleDateString("fr-FR", options);
  return dateHoure;

}





export const firebaseDateToJsDate = (firebaseDate) => {
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

export const firebaseDateFormatWithoutFormat = (date) =>
  firebaseDateToJsDate(date)
