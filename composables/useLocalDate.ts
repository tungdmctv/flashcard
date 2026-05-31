export function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getLastLocalDays(count: number) {
  const days: Array<{ date: string; label: string }> = []

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - i)

    days.push({
      date: toLocalDateKey(date),
      label: `${date.getMonth() + 1}/${date.getDate()}`
    })
  }

  return days
}
