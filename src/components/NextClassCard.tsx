import { Calendar } from "lucide-react";

interface NextClassCardProps {
  course: string;
  time: string;
  room: string;
}

export default function NextClassCard({
  course,
  time,
  room,
}: NextClassCardProps) {
  return (
    <div className="w-64 bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-textDark mb-4">
        Next Class
      </h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-textDark mb-1">
            {course}
          </h3>
          <p className="text-xl font-semibold text-gray-700 dark:text-textDark">
            {time}
          </p>
        </div>

        <div className="flex items-center gap-2 text-gray-600 dark:text-mutedDark">
          <Calendar className="w-5 h-5" />
          <span className="font-medium">{room}</span>
        </div>
      </div>
    </div>
  );
}
