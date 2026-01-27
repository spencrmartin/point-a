import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-muted rounded', className)} />
  )
}

export function IssueCardSkeleton() {
  return (
    <div className="p-3 bg-card rounded-lg border space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  )
}

export function BoardColumnSkeleton() {
  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-6 rounded" />
        </div>
      </div>
      <div className="flex-1 space-y-2 p-1">
        <IssueCardSkeleton />
        <IssueCardSkeleton />
        <IssueCardSkeleton />
      </div>
    </div>
  )
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center px-3 py-2 border-b gap-3">
      <Skeleton className="w-4 h-4 rounded" />
      <Skeleton className="w-4 h-4" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-6 rounded-full" />
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

export function CalendarDaySkeleton() {
  return (
    <div className="min-h-[100px] p-1 border-b border-r">
      <Skeleton className="w-7 h-7 rounded-full mb-1" />
      <div className="space-y-1">
        <Skeleton className="h-5 w-full rounded" />
        <Skeleton className="h-5 w-3/4 rounded" />
      </div>
    </div>
  )
}
