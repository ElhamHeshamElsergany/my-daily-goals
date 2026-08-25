export function todayKey(now = new Date()): string {
  return toDateKey(now)
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(key: string, amount: number): string {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + amount)
  return toDateKey(date)
}

export function weekdayName(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, { weekday: 'long' })
}

export function fullDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function shortWeekday(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, { weekday: 'narrow' })
}

export function dayNumber(key: string): string {
  return String(parseDateKey(key).getDate())
}

export function startOfWeek(key: string): string {
  const date = parseDateKey(key)
  const weekday = date.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  date.setDate(date.getDate() + mondayOffset)
  return toDateKey(date)
}

export function weekKeys(key: string): string[] {
  const start = startOfWeek(key)
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}
