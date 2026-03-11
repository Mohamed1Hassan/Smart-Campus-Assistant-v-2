import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface ClassItem {
  course: string;
  date: string;
  time: string;
  room: string;
  status: "upcoming" | "in-progress" | "completed";
}

interface ClassesTableProps {
  classes: ClassItem[];
  searchTerm?: string;
  statusFilter?: "all" | "upcoming" | "in-progress" | "completed";
}

const statusConfig = {
  upcoming: {
    icon: Clock,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    text: "Upcoming",
  },
  "in-progress": {
    icon: AlertCircle,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    text: "In Progress",
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    text: "Completed",
  },
};

export default function ClassesTable({
  classes,
  searchTerm = "",
  statusFilter = "all",
}: ClassesTableProps) {
  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch =
      !searchTerm ||
      classItem.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.room.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || classItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
      role="region"
      aria-labelledby="classes-table-heading"
    >
      <h3
        id="classes-table-heading"
        className="text-lg font-semibold text-gray-900 dark:text-textDark mb-6"
      >
        Upcoming Classes
      </h3>

      {filteredClasses.length === 0 ? (
        <div className="text-center py-12" role="status" aria-live="polite">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            No classes found
          </p>
          {searchTerm && (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Try adjusting your search
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-mutedDark">
                  Course
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-mutedDark">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-mutedDark">
                  Time
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-mutedDark">
                  Room
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-mutedDark">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map((classItem, index) => {
                const statusInfo = statusConfig[classItem.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="font-medium text-gray-900 dark:text-textDark">
                          {classItem.course}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-mutedDark">
                      {classItem.date}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-mutedDark">
                      {classItem.time}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-mutedDark">
                          {classItem.room}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.text}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
