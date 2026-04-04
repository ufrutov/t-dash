import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  component: function AuthenticatedLayoutWrapper() {
    const { user, loading } = useAuth()

    if (loading) {
      return (
        <div className='flex h-svh w-full items-center justify-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent' />
        </div>
      )
    }

    if (!user) {
      return <Navigate to='/sign-in' replace />
    }

    return <AuthenticatedLayout />
  },
})
