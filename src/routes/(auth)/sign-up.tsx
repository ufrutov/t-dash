import { createFileRoute, Navigate } from '@tanstack/react-router'
import { SignUp } from '@/features/auth/sign-up'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/(auth)/sign-up')({
  component: function SignUpPage() {
    const { user, loading } = useAuth()

    if (loading) {
      return (
        <div className='flex h-svh w-full items-center justify-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent' />
        </div>
      )
    }

    if (user) {
      return <Navigate to='/' replace />
    }

    return <SignUp />
  },
})