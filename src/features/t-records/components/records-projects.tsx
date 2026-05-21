import { useMemo } from 'react'
import type { Project } from '@/types/project'
import type { RecordType } from '../data/schema'

type RecordsProjectsProps = {
  projects: Project[]
  records: RecordType[]
}

export function RecordsProjects({ projects, records }: RecordsProjectsProps) {
  const projectHours = useMemo(() => {
    const map = new Map<number, number>()
    for (const r of records) {
      map.set(r.project_id, (map.get(r.project_id) ?? 0) + r.time_spent)
    }
    return map
  }, [records])

  const sorted = useMemo(() => {
    return [...projects]
      .filter((p) => projectHours.has(p.id))
      .sort(
        (a, b) => (projectHours.get(b.id) ?? 0) - (projectHours.get(a.id) ?? 0)
      )
  }, [projects, projectHours])

  if (sorted.length === 0) return null

  const totalHours = [...projectHours.values()].reduce((a, b) => a + b, 0)

  return (
    <div className='rounded-md border p-3'>
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
          Projects
        </h3>
        <span className='text-xs font-bold text-muted-foreground tabular-nums'>
          {totalHours}h
        </span>
      </div>
      <ul className='space-y-1.5'>
        {sorted.map((project) => {
          const hours = projectHours.get(project.id) ?? 0
          return (
            <li
              key={project.id}
              className='flex items-center justify-between gap-2 text-sm'
            >
              <span className='inline-flex items-center gap-1.5 truncate font-medium'>
                <span
                  className='inline-block size-2 shrink-0 rounded-full'
                  style={{ backgroundColor: project.color ?? '#888' }}
                />
                {project.title}
              </span>
              <span className='shrink-0 text-xs font-bold text-muted-foreground tabular-nums'>
                {hours}h
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
