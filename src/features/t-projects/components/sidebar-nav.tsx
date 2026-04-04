import { useState } from 'react'
import { useLocation, Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type SidebarNavProps = React.HTMLAttributes<HTMLElement> & {
  items: {
    title: string
    href?: string
    onClick?: () => void
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const { pathname } = useLocation()
  const [val, setVal] = useState(items[0]?.title || '')

  const handleSelect = (title: string) => {
    setVal(title)
    const item = items.find((i) => i.title === title)
    if (item?.onClick) {
      item.onClick()
    }
  }

  const handleItemClick = (title: string, onClick?: () => void) => {
    setVal(title)
    onClick?.()
  }

  return (
    <>
      <div className='p-1 md:hidden'>
        <Select value={val} onValueChange={handleSelect}>
          <SelectTrigger className='h-12 sm:w-48'>
            <SelectValue placeholder='Select project' />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.title} value={item.title}>
                {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea
        orientation='horizontal'
        type='always'
        className='hidden w-full min-w-40 bg-background px-1 py-2 md:block'
      >
        <nav
          className={cn(
            'flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0',
            className
          )}
          {...props}
        >
          {items.map((item) =>
            item.href ? (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  pathname === item.href
                    ? 'bg-muted hover:bg-accent'
                    : 'hover:bg-accent hover:underline',
                  'justify-start'
                )}
              >
                {item.title}
              </Link>
            ) : (
              <button
                key={item.title}
                onClick={() => handleItemClick(item.title, item.onClick)}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  val === item.title
                    ? 'bg-muted hover:bg-accent'
                    : 'hover:bg-accent hover:underline',
                  'w-full justify-start'
                )}
              >
                {item.title}
              </button>
            )
          )}
        </nav>
      </ScrollArea>
    </>
  )
}
