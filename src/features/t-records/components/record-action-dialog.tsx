'use client'

import { useEffect } from 'react'
import { type z } from 'zod'
import { format, parseISO } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createRecord, updateRecord, deleteRecord } from '@/lib/records'
import { useSupabase } from '@/hooks/use-supabase'
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
import { DatePicker } from '@/components/date-picker'
import { SelectDropdown } from '@/components/select-dropdown'
import { recordFormSchema } from '../data/schema'

type RecordForm = z.infer<typeof recordFormSchema>

type RecordWithId = RecordForm & { id: number }

type RecordActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: RecordWithId | null
  onSuccess?: () => void
}

export function RecordActionDialog({
  open,
  onOpenChange,
  record,
  onSuccess,
}: RecordActionDialogProps) {
  const { projects, activeProjectId } = useSupabase()
  const isEdit = !!record

  const form = useForm({
    resolver: zodResolver(recordFormSchema),
    defaultValues: {
      title: '',
      description: '',
      project_id: activeProjectId || 0,
      category: 'general',
      tags: [] as string[],
      date: new Date().toISOString().split('T')[0],
      time_spent: 0,
      link: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (record) {
        form.reset({
          title: record.title,
          description: record.description || '',
          project_id: record.project_id,
          category: record.category,
          tags: record.tags || [],
          date: record.date,
          time_spent: record.time_spent,
          link: record.link || '',
        })
      } else {
        form.reset({
          title: '',
          description: '',
          project_id: activeProjectId || 0,
          category: 'general',
          tags: [],
          date: new Date().toISOString().split('T')[0],
          time_spent: 2,
          link: '',
        })
      }
    }
  }, [open, record, activeProjectId, form])

  const onSubmit = async (values: RecordForm) => {
    try {
      if (isEdit && record) {
        await updateRecord(record.id, values)
        toast.success('Record updated successfully')
      } else {
        await createRecord(values)
        toast.success('Record created successfully')
      }
      onSuccess?.()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong'
      )
    }
  }

  const handleDelete = async () => {
    if (!record) return
    try {
      await deleteRecord(record.id)
      toast.success('Record deleted successfully')
      onSuccess?.()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete record'
      )
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
          <DialogTitle>{isEdit ? 'Edit Record' : 'Add New Record'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the record here. Click save when you're done."
              : "Create a new record here. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>
        <div className='py-1'>
          <Form {...form}>
            <form
              id='record-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4'
            >
              <div className='flex gap-2'>
                <FormField
                  control={form.control}
                  name='project_id'
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>Project</FormLabel>
                      <SelectDropdown
                        defaultValue={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                        placeholder='Select a project'
                        className='w-full'
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
                  name='date'
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          selected={
                            field.value ? parseISO(field.value) : undefined
                          }
                          onSelect={(date) => {
                            if (!date) return field.onChange('')
                            field.onChange(format(date, 'yyyy-MM-dd'))
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Record title' {...field} />
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
                        placeholder='Record description'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex gap-2'>
                <FormField
                  control={form.control}
                  name='time_spent'
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>Time Spent (hours)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          value={field.value}
                          defaultValue={2}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
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
                    <FormItem className='flex-1'>
                      <FormLabel>Category</FormLabel>
                      <SelectDropdown
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        placeholder='Select a category'
                        className='w-full'
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
              </div>
              <FormField
                control={form.control}
                name='tags'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma separated)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='tag1, tag2, ...'
                        value={field.value?.join(', ') || ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .split(',')
                              .map((tag) => tag.trim())
                              .filter(Boolean)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='link'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link</FormLabel>
                    <FormControl>
                      <Input placeholder='https://...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Status field removed: not present in schema. */}
            </form>
          </Form>
        </div>
        <DialogFooter className='flex justify-between'>
          {isEdit && (
            <Button type='button' variant='destructive' onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div className='ml-auto flex gap-2'>
            <Button type='submit' form='record-form'>
              {isEdit ? 'Update' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
