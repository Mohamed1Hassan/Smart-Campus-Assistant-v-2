interface AttendanceCardProps {
  rate: number;
}

export default function AttendanceCard({ rate }: AttendanceCardProps) {
  return (
    <div className="bg-white dark:bg-cardDark rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      <h3 className="text-sm font-medium text-gray-600 dark:text-mutedDark mb-2">
        Attendance Rate
      </h3>
      <div className="flex items-end gap-1 mb-3">
        <span className="text-4xl font-bold text-gray-900 dark:text-textDark">
          {rate}
        </span>
        <span className="text-2xl font-bold text-gray-900 dark:text-textDark mb-1">
          %
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="progress-bar bg-blue-600 h-full rounded-full"
          style={{ "--progress-width": `${rate}%` } as React.CSSProperties}
          role="progressbar"
          aria-valuenow={rate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Attendance rate: ${rate}%`}
        ></div>
      </div>
    </div>
  );
}
