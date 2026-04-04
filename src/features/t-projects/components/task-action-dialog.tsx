'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useSupabase } from '@/hooks/use-supabase'
import { createTask, updateTask, deleteTask } from '@/lib/tasks'
import { taskFormSchema } from '../data/schema'
import type { Task } from '@/types/task'

type TaskForm = z.infer<typeof taskFormSchema>
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SelectDropdown } from '@/components/select-dropdown'

type TaskActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  onSuccess?: () => void
}

export function TaskActionDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
}: TaskActionDialogProps) {
  const { projects, activeProjectId, refetchTasks } = useSupabase()
  const isEdit = !!task

  const form = useForm({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      project_id: activeProjectId || 0,
      category: 'general',
      tags: [],
      status: 'todo',
    } as TaskForm,
  })

  useEffect(() => {
    if (open) {
      if (task) {
        form.reset({
          title: task.title,
          description: task.description || '',
          project_id: task.project_id,
          category: task.category,
          tags: task.tags || [],
          status: task.status,
        })
      } else {
        form.reset({
          title: '',
          description: '',
          project_id: activeProjectId || 0,
          category: 'general',
          tags: [],
          status: 'todo',
        })
      }
    }
  }, [open, task, activeProjectId, form])

  const onSubmit = async (values: TaskForm) => {
    try {
      if (isEdit && task) {
        await updateTask(task.id, values)
        toast.success('Task updated successfully')
      } else {
        await createTask(values)
        toast.success('Task created successfully')
      }
      refetchTasks()
      onSuccess?.()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const handleDelete = async () => {
    if (!task) return
    try {
      await deleteTask(task.id)
      toast.success('Task deleted successfully')
      refetchTasks()
      onSuccess?.()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete task')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          form.reset()
        }
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the task here. Click save when you\'re done.'
              : 'Create a new task here. Click save when you\'re done.'}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[60vh] overflow-y-auto py-1'>
          <Form {...form}>
            <form
              id='task-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='project_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <SelectDropdown
                      defaultValue={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                      placeholder='Select a project'
                      items={projects.map((p) => ({
                        label: p.title,
                        value: String(p.id),
                      }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Task title' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Task description'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='category'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select a category'
                      items={[
                        { label: 'General', value: 'general' },
                        { label: 'Development', value: 'development' },
                        { label: 'Design', value: 'design' },
                        { label: 'Testing', value: 'testing' },
                        { label: 'Documentation', value: 'documentation' },
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as TaskForm['status'])
                      }
                      placeholder='Select a status'
                      items={[
                        { label: 'To Do', value: 'todo' },
                        { label: 'In Progress', value: 'in_progress' },
                        { label: 'Done', value: 'done' },
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter className='flex justify-between'>
          {isEdit && (
            <Button type='button' variant='destructive' onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div className='flex gap-2 ml-auto'>
            <Button type='submit' form='task-form'>
              {isEdit ? 'Update' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}