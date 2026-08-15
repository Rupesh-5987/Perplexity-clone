export default function LoadingSkeleton() {
  return (
    <div className="space-y-2.5 animate-pulse" aria-label="Loading answer" role="status">
      <div className="h-3.5 rounded-full bg-surface-2 w-[92%]" />
      <div className="h-3.5 rounded-full bg-surface-2 w-[85%]" />
      <div className="h-3.5 rounded-full bg-surface-2 w-[70%]" />
    </div>
  );
}
