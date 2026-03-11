import { ChevronDown, Clock } from "lucide-react";

interface AttendanceRecord {
  id: number;
  date: string;
  course: string;
  status: string;
  professor: string;
  time: string;
}

interface AttendanceRightPanelProps {
  attendanceData: AttendanceRecord[];
  selectedFilter: string;
}

export default function AttendanceRightPanel({
  attendanceData,
  selectedFilter,
}: AttendanceRightPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return "text-green-600";
      case "absent":
        return "text-red-600";
      case "excused":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-textDark">
            Last Updated
          </h2>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-textDark">
            Apr 3, 2024
          </p>
          <p className="text-lg text-gray-600 dark:text-mutedDark mt-1">
            11:15 AM
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-textDark">
            Details
          </h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Download FileText
          </button>
        </div>

        <div className="mb-4">
          <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-darkBg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
            <span className="text-sm text-gray-700 dark:text-textDark font-medium">
              {selectedFilter}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-mutedDark" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-700 dark:text-textDark">
              Course Name
            </span>
            <div className="flex items-center gap-8">
              <span className="text-sm font-semibold text-gray-700 dark:text-textDark">
                Status
              </span>
              <Clock className="w-4 h-4 text-gray-400 dark:text-mutedDark" />
              <span className="text-sm font-semibold text-gray-700 dark:text-textDark w-16 text-right">
                Time
              </span>
            </div>
          </div>

          {attendanceData.slice(0, 4).map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between py-2"
            >
              <span className="text-sm text-gray-900 dark:text-textDark">
                {record.course}
              </span>
              <div className="flex items-center gap-8">
                <span
                  className={`text-sm font-medium ${getStatusColor(record.status)} w-16`}
                >
                  {record.status}
                </span>
                <span className="text-sm text-gray-900 dark:text-textDark w-16 text-right">
                  {record.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-textDark mb-4">
          Ask the Assistant
        </h2>
        <p className="text-gray-700 dark:text-mutedDark text-sm leading-relaxed">
          You attended 95% of your classes this month. Need help improving your
          record ?
        </p>
      </div>
    </div>
  );
}
