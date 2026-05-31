const APP_TIME_ZONE = 'Asia/Bangkok'

function getBangkokDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)

  return {
    year: parts.find(part => part.type === 'year')?.value || '',
    month: parts.find(part => part.type === 'month')?.value || '',
    day: parts.find(part => part.type === 'day')?.value || ''
  }
}

export function toLocalDateKey(date = new Date()) {
  const { year, month, day } = getBangkokDateParts(date)

  return `${year}-${month}-${day}`
}

export function getLastLocalDays(count: number) {
  const days: Array<{ date: string; label: string }> = []
  const today = getBangkokDateParts(new Date())
  const bangkokNoon = Date.UTC(
    Number(today.year),
    Number(today.month) - 1,
    Number(today.day),
    12
  )

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(bangkokNoon - i * 24 * 60 * 60 * 1000)
    const { month, day } = getBangkokDateParts(date)

    days.push({
      date: toLocalDateKey(date),
      label: `${Number(month)}/${Number(day)}`
    })
  }

  return days
}
