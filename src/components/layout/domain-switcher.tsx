import * as React from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { useSupabase } from '@/hooks/use-supabase'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function DomainSwitcher() {
  const { isMobile } = useSidebar()
  const { domains, setActiveDomainId } = useSupabase()
  const [activeDomain, setLocalActiveDomain] = React.useState<
    (typeof domains)[0] | null
  >(null)

  React.useEffect(() => {
    if (domains.length > 0 && !activeDomain) {
      setLocalActiveDomain(domains[0])
      setActiveDomainId(domains[0].id)
    }
  }, [domains, activeDomain, setActiveDomainId])

  const handleDomainSelect = (domain: (typeof domains)[0]) => {
    setLocalActiveDomain(domain)
    setActiveDomainId(domain.id)
  }

  if (!activeDomain) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                <span className='text-sm font-bold'>
                  {activeDomain.title[0]}
                </span>
              </div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  {activeDomain.title}
                </span>
                <span className='truncate text-xs'>
                  {activeDomain.subtitle}
                </span>
              </div>
              <ChevronsUpDown className='ms-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-xs text-muted-foreground'>
              Domains
            </DropdownMenuLabel>
            {domains.map((domain, index) => (
              <DropdownMenuItem
                key={domain.id}
                onClick={() => handleDomainSelect(domain)}
                className='gap-2 p-2'
              >
                <div className='flex size-6 items-center justify-center rounded-sm border'>
                  <span className='text-xs font-bold'>{domain.title[0]}</span>
                </div>
                {domain.title}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
