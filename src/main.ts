import './style.css'
import {
  addDays,
  dayNumber,
  fullDate,
  shortWeekday,
  todayKey,
  weekKeys,
  weekdayName,
} from './dates.ts'
import {
  currentStreak,
  goalsFor,
  hasAnyGoals,
  isPerfectDay,
  loadStore,
  saveStore,
  setGoals,
  type Goal,
  type Store,
} from './storage.ts'

let store: Store = loadStore()
let selectedDate = todayKey()

const weekdayEl = document.querySelector<HTMLHeadingElement>('#weekday')!
const fullDateEl = document.querySelector<HTMLParagraphElement>('#full-date')!
const jumpTodayEl = document.querySelector<HTMLButtonElement>('#jump-today')!
const streakEl = document.querySelector<HTMLDivElement>('#streak')!
const streakCountEl = document.querySelector<HTMLSpanElement>('#streak-count')!
const weekEl = document.querySelector<HTMLElement>('#week')!
const progressCardEl = document.querySelector<HTMLElement>('#progress-card')!
const ringFgEl = document.querySelector<SVGPathElement>('#ring-fg')!
const progressKickerEl = document.querySelector<HTMLParagraphElement>('#progress-kicker')!
const progressCopyEl = document.querySelector<HTMLParagraphElement>('#progress-copy')!
const formEl = document.querySelector<HTMLFormElement>('#add-form')!
const inputEl = document.querySelector<HTMLInputElement>('#add-input')!
const goalsEl = document.querySelector<HTMLUListElement>('#goals')!
const emptyEl = document.querySelector<HTMLParagraphElement>('#empty')!

document.querySelector('#prev-day')!.addEventListener('click', () => {
  selectedDate = addDays(selectedDate, -1)
  render()
})

document.querySelector('#next-day')!.addEventListener('click', () => {
  selectedDate = addDays(selectedDate, 1)
  render()
})

jumpTodayEl.addEventListener('click', () => {
  selectedDate = todayKey()
  render()
  inputEl.focus()
})

formEl.addEventListener('submit', (event) => {
  event.preventDefault()
  const text = inputEl.value.trim()
  if (!text) return

  const goal: Goal = {
    id: crypto.randomUUID(),
    text,
    done: false,
  }

  persist(setGoals(store, selectedDate, [...goalsFor(store, selectedDate), goal]))
  inputEl.value = ''
  inputEl.focus()
})

goalsEl.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return

  const item = target.closest<HTMLLIElement>('[data-id]')
  if (!item?.dataset.id) return
  const id = item.dataset.id

  if (target.closest('[data-action="toggle"]')) {
    toggleGoal(id)
    return
  }

  if (target.closest('[data-action="delete"]')) {
    removeGoal(id)
  }
})

goalsEl.addEventListener('focusout', (event) => {
  const target = event.target
  if (!(target instanceof HTMLElement) || target.dataset.role !== 'text') return
  const item = target.closest<HTMLLIElement>('[data-id]')
  if (!item?.dataset.id) return
  commitEdit(item.dataset.id, target.textContent ?? '')
})

goalsEl.addEventListener('keydown', (event) => {
  const target = event.target
  if (!(target instanceof HTMLElement) || target.dataset.role !== 'text') return
  const item = target.closest<HTMLLIElement>('[data-id]')
  if (!item?.dataset.id) return

  if (event.key === 'Enter') {
    event.preventDefault()
    target.blur()
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    const goal = goalsFor(store, selectedDate).find((itemGoal) => itemGoal.id === item.dataset.id)
    target.textContent = goal?.text ?? ''
    target.blur()
  }
})

function persist(next: Store): void {
  store = next
  saveStore(store)
  render()
}

function toggleGoal(id: string): void {
  const goals = goalsFor(store, selectedDate).map((goal) =>
    goal.id === id ? { ...goal, done: !goal.done } : goal,
  )
  persist(setGoals(store, selectedDate, goals))
}

