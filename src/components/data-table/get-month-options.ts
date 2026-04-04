export function getMonthOptions(year?: number) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const currentYear = year ?? new Date().getFullYear()

  return months.map((month, index) => ({
    label: `${month} ${currentYear}`,
    value: `${currentYear}-${String(index + 1).padStart(2, '0')}`,
  }))
}
