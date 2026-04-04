import { Loader } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function RecordsSkeleton() {
  const skeletonCount = 5

  return (
    <div className='flex min-w-0 flex-1 flex-col items-center gap-2'>
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <Skeleton key={i} className='h-6 w-full' />
      ))}
      <div className='flex items-center gap-2'>
        <Loader className='h-5 w-5 animate-spin' />
        <p className='text-sm text-muted-foreground'>Loading...</p>
      </div>
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <Skeleton key={i} className='h-6 w-full' />
      ))}
    </div>
  )
}
