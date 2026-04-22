import { useState } from 'react'
import { format } from 'date-fns'
import type { Task } from '@/types/task'
import { Loader, Plus } from 'lucide-react'
import { useSupabase } from '@/hooks/use-supabase'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TaskActionDialog } from './task-action-dialog'

export function TasksList() {
  const { tasks, tasksLoading, projects } = useSupabase()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Create a map of project ID to project for quick lookup
  const projectMap = new Map(projects.map((p) => [p.id, p]))

  const handleNewTask = () => {
    setSelectedTask(null)
    setDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setDialogOpen(true)
  }

  return (
    <div className='flex flex-1 flex-col'>
      <div className='flex flex-row items-center justify-between'>
        <h3 className='text-lg font-medium'>
          Tasks{' '}
          <span className='text-sm text-muted-foreground'>{tasks.length}</span>
        </h3>

        <Button size='sm' onClick={handleNewTask}>
          <Plus className='h-4 w-4' />
          New Task
        </Button>
      </div>

      <Separator className='my-4 flex-none' />

      <div className='faded-bottom h-full w-full overflow-y-auto scroll-smooth pe-4 pb-12'>
        {tasksLoading ? (
          <div className='flex flex-col items-center gap-2'>
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-full' />
            <div className='flex items-center gap-2'>
              <Loader className='h-5 w-5 animate-spin' />
              <p className='text-sm text-muted-foreground'>Loadng...</p>
            </div>
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-full' />
          </div>
        ) : tasks.length === 0 ? (
          <p className='text-muted-foreground'>No tasks found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className='cursor-pointer'
                  onClick={() => handleEditTask(task)}
                >
                  <TableCell className='text-muted-foreground'>
                    {format(new Date(task.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell
                    className='font-medium'
                    style={{
                      color:
                        projectMap.get(task.project_id)?.color || 'inherit',
                    }}
                  >
                    {task.title}
                  </TableCell>
                  <TableCell>{task.description || '-'}</TableCell>
                  <TableCell>{task.category}</TableCell>
                  <TableCell>
                    {task.tags && task.tags.length > 0
                      ? task.tags.map((tag, i) => (
                          <span
                            key={i}
                            className='mr-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs'
                          >
                            {tag}
                          </span>
                        ))
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        task.status === 'done'
                          ? 'bg-green-100 text-green-800'
                          : task.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {task.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <TaskActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
      />
    </div>
  )
}
