/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import type { Domain } from '@/types/domain'
import type { Project } from '@/types/project'
import type { Record } from '@/types/record'
import type { Task } from '@/types/task'
import { fetchDomains } from '@/lib/domains'
import { fetchProjects } from '@/lib/projects'
import { fetchRecords } from '@/lib/records'
import { fetchTasks } from '@/lib/tasks'
import { useAuth } from '@/hooks/use-auth'

interface SupabaseContextType {
  domains: Domain[]
  domainsLoading: boolean
  domainsError: Error | null
  refetchDomains: () => Promise<void>
  projects: Project[]
  projectsLoading: boolean
  projectsError: Error | null
  refetchProjects: () => Promise<void>
  activeDomainId: number | null
  setActiveDomainId: (id: number | null) => void
  activeProjectId: number | null
  setActiveProjectId: (id: number | null) => void
  tasks: Task[]
  tasksLoading: boolean
  tasksError: Error | null
  refetchTasks: () => Promise<void>
  records: Record[]
  recordsLoading: boolean
  recordsError: Error | null
  refetchRecords: (month?: Date) => Promise<void>
}

export const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined
)

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const hasInitializedDomains = useRef(false)
  const hasInitializedProjects = useRef(false)
  const hasInitializedTasks = useRef(false)
  const hasInitializedRecords = useRef(false)

  // Domains state
  const [domains, setDomains] = useState<Domain[]>([])
  const [domainsLoading, setDomainsLoading] = useState(false)
  const [domainsError, setDomainsError] = useState<Error | null>(null)

  // Projects state
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState<Error | null>(null)

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState<Error | null>(null)

  // Records state - with localStorage persistence
  const [records, setRecords] = useState<Record[]>(() => {
    try {
      const cached = localStorage.getItem('app_records')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState<Error | null>(null)

  // Active domain and project
  const [activeDomainId, setActiveDomainId] = useState<number | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null)

  const refetchDomains = useCallback(async () => {
    if (!user) return
    setDomainsLoading(true)
    setDomainsError(null)
    try {
      const data = await fetchDomains(user.id)
      setDomains(data)
      if (data.length > 0 && !activeDomainId) {
        setActiveDomainId(data[0].id)
      }
    } catch (err) {
      setDomainsError(
        err instanceof Error ? err : new Error('Failed to fetch domains')
      )
    } finally {
      setDomainsLoading(false)
    }
  }, [user, activeDomainId])

  const refetchProjects = useCallback(async () => {
    if (!user) return
    setProjectsLoading(true)
    setProjectsError(null)
    try {
      const data = await fetchProjects(activeDomainId || undefined)
      setProjects(data)
      if (data.length > 0) {
        setActiveProjectId((current) => current || data[0].id)
      }
    } catch (err) {
      setProjectsError(
        err instanceof Error ? err : new Error('Failed to fetch projects')
      )
    } finally {
      setProjectsLoading(false)
    }
  }, [user, activeDomainId])

  const refetchTasks = useCallback(async () => {
    if (!user) return
    setTasksLoading(true)
    setTasksError(null)
    try {
      const data = await fetchTasks(activeProjectId || undefined)
      setTasks(data)
    } catch (err) {
      setTasksError(
        err instanceof Error ? err : new Error('Failed to fetch tasks')
      )
    } finally {
      setTasksLoading(false)
    }
  }, [user, activeProjectId])

  const refetchRecords = useCallback(
    async (month?: Date) => {
      if (!user) return
      setRecordsLoading(true)
      setRecordsError(null)
      try {
        let startDate, endDate
        if (month) {
          const start = startOfMonth(month)
          const end = endOfMonth(month)
          startDate = format(start, 'yyyy-MM-dd')
          endDate = format(end, 'yyyy-MM-dd')
        }
        const data = await fetchRecords(undefined, startDate, endDate)
        setRecords(data)
      } catch (err) {
        setRecordsError(
          err instanceof Error ? err : new Error('Failed to fetch records')
        )
      } finally {
        setRecordsLoading(false)
      }
    },
    [user]
  )

  useEffect(() => {
    if (user && !hasInitializedDomains.current) {
      hasInitializedDomains.current = true
      refetchDomains()
    }
  }, [user, refetchDomains])

  useEffect(() => {
    if (user && !hasInitializedProjects.current) {
      hasInitializedProjects.current = true
      refetchProjects()
    }
  }, [user, refetchProjects])

  useEffect(() => {
    if (user && !hasInitializedTasks.current) {
      hasInitializedTasks.current = true
      refetchTasks()
    }
  }, [user, refetchTasks])

  // Persist records to localStorage
  useEffect(() => {
    localStorage.setItem('app_records', JSON.stringify(records))
  }, [records])

  // Fetch records only on initial mount when user is authenticated
  // Respect empty array from localStorage after that
  useEffect(() => {
    if (user && !hasInitializedRecords.current) {
      hasInitializedRecords.current = true
      refetchRecords(new Date())
    }
  }, [user, refetchRecords])

  // Reset initialized flags when user logs out
  useEffect(() => {
    if (!user) {
      hasInitializedDomains.current = false
      hasInitializedProjects.current = false
      hasInitializedTasks.current = false
      hasInitializedRecords.current = false
    }
  }, [user])

  return (
    <SupabaseContext.Provider
      value={{
        domains,
        domainsLoading,
        domainsError,
        refetchDomains,
        projects,
        projectsLoading,
        projectsError,
        refetchProjects,
        activeDomainId,
        setActiveDomainId,
        activeProjectId,
        setActiveProjectId,
        tasks,
        tasksLoading,
        tasksError,
        refetchTasks,
        records,
        recordsLoading,
        recordsError,
        refetchRecords,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  )
}
