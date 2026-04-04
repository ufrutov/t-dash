import { createFileRoute } from '@tanstack/react-router'
import { Records } from '@/features/t-records'

export const Route = createFileRoute('/_authenticated/records/')({
  component: Records,
})
