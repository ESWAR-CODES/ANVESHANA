import React from 'react';

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'w-full h-4' }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200/80 rounded ${className}`}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden p-0 shadow-sm flex flex-col">
      <Skeleton className="w-full aspect-video rounded-none" />
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <Skeleton className="w-24 h-5 rounded-full" />
          <Skeleton className="w-3/4 h-6" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-2/3 h-4" />
        </div>
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
      </div>
    </div>
  );
};
