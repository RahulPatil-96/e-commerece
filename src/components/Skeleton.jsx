export function SkeletonLoader({ className = 'w-full h-10 rounded-sm' }) {
  return <div className={`${className} bg-secondary animate-pulse`} />;
}

export function SkeletonCard({ count = 1 }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonLoader className="w-full h-24 rounded-sm" />
          <SkeletonLoader className="w-3/4 h-4" />
          <SkeletonLoader className="w-1/2 h-4" />
        </div>
      ))}
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonLoader className="w-full h-12 rounded-full" />
      <SkeletonLoader className="w-full h-12 rounded-full" />
      <SkeletonLoader className="w-full h-12 rounded-full" />
      <SkeletonLoader className="w-full h-12 rounded-full" />
      <SkeletonLoader className="w-full h-14 rounded-full" />
    </div>
  );
}
