import { useMemo } from 'react'
import { parseISO, format, isSameMonth } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar2'
import type { RecordType } from '../data/schema'

type RecordsCalendarProps = {
  data: RecordType[]
  currentMonth: Date
  onMonthChange: (date: Date) => void
}

export function RecordsCalendar({ data, currentMonth, onMonthChange }: RecordsCalendarProps) {
  const timeByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of data) {
      const key = format(parseISO(r.date), 'yyyy-MM-dd')
      map.set(key, (map.get(key) ?? 0) + r.time_spent)
    }
    return map
  }, [data])

  const monthTotal = useMemo(() => {
    let total = 0
    for (const [dateKey, hours] of timeByDate) {
      const date = parseISO(dateKey)
      if (isSameMonth(date, currentMonth)) {
        total += hours
      }
    }
    return total
  }, [timeByDate, currentMonth])

  const recordDates = data.map((r) => parseISO(r.date))

    return (
    <Calendar
      mode='single'
      className='mx-auto p-0'
      classNames={{
        day: 'h-9 w-9 mx-0.5 border rounded-sm',
      }}
      modifiers={{ hasRecord: recordDates }}
      defaultMonth={currentMonth}
      onMonthChange={onMonthChange}
      weekStartsOn={1}
      formatters={{
        formatMonthDropdown: (date) => {
          return date.toLocaleString('default', { month: 'long' })
        },
      }}
      components={{
        CaptionLabel: ({ children, ...props }) => {
          return (
            <div className='flex items-center gap-2' {...props}>
              <span className='text-lg font-bold'>{children}</span>
              <span className='ml-1 text-xs text-muted-foreground'>
                {monthTotal}h
              </span>
            </div>
          )
        },
        DayButton: ({ children, modifiers, day, ...props }) => {
          const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
          const { hasRecord } = modifiers
          const key = format(day.date, 'yyyy-MM-dd')
          const hours = timeByDate.get(key)

          return (
            <CalendarDayButton
              day={day}
              modifiers={modifiers}
              {...props}
              className={cn(
                'gap-0 rounded-xs text-xs font-semibold',
                isWeekend && 'text-muted-foreground',
                hasRecord ? 'bg-gray-100' : 'border-accent'
              )}
            >
              {children}
              {hasRecord && <span className='font-normal'>{hours}h</span>}
            </CalendarDayButton>
          )
        },
      }}
    />
  )
}
