import { ChevronRight } from "lucide-react";

interface CalendarDay {
  day: number;
  status: "present" | "absent" | "excused" | null;
}

interface AttendanceCalendarProps {
  data: CalendarDay[];
}

export default function AttendanceCalendar({ data }: AttendanceCalendarProps) {
  const daysOfWeek = ["Sun", "Mon", "Tu", "We", "Thu", "Fri", "Sat"];

  const getStatusColor = (status: CalendarDay["status"]) => {
    switch (status) {
      case "present":
        return "bg-green-500 text-white hover:bg-green-600";
      case "absent":
        return "bg-red-500 text-white hover:bg-red-600";
      case "excused":
        return "bg-yellow-500 text-white hover:bg-yellow-600";
      default:
        return "bg-white dark:bg-gray-700 text-gray-900 dark:text-textDark hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600";
    }
  };

  const calendar = [
    [null, null, null, null, null, null, null],
    [null, 4, 6, 8, 8, 9, 10],
    [12, 11, 14, 15, 16, 15, 18],
    [19, 20, 21, 22, 23, 24, 25],
  ];

  const statusMap: { [key: number]: CalendarDay["status"] } = {};
  data.forEach((item) => {
    statusMap[item.day] = item.status;
  });

  return (
    <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700 dark:text-textDark">
              Grresen
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-700 dark:text-textDark">
              Absent
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-700 dark:text-textDark">
              Excused
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-gray-900 dark:text-textDark">
            April 2024
          </span>
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-mutedDark" />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center">
            <span className="text-sm font-semibold text-gray-700 dark:text-textDark">
              {day}
            </span>
          </div>
        ))}

        {calendar.flat().map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-12"></div>;
          }

          const status = statusMap[day];
          return (
            <button
              key={`${day}-${index}`}
              className={`h-12 rounded-lg font-medium text-sm transition-colors ${getStatusColor(
                status,
              )}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-mutedDark mb-1">
              Apresent
            </p>
          </div>
          <div>
            <p className="text-sm text-red-600 font-medium mb-1">Absent</p>
          </div>
          <div>
            <p className="text-sm text-yellow-600 font-medium mb-1">Excused</p>
          </div>
        </div>
      </div>
    </div>
  );
}
