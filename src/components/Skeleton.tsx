interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = "", count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton ${className}`} />
      ))}
    </>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-title" />
      <div className="skeleton-text" />
      <div className="skeleton-text w-3/4" />
    </div>
  );
}

export function SkeletonTaskItem() {
  return (
    <div className="card p-4 flex items-start gap-4">
      <div className="skeleton w-6 h-6 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton-title" />
        <div className="skeleton-text w-1/2" />
      </div>
      <div className="skeleton w-16 h-6 rounded-full" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="card p-6 text-center">
        <div className="skeleton-text w-32 mx-auto mb-2" />
        <div className="skeleton text-4xl h-12 w-24 mx-auto mb-2" />
        <div className="skeleton-text w-24 mx-auto" />
      </div>
      <div className="card p-4 space-y-3">
        <div className="skeleton-title w-32" />
        <div className="skeleton h-2 w-full rounded-full" />
        <div className="skeleton-text w-20" />
      </div>
      <div className="space-y-3">
        <div className="skeleton-title w-40" />
        <SkeletonTaskItem />
        <SkeletonTaskItem />
        <SkeletonTaskItem />
      </div>
    </div>
  );
}
