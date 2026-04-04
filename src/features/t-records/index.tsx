import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useSupabase } from '@/hooks/use-supabase'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { RecordActionDialog } from './components/record-action-dialog'
import { RecordsCalendar } from './components/records-calendar'
import { RecordsSkeleton } from './components/records-skeleton'
import { TasksTable } from './components/records-table'
import { recordSchema, type RecordType } from './data/schema'

export function Records() {
  const { records, recordsLoading } = useSupabase()
  const [dialogOpen, setDialogOpen] = useState(false)
  const data = recordSchema.array().parse(records)

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex w-full flex-1 flex-col gap-4 pt-0 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Records</h2>
            <p className='text-muted-foreground'>
              Here&apos;s a list of your records!
            </p>
          </div>
          <Button size='sm' onClick={() => setDialogOpen(true)}>
            <Plus className='h-4 w-4' />
            New Record
          </Button>
        </div>

        <div className='flex flex-col gap-4 sm:flex-row'>
          <RecordsCalendar data={data as RecordType[]} />

          {recordsLoading ? (
            <RecordsSkeleton />
          ) : (
            <div className='min-w-0 flex-1'>
              <TasksTable data={data as RecordType[]} />
            </div>
          )}
        </div>
      </Main>

      <RecordActionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
