import { ChevronDown } from "lucide-react";

interface AttendanceRecord {
  id: number;
  date: string;
  course: string;
  status: string;
  professor: string;
  time: string;
}

interface AttendanceDetailsTableProps {
  data: AttendanceRecord[];
}

export default function AttendanceDetailsTable({
  data,
}: AttendanceDetailsTableProps) {
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
    <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-textDark">
          Details
        </h2>
        <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-textDark hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors">
          <span>Alt</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-textDark">
                Date
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-textDark">
                Course Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-textDark">
                Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-textDark">
                Professor
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-textDark">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((record, index) => (
              <tr
                key={record.id}
                className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  index % 2 === 0
                    ? "bg-white dark:bg-cardDark"
                    : "bg-gray-50 dark:bg-gray-800/50"
                }`}
              >
                <td className="py-4 px-4 text-sm text-gray-900 dark:text-textDark">
                  {record.date}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900 dark:text-textDark">
                  {record.course}
                </td>
                <td
                  className={`py-4 px-4 text-sm font-medium ${getStatusColor(record.status)}`}
                >
                  {record.status}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900 dark:text-textDark">
                  {record.professor}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900 dark:text-textDark">
                  {record.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
