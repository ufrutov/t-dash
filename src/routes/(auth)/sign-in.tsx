import { z } from 'zod'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { SignIn } from '@/features/auth/sign-in'
import { useAuth } from '@/hooks/use-auth'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-in')({
  component: function SignInPage() {
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

    return <SignIn />
  },
  validateSearch: searchSchema,
})