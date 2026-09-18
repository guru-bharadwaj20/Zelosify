import { Skeleton } from "@/components/UI/shadcn/skeleton";

export default function OpeningsTableSkeleton({ rows = 6 }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-tableHeader px-4 py-3 border-b border-border">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
