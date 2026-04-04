import { createFileRoute } from '@tanstack/react-router'
import { Projects } from '@/features/t-projects'

export const Route = createFileRoute('/_authenticated/')({
  component: Projects,
})
