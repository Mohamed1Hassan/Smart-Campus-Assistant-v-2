import React from "react";

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
  animate?: boolean;
}

export function Skeleton({
  className = "",
  height = "h-4",
  width = "w-full",
  rounded = false,
  animate = true,
}: SkeletonProps) {
  return (
    <div
      className={`
        bg-gray-200 dark:bg-gray-700
        ${height}
        ${width}
        ${rounded ? "rounded-full" : "rounded"}
        ${animate ? "relative overflow-hidden" : ""}
        ${className}
      `}
    >
      {animate && (
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// Card Skeleton
export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-white dark:bg-cardDark rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton height="h-12" width="w-12" rounded />
        <div className="flex-1">
          <Skeleton height="h-4" width="w-3/4" className="mb-2" />
          <Skeleton height="h-3" width="w-1/2" />
        </div>
      </div>
      <Skeleton height="h-4" width="w-full" className="mb-2" />
      <Skeleton height="h-4" width="w-5/6" className="mb-2" />
      <Skeleton height="h-4" width="w-4/6" />
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className = "",
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-cardDark rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} height="h-4" width="w-24" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} height="h-4" width="w-20" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Dashboard Stats Skeleton
export function StatsSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-cardDark rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Skeleton height="h-12" width="w-12" rounded />
            <Skeleton height="h-6" width="w-16" />
          </div>
          <Skeleton height="h-8" width="w-20" className="mb-2" />
          <Skeleton height="h-4" width="w-24" />
        </div>
      ))}
    </div>
  );
}

// List Skeleton
export function ListSkeleton({
  items = 5,
  className = "",
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-cardDark rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center space-x-4">
            <Skeleton height="h-10" width="w-10" rounded />
            <div className="flex-1">
              <Skeleton height="h-4" width="w-3/4" className="mb-2" />
              <Skeleton height="h-3" width="w-1/2" />
            </div>
            <Skeleton height="h-8" width="w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton({
  height = "h-64",
  className = "",
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-cardDark rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <Skeleton height="h-6" width="w-32" />
        <Skeleton height="h-8" width="w-24" />
      </div>
      <div className={`${height} flex items-end space-x-2`}>
        {Array.from({ length: 12 }).map((_, index) => {
          // Use a deterministic height based on index to satisfy purity rules
          const heights = [
            "h-10",
            "h-12",
            "h-16",
            "h-20",
            "h-24",
            "h-28",
            "h-14",
            "h-18",
            "h-22",
            "h-26",
            "h-12",
            "h-16",
          ];
          return (
            <Skeleton
              key={index}
              height={heights[index % heights.length]}
              width="w-6"
              className="flex-1"
            />
          );
        })}
      </div>
    </div>
  );
}

// Form Skeleton
export function FormSkeleton({
  fields = 4,
  className = "",
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-cardDark rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index}>
            <Skeleton height="h-4" width="w-24" className="mb-2" />
            <Skeleton height="h-10" width="w-full" />
          </div>
        ))}
        <div className="flex space-x-4 pt-4">
          <Skeleton height="h-10" width="w-24" />
          <Skeleton height="h-10" width="w-24" />
        </div>
      </div>
    </div>
  );
}

// Profile Skeleton
export function ProfileSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-white dark:bg-cardDark rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton height="h-20" width="w-20" rounded />
        <div className="flex-1">
          <Skeleton height="h-6" width="w-48" className="mb-2" />
          <Skeleton height="h-4" width="w-32" className="mb-1" />
          <Skeleton height="h-4" width="w-40" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex justify-between">
            <Skeleton height="h-4" width="w-24" />
            <Skeleton height="h-4" width="w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Notification Skeleton
export function NotificationSkeleton({
  items = 3,
  className = "",
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-cardDark rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-start space-x-3">
            <Skeleton height="h-10" width="w-10" rounded />
            <div className="flex-1">
              <Skeleton height="h-4" width="w-3/4" className="mb-2" />
              <Skeleton height="h-3" width="w-full" className="mb-1" />
              <Skeleton height="h-3" width="w-2/3" />
            </div>
            <Skeleton height="h-4" width="w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Main LoadingSkeleton component (alias for Skeleton)
export const LoadingSkeleton = Skeleton;

export default Skeleton;
