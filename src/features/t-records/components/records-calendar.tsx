import { useMemo, useState, useEffect } from 'react'
import {
  parseISO,
  format,
  isSameMonth,
  getDaysInMonth,
  getDate,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar2'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { RecordType } from '../data/schema'

type RecordsCalendarProps = {
  data: RecordType[]
  currentMonth: Date
  onMonthChange: (date: Date) => void
  selectedDate: Date | undefined
  onDateSelect: (date: Date | undefined) => void
}

export function RecordsCalendar({
  data,
  currentMonth,
  onMonthChange,
  selectedDate,
  onDateSelect,
}: RecordsCalendarProps) {
  const [potentialProgress, setPotentialProgress] = useState(0)

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

  useEffect(() => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const currentDay = getDate(new Date())
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPotentialProgress((currentDay / daysInMonth) * 100)
  }, [currentMonth])

  const recordDates = data.map((r) => parseISO(r.date))

  const isCurrentMonth = useMemo(() => {
    return isSameMonth(currentMonth, new Date())
  }, [currentMonth])

  return (
    <div className='relative'>
      <div className='absolute top-8 left-0 z-10 w-full px-2'>
        <div className='relative h-1.5 w-full overflow-hidden rounded-full bg-muted'>
          {/* Potential Progress - only show for current month */}
          {isCurrentMonth && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className='absolute top-0 left-0 h-1.5 max-w-full cursor-pointer rounded-full bg-pink-500 transition-all duration-500 ease-out'
                  style={{
                    width: `${potentialProgress}%`,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent side='bottom' align='end' className='bg-pink-500'>
                <p>{(potentialProgress - monthTotal).toFixed(1)}h</p>
              </TooltipContent>
            </Tooltip>
          )}
          {/* Actual Progress */}
          <div
            className='absolute top-0 left-0 h-1.5 max-w-full rounded-full bg-primary transition-all duration-500 ease-out'
            style={{
              width: `${(monthTotal / 100) * 100}%`,
            }}
          />
        </div>
      </div>

      <Calendar
        mode='single'
        className='mx-auto p-0'
        classNames={{
          day: 'h-9 w-9 mx-0.5 border rounded-sm',
        }}
        modifiers={{ hasRecord: recordDates }}
        defaultMonth={currentMonth}
        onMonthChange={onMonthChange}
        selected={selectedDate}
        onSelect={onDateSelect}
        weekStartsOn={1}
        formatters={{
          formatMonthDropdown: (date) => {
            return date.toLocaleString('default', { month: 'long' })
          },
        }}
        components={{
          CaptionLabel: ({ children, ...props }) => {
            return (
              <div
                {...props}
                className='relative flex w-full items-baseline justify-center'
              >
                <span className='text-lg font-bold'>{children}</span>
                <span className='ml-1 text-xs text-muted-foreground'>
                  {monthTotal}h
                </span>
              </div>
            )
          },
          DayButton: ({ children, modifiers, day, ...props }) => {
            const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
            const { hasRecord, today: isToday } = modifiers
            const key = format(day.date, 'yyyy-MM-dd')
            const hours = timeByDate.get(key)

            return (
              <CalendarDayButton
                day={day}
                modifiers={modifiers}
                {...props}
                className={cn(
                  'gap-0 rounded-sm text-xs font-semibold',
                  isWeekend && 'text-muted-foreground',
                  hasRecord ? 'bg-muted' : 'border-accent',
                  isToday && 'border border-pink-500'
                )}
              >
                {children}
                {hasRecord && <span className='font-normal'>{hours}h</span>}
              </CalendarDayButton>
            )
          },
        }}
      />
    </div>
  )
}
