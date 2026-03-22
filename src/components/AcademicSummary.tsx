import { BookOpen, Calendar, UserCheck, ChevronRight } from "lucide-react";
import Link from "next/link";

interface AcademicSummaryProps {
  currentCourses: number;
  upcomingExams: number;
}

export default function AcademicSummary({
  currentCourses,
  upcomingExams,
}: AcademicSummaryProps) {
  return (
    <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-white/50 dark:border-gray-700/50 p-6 sm:p-8 hover:shadow-2xl transition-all group">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        <BookOpen className="w-5 h-5 text-indigo-500" />
        Academic Summary
      </h2>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-blue-50/80 dark:from-blue-900/40 to-blue-100/80 dark:to-blue-800/40 rounded-2xl p-4 sm:p-5 border border-blue-200/50 dark:border-blue-800/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-mutedDark">
                  Current Courses
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-textDark">
                  {currentCourses}
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/student/schedule"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 mt-2 group"
          >
            View Schedule
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-orange-50/80 dark:from-orange-900/40 to-orange-100/80 dark:to-orange-800/40 rounded-2xl p-4 sm:p-5 border border-orange-200/50 dark:border-orange-800/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/10 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-mutedDark">
                  Upcoming Exams
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-textDark">
                  {upcomingExams}
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/student/schedule"
            className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium flex items-center gap-1 mt-2 group"
          >
            View Exam Schedule
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-green-50/80 dark:from-green-900/40 to-green-100/80 dark:to-green-800/40 rounded-2xl p-4 sm:p-5 border border-green-200/50 dark:border-green-800/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/10 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-mutedDark">
                  Attendance Records
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-textDark">
                  View Details
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/student/attendance"
            className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center gap-1 mt-2 group"
          >
            View Attendance
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
