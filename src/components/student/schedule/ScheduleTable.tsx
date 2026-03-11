import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  User,
  CheckCircle,
  Play,
  AlertCircle,
  Calendar,
  BookOpen,
  BarChart,
  Briefcase,
  LineChart,
  GraduationCap,
  Terminal,
  PieChart,
  Monitor,
  Edit2,
} from "lucide-react";
import { ScheduleClass } from "../../../data/scheduleData";

interface ScheduleTableProps {
  classes: ScheduleClass[];
  currentDay: string;
  onEdit?: (schedule: ScheduleClass) => void;
}

const statusConfig = {
  upcoming: {
    icon: AlertCircle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100/50 dark:bg-amber-900/20",
    borderColor: "border-amber-200/50 dark:border-amber-700/30",
    Tag: "Upcoming",
  },
  ongoing: {
    icon: Play,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100/50 dark:bg-emerald-900/20",
    borderColor: "border-emerald-200/50 dark:border-emerald-700/30",
    Tag: "Ongoing",
  },
  completed: {
    icon: CheckCircle,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100/50 dark:bg-slate-800/50",
    borderColor: "border-slate-200/50 dark:border-slate-700/30",
    Tag: "Completed",
  },
};

const dayColors = {
  Sunday:
    "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200/50 dark:border-violet-700/30",
  Monday:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-700/30",
  Tuesday:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-700/30",
  Wednesday:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-700/30",
  Thursday:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-700/30",
  Friday:
    "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200/50 dark:border-cyan-700/30",
  Saturday:
    "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-700/30",
};

const getCourseIcon = (courseName: string) => {
  const lowerName = courseName.toLowerCase();

  // Specific overrides for better visual match
  if (
    lowerName.includes("programming") ||
    lowerName.includes("code") ||
    lowerName.includes("computer")
  )
    return Terminal;
  if (lowerName.includes("system") || lowerName.includes("enterprise"))
    return Monitor;
  if (
    lowerName.includes("data") ||
    lowerName.includes("analytics") ||
    lowerName.includes("mining")
  )
    return PieChart;

  // General categories
  if (lowerName.includes("statistics") || lowerName.includes("math"))
    return BarChart;
  if (
    lowerName.includes("management") ||
    lowerName.includes("business") ||
    lowerName.includes("strategic")
  )
    return Briefcase;
  if (lowerName.includes("project") || lowerName.includes("graduation"))
    return GraduationCap;
  if (lowerName.includes("analysis")) return LineChart;

  return BookOpen;
};

export default function ScheduleTable({
  classes,
  currentDay,
  onEdit,
}: ScheduleTableProps) {
  if (classes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/30 p-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"
        >
          <BookOpen className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </motion.div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          No classes found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto">
          Try adjusting your filters or search terms to find your classes
        </p>
      </motion.div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-hidden rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50">
                <th className="text-left py-5 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time
                  </div>
                </th>
                <th className="text-left py-5 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Course
                  </div>
                </th>
                <th className="text-left py-5 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Room
                  </div>
                </th>
                <th className="text-left py-5 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Instructor
                  </div>
                </th>
                <th className="text-left py-5 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                {onEdit && (
                  <th className="text-right py-5 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <AnimatePresence>
                {classes.map((cls, index) => {
                  const statusInfo = statusConfig[cls.status];
                  const StatusIcon = statusInfo.icon;
                  const CourseIcon = getCourseIcon(cls.course);
                  const isToday = cls.day === currentDay;

                  return (
                    <motion.tr
                      key={cls.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        group transition-colors duration-200
                        ${
                          isToday && cls.status === "ongoing"
                            ? "bg-indigo-50/50 dark:bg-indigo-900/10"
                            : "hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                        }
                      `}
                    >
                      <td className="py-5 px-6">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {cls.time.split(" - ")[0]}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {cls.duration}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2.5 rounded-xl ${dayColors[cls.day as keyof typeof dayColors]}`}
                          >
                            <CourseIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {cls.course}
                              </div>
                              {cls.type && (
                                <span
                                  title={cls.type}
                                  className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold border ${
                                    cls.type === "Lecture"
                                      ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                                      : "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800"
                                  }`}
                                >
                                  {cls.type === "Lecture" ? "L" : "S"}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {cls.day}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <div className="w-16 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 px-2">
                            {cls.room}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                            {cls.instructor
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)}
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {cls.instructor}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor} border shadow-sm`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.Tag}
                        </span>
                      </td>
                      {onEdit && (
                        <td className="py-5 px-6 text-right">
                          <button
                            onClick={() => onEdit(cls)}
                            className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden space-y-4">
        <AnimatePresence>
          {classes.map((classItem, index) => {
            const statusInfo =
              statusConfig[classItem.status as keyof typeof statusConfig] ||
              statusConfig.upcoming;
            const StatusIcon = statusInfo.icon;
            const isCurrentDay = classItem.day === currentDay;
            const dayColorClass =
              dayColors[classItem.day as keyof typeof dayColors] || "";
            const CourseIcon = getCourseIcon(classItem.course);

            return (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className={`relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-white/20 dark:border-gray-700/30 ${
                  isCurrentDay ? "ring-2 ring-blue-500/50" : ""
                }`}
              >
                {isCurrentDay && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-bl-xl shadow-sm">
                    TODAY
                  </div>
                )}

                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl ${dayColorClass} border flex items-center justify-center shadow-sm shrink-0`}
                  >
                    <CourseIcon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate mb-1 flex items-center gap-2">
                      {classItem.course}
                      {classItem.type && (
                        <span
                          title={classItem.type}
                          className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold border ${
                            classItem.type === "Lecture"
                              ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                              : "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800"
                          }`}
                        >
                          {classItem.type === "Lecture" ? "L" : "S"}
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{classItem.day}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      Time
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      {classItem.time}
                    </div>
                  </div>
                  <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Room
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      {classItem.room}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                      {classItem.instructor.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {classItem.instructor}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor} border`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.Tag}
                    </span>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(classItem)}
                        className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-400 hover:text-indigo-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
