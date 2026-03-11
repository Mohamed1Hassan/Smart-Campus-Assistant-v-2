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
    <div className="bg-white dark:bg-cardDark rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-textDark mb-6">
        Academic Summary
      </h2>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 dark:from-blue-900/20 to-blue-100 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/30">
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

        <div className="bg-gradient-to-r from-orange-50 dark:from-orange-900/20 to-orange-100 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800/30">
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

        <div className="bg-gradient-to-r from-green-50 dark:from-green-900/20 to-green-100 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800/30">
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
