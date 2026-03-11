import { ChevronRight } from "lucide-react";

interface ScheduleItem {
  time: string;
  title: string;
  room: string;
  action: string;
}

interface ScheduleCardProps {
  schedule: ScheduleItem[];
}

export default function ScheduleCard({ schedule }: ScheduleCardProps) {
  return (
    <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-textDark mb-4">
        Today&apos;s Schedule
      </h3>
      <div className="space-y-3">
        {schedule.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors duration-200"
          >
            <div className="flex items-center gap-6 flex-1">
              <span className="text-sm font-medium text-gray-700 dark:text-textDark w-20">
                {item.time}
              </span>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-textDark">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-mutedDark mt-0.5">
                  {item.room}
                </p>
              </div>
            </div>
            <button className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
              {item.action}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
