import { useSupabase } from '@/hooks/use-supabase'
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { SidebarNav } from './components/sidebar-nav'
import { TasksList } from './components/tasks-list'

export function Projects() {
  const { projects, projectsLoading, activeProjectId, setActiveProjectId } =
    useSupabase()

  const sidebarNavItems = projects.map((project) => ({
    title: project.title,
    onClick: () => setActiveProjectId(project.id),
  }))

  const selectedProject = projects.find((p) => p.id === activeProjectId)

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className='pt-0'>
        <div className='space-y-0.5'>
          <h2 className='text-2xl font-bold tracking-tight'>Projects</h2>
          <p className='text-muted-foreground'>
            {projectsLoading ? 'Loading...' : 'Manage your projects.'}
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-4'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className='flex w-full overflow-y-hidden p-1'>
            {selectedProject ? (
              <TasksList />
            ) : (
              <div className='flex h-full items-center justify-center'>
                <p className='text-muted-foreground'>
                  Select a project to view tasks.
                </p>
              </div>
            )}
          </div>
        </div>
      </Main>
    </>
  )
}
