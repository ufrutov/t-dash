import { LayoutDashboard, ListTodo } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Projects',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Time Logs',
          url: '/records',
          icon: ListTodo,
        },
      ],
    },
  ],
}