function removeGoal(id: string): void {
  const goals = goalsFor(store, selectedDate).filter((goal) => goal.id !== id)
  persist(setGoals(store, selectedDate, goals))
}

function commitEdit(id: string, raw: string): void {
  const current = goalsFor(store, selectedDate).find((goal) => goal.id === id)
  if (!current) return

  const text = raw.trim()
  if (!text) {
    removeGoal(id)
    return
  }

  if (current.text === text) return
  const goals = goalsFor(store, selectedDate).map((goal) =>
    goal.id === id ? { ...goal, text } : goal,
  )
  persist(setGoals(store, selectedDate, goals))
}

function render(): void {
  const today = todayKey()
  const goals = goalsFor(store, selectedDate)
  const doneCount = goals.filter((goal) => goal.done).length
  const percent = goals.length === 0 ? 0 : Math.round((doneCount / goals.length) * 100)
  const isToday = selectedDate === today
  const streak = currentStreak(store, today)

  weekdayEl.textContent = isToday ? 'Today' : weekdayName(selectedDate)
  fullDateEl.textContent = fullDate(selectedDate)
  jumpTodayEl.hidden = isToday

  if (streak > 0) {
    streakEl.hidden = false
    streakCountEl.textContent = String(streak)
  } else {
    streakEl.hidden = true
  }

  weekEl.innerHTML = weekKeys(selectedDate)
    .map((key) => {
      const selected = key === selectedDate
      const perfect = isPerfectDay(store, key)
      const active = hasAnyGoals(store, key)
      const classes = [
        'day',
        selected ? 'is-selected' : '',
        key === today ? 'is-today' : '',
        perfect ? 'is-perfect' : '',
        active && !perfect ? 'is-active' : '',
      ]
        .filter(Boolean)
        .join(' ')

      return `
        <button class="${classes}" type="button" data-date="${key}" ${selected ? 'aria-current="date"' : ''}>
          <span class="day-name">${escapeHtml(shortWeekday(key))}</span>
          <span class="day-num">${escapeHtml(dayNumber(key))}</span>
        </button>
      `
    })
    .join('')

  weekEl.querySelectorAll<HTMLButtonElement>('[data-date]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedDate = button.dataset.date ?? selectedDate
      render()
    })
  })

  ringFgEl.style.strokeDasharray = `${percent}, 100`
  ringFgEl.style.opacity = percent === 0 ? '0' : '1'
  progressCardEl.classList.toggle('is-complete', goals.length > 0 && doneCount === goals.length)

  if (goals.length === 0) {
    progressKickerEl.textContent = 'No goals yet'
    progressCopyEl.textContent = isToday
      ? 'Write what would make today count.'
      : 'Plan this day, or leave it empty.'
  } else if (doneCount === goals.length) {
    progressKickerEl.textContent = 'All done'
    progressCopyEl.textContent = isToday ? 'That’s the day. Well spent.' : 'This day is complete.'
  } else {
    progressKickerEl.textContent = `${doneCount} of ${goals.length} complete`
    progressCopyEl.textContent = `${percent}% of the day, still in motion.`
  }

  emptyEl.hidden = goals.length > 0
  goalsEl.innerHTML = goals
    .map(
      (goal) => `
        <li class="goal ${goal.done ? 'is-done' : ''}" data-id="${goal.id}">
          <button class="check" type="button" data-action="toggle" aria-label="${goal.done ? 'Mark incomplete' : 'Mark complete'}">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="10" cy="10" r="8" />
              <path d="M6.4 10.3 8.8 12.6 13.6 7.6" />
            </svg>
          </button>
          <span class="goal-text" data-role="text" contenteditable="true" spellcheck="true">${escapeHtml(goal.text)}</span>
          <button class="delete" type="button" data-action="delete" aria-label="Delete goal">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 7h10M10 7V5h4v2M9 7l.6 12h4.8L15 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </li>
      `,
    )
    .join('')
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return map[char] ?? char
  })
}

render()
inputEl.focus()
