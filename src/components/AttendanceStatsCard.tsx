import { ReactNode } from "react";

interface AttendanceStatsCardProps {
  icon?: ReactNode;
  Tag: string;
  value: string;
  subtext?: string;
  showProgress?: boolean;
  percenTage?: number;
}

export default function AttendanceStatsCard({
  icon,
  Tag,
  value,
  subtext,
  showProgress,
  percenTage,
}: AttendanceStatsCardProps) {
  return (
    <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start gap-4">
        {showProgress && percenTage !== undefined ? (
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#E5E7EB"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#3B82F6"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${(percenTage / 100) * 176} 176`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-900 dark:text-textDark">
                {percenTage}%
              </span>
            </div>
          </div>
        ) : icon ? (
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        ) : null}

        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-mutedDark mb-1">
            {Tag}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-textDark">
            {value}
          </h3>
          {subtext && (
            <p className="text-sm text-gray-500 dark:text-mutedDark mt-1">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
