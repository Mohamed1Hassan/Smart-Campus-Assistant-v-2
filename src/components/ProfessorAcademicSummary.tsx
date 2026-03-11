import { BookOpen, Users, Lightbulb, ChevronRight } from "lucide-react";
import Link from "next/link";

interface ProfessorAcademicSummaryProps {
  currentCourses: number;
  totalStudents: number;
  researchProjects: number;
}

export default function ProfessorAcademicSummary({
  currentCourses,
  totalStudents,
  researchProjects,
}: ProfessorAcademicSummaryProps) {
  return (
    <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-textDark mb-6">
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
            href="/professor-courses"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 mt-2 group"
          >
            View My Courses
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="bg-gradient-to-r from-green-50 dark:from-green-900/20 to-green-100 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-mutedDark">
                  Total Students
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-textDark">
                  {totalStudents}
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/professor-attendance"
            className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center gap-1 mt-2 group"
          >
            View Student Records
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="bg-gradient-to-r from-purple-50 dark:from-purple-900/20 to-purple-100 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-mutedDark">
                  Research Projects
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-textDark">
                  {researchProjects}
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/professor-dashboard"
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1 mt-2 group"
          >
            View Research Dashboard
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
