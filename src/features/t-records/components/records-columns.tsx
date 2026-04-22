import { format } from 'date-fns'
import { ExternalLinkIcon } from '@radix-ui/react-icons'
import { type ColumnDef } from '@tanstack/react-table'
import type { Project } from '@/types/project'
import { DataTableColumnHeader } from '@/components/data-table'
import type { RecordType } from '../data/schema'

export function getRecordsColumns(
  projects: Project[]
): ColumnDef<RecordType>[] {
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  return [
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Date' />
      ),
      cell: ({ row }) => format(new Date(row.getValue('date')), 'dd/MM/yyyy'),
      filterFn: (row, columnId, filterValues: string[]) => {
        const dateValue = String(row.getValue(columnId))
        return filterValues.some((filter) => dateValue.startsWith(filter))
      },
      meta: { className: 'max-w-[80px]' },
    },
    {
      accessorKey: 'project_id',
      accessorFn: (row) => String(row.project_id),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Project' />
      ),
      cell: ({ row }) => {
        const project = projectMap.get(row.original.project_id)
        return (
          <span
            className='inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold'
            style={{
              color: 'inherit',
              backgroundColor: project?.color
                ? `${project.color}20`
                : 'transparent',
              border: `1px solid ${project?.color || 'transparent'}`,
            }}
          >
            {project?.title ?? row.getValue('project_id')}
          </span>
        )
      },
      meta: { className: 'max-w-[80px]' },
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Title' />
      ),
      meta: { className: 'max-w-[180px]', truncate: true },
      cell: ({ row }) => (
        <span className='font-medium'>{row.getValue('title')}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Description' />
      ),
      meta: { className: 'min-w-[220px]', truncate: true },
      cell: ({ row }) => (
        <span className='truncate'>{row.getValue('description')}</span>
      ),
    },
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Category' />
      ),
      meta: { className: 'max-w-[100px]' },
    },
    {
      accessorKey: 'tags',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Tags' />
      ),
      cell: ({ row }) => {
        const tags = row.getValue('tags') as string[]
        return Array.isArray(tags) ? tags.join(', ') : ''
      },
      meta: { className: 'min-w-[120px]' },
    },
    {
      accessorKey: 'time_spent',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Time Spent' />
      ),
      meta: { className: 'max-w-[60px] text-right', tdClassName: 'text-right' },
    },
    {
      accessorKey: 'link',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Link' />
      ),
      cell: ({ row }) => {
        const link: string = row.getValue('link')
        return link ? (
          <a
            href={link}
            target='_blank'
            rel='noopener noreferrer'
            className='flex justify-center text-blue-600'
          >
            <ExternalLinkIcon className='h-4 w-4' />
          </a>
        ) : null
      },
      meta: { className: 'max-w-[60px]' },
    },
  ]
}
