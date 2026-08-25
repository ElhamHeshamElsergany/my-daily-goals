import { addDays } from './dates.ts'

export type Goal = {
  id: string
  text: string
  done: boolean
}

export type Store = {
  days: Record<string, Goal[]>
}

const STORAGE_KEY = 'today-goals.v1'

const emptyStore = (): Store => ({ days: {} })

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as Store
    if (!parsed || typeof parsed !== 'object' || !parsed.days) return emptyStore()
    return parsed
  } catch {
    return emptyStore()
  }
}

export function saveStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function goalsFor(store: Store, dateKey: string): Goal[] {
  return store.days[dateKey] ?? []
}

export function setGoals(store: Store, dateKey: string, goals: Goal[]): Store {
  const next = { days: { ...store.days, [dateKey]: goals } }
  if (goals.length === 0) {
    delete next.days[dateKey]
  }
  return next
}

export function isPerfectDay(store: Store, dateKey: string): boolean {
  const goals = goalsFor(store, dateKey)
  return goals.length > 0 && goals.every((goal) => goal.done)
}

export function hasAnyGoals(store: Store, dateKey: string): boolean {
  return goalsFor(store, dateKey).length > 0
}

export function currentStreak(store: Store, today: string): number {
  let cursor = isPerfectDay(store, today) ? today : addDays(today, -1)
  let count = 0

  while (isPerfectDay(store, cursor)) {
    count += 1
    cursor = addDays(cursor, -1)
    if (count > 400) break
  }

  return count
}
