'use client'

import { useState } from 'react'
import {
  format,
  endOfWeek,
  eachWeekOfInterval,
  startOfMonth,
  endOfMonth,
  parseISO,
} from 'date-fns'
import type { Project } from '@/types/project'
import { Printer } from 'lucide-react'
import { useSupabase } from '@/hooks/use-supabase'
import { Button } from '@/components/ui/button'
import { DraggableDialog } from '@/components/ui/draggable-dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { RecordType } from '../data/schema'

type InvoiceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  records: RecordType[]
}

type WeekGroup = {
  weekStart: Date
  weekEnd: Date
  weekLabel: string
  records: RecordType[]
  totalHours: number
}

export function InvoiceDialog({
  open,
  onOpenChange,
  records,
}: InvoiceDialogProps) {
  const { projects } = useSupabase()
  const currentMonth = new Date()
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  const [projectRates, setProjectRates] = useState<Record<number, number>>(
    () => {
      const rates: Record<number, number> = {}
      projects.forEach((p: Project) => {
        rates[p.id] = 25
      })
      return rates
    }
  )

  const getProjectTitle = (projectId: number) => {
    return projects.find((p: Project) => p.id === projectId)?.title || 'Unknown'
  }

  const getRate = (projectId: number) => {
    return projectRates[projectId] || 0
  }

  const handleRateChange = (projectId: number, value: string) => {
    const rate = parseFloat(value) || 0
    setProjectRates((prev) => ({ ...prev, [projectId]: rate }))
  }

  const weeks = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 1 }
  )

  const weekGroups = weeks
    .map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      const weekEndClamped = weekEnd > monthEnd ? monthEnd : weekEnd

      const weekRecords = records
        .filter((record) => {
          const recordDate = parseISO(record.date)
          return recordDate >= weekStart && recordDate <= weekEndClamped
        })
        .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())

      const totalHours = weekRecords.reduce((sum, r) => sum + r.time_spent, 0)

      return {
        weekStart,
        weekEnd: weekEndClamped,
        weekLabel: `${format(weekStart, 'MMM d')} - ${format(weekEndClamped, 'MMM d')}`,
        records: weekRecords,
        totalHours,
      } as WeekGroup
    })
    .filter((group) => group.records.length > 0)

  const monthTotalEarnings = weekGroups.reduce((sum, g) => {
    return (
      sum +
      g.records.reduce(
        (acc, r) => acc + getRate(r.project_id) * r.time_spent,
        0
      )
    )
  }, 0)

  const handlePrint = () => {
    const title = `Invoice - ${format(currentMonth, 'MMMM yyyy')}`

    let tableHtml
    if (weekGroups.length > 0) {
      tableHtml = `
        <table>
            <thead>
            <tr>
              <th>Date</th>
              <th>Project</th>
              <th>Title</th>
              <th>Description</th>
              <th>Hours</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            ${weekGroups
              .map(
                (group) => `
              <tr class="week-header">
                <td colspan="6">Week: ${group.weekLabel}</td>
              </tr>
              ${group.records
                .map(
                  (record) => {
                    const rate = getRate(record.project_id)
                    const earnings = rate * record.time_spent
                    return `
                <tr>
                  <td>${format(parseISO(record.date), 'MMM d')}</td>
                  <td>${getProjectTitle(record.project_id)}</td>
                  <td>${record.title}</td>
                  <td>${record.description || ''}</td>
                  <td>${record.time_spent}h</td>
                  <td>$${earnings.toFixed(2)}</td>
                </tr>
              `
                  }
                )
                .join('')}
            `
              )
              .join('')}
            <tr class="total-row">
              <td colspan="5" style="text-align: right;">${format(currentMonth, 'MMMM yyyy')} Total:</td>
              <td>$${monthTotalEarnings.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      `
    } else {
      tableHtml = '<p>No records found for this month.</p>'
    }

    const contentHtml = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
        <div>
          <h1 style="font-size: 24px; margin-bottom: 5px;">${title}</h1>
          <p style="font-size: 14px; color: #666; margin: 0;">for YMI Digital</p>
        </div>
        <div style="text-align: right;">
          <h3 style="font-size: 18px; margin-bottom: 5px;">Serghei Ufrutov</h3>
          <p style="margin: 0;">cvdf34@gmail.com</p>
        </div>
      </div>
      ${tableHtml}
    `

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.top = '-1000px'
    iframe.style.left = '-1000px'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'

    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return
    iframeDoc.open()
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #333; }
            h1 { font-size: 24px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
            th, td { border: 1px solid #e2e8f0; padding: 4px 8px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 600; }
            td:first-child { white-space: nowrap; }
            td:nth-child(5), td:nth-child(6) { text-align: right; }
            .week-header td { background-color: #f1f5f9; font-weight: 600; }
            .total-row td { font-weight: 700; border-top: 2px solid #0f172a; }
            .total-row td:last-child { text-align: right; }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>
    `)
    iframeDoc.close()

    const printAndCleanup = () => {
      iframe.contentWindow?.print()
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe)
        }
      }, 100)
    }

    iframe.onload = printAndCleanup
  }

  return (
    <DraggableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Invoice - ${format(currentMonth, 'MMMM yyyy')}`}
      description='Monthly records grouped by week'
      className='sm:max-w-5xl'
    >
      <ScrollArea className='max-h-[70vh] pr-4'>
        {weekGroups.length === 0 ? (
          <p className='py-4 text-center text-muted-foreground'>
            No records found for this month.
          </p>
        ) : (
          <table className='w-full border-collapse text-sm'>
            <thead>
              <tr className='border-b'>
                <th className='py-1 text-left whitespace-nowrap'>Date</th>
                <th className='py-1 text-left'>Project</th>
                <th className='py-1 text-left'>Title</th>
                <th className='py-1 text-left'>Description</th>
                <th className='py-1 text-right'>Hours</th>
                <th className='py-1 text-right'>Rate</th>
              </tr>
            </thead>
            <tbody>
              {weekGroups.map((group) => (
                <>
                  <tr
                    key={group.weekStart.toISOString()}
                    className='bg-muted/50'
                  >
                    <td colSpan={6} className='py-2 font-semibold'>
                      Week: {group.weekLabel}
                    </td>
                  </tr>
                  {group.records.map((record) => {
                    const rate = getRate(record.project_id)
                    const earnings = rate * record.time_spent
                    return (
                      <tr key={record.id} className='border-b'>
                        <td className='py-1 whitespace-nowrap'>
                          {format(parseISO(record.date), 'MMM d')}
                        </td>
                        <td className='py-1'>
                          {getProjectTitle(record.project_id)}
                        </td>
                        <td className='py-1'>{record.title}</td>
                        <td
                          className='max-w-xs truncate py-1'
                          title={record.description}
                        >
                          {record.description}
                        </td>
                        <td className='py-1 text-right'>
                          {record.time_spent}h
                        </td>
                        <td className='py-1 text-right'>
                          ${earnings.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </>
              ))}
              <tr className='border-t-2 font-bold'>
                <td colSpan={5} className='py-2 text-right'>
                  {format(currentMonth, 'MMMM yyyy')} Total:
                </td>
                <td className='py-2 text-right'>
                  ${monthTotalEarnings.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </ScrollArea>

      <div className='mt-4 flex items-center justify-between'>
        <div className='flex flex-wrap items-center gap-4'>
          <span className='text-sm font-medium'>Project Rates:</span>
          {projects.map((p: Project) => (
            <div key={p.id} className='flex items-center gap-1'>
              <span className='text-sm'>{p.title}:</span>
              <Input
                type='number'
                min={0}
                step={0.01}
                value={projectRates[p.id] || 0}
                onChange={(e) => handleRateChange(p.id, e.target.value)}
                className='h-8 w-20 text-sm'
              />
            </div>
          ))}
        </div>

        <Button onClick={handlePrint}>
          <Printer className='mr-2 h-4 w-4' />
          Print
        </Button>
      </div>
    </DraggableDialog>
  )
}
