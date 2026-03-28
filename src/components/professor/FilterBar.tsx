"use client";
import { motion } from "framer-motion";
import { Search, Filter, BookOpen } from "lucide-react";

interface FilterBarProps {
  selectedCourse: string;
  searchTerm: string;
  onCourseChange: (course: string) => void;
  onSearchChange: (term: string) => void;
  onFilter: () => void;
}

const courses = [
  "All Courses",
  "Machine Learning",
  "Operating Systems",
  "Databases",
  "Linear Algebra",
  "Artificial Intelligence",
];

export default function FilterBar({
  selectedCourse,
  searchTerm,
  onCourseChange,
  onSearchChange,
  onFilter,
}: FilterBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-cardDark rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-6"
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Course Filter */}
        <div className="flex-1">
          <label
            htmlFor="course-filter-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Filter by Course
          </label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-600" />
            <select
              id="course-filter-select"
              value={selectedCourse}
              onChange={(e) => onCourseChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-darkBg border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-textDark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Students
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-600" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or student ID..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-darkBg border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-textDark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Filter Button */}
        <div className="flex items-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onFilter}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
          >
            <Filter className="w-4 h-4" />
            Apply Filter
          </motion.button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedCourse !== "All Courses" || searchTerm) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 dark:text-mutedDark">
              Active filters:
            </span>
            {selectedCourse !== "All Courses" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                <BookOpen className="w-3 h-3" />
                {selectedCourse}
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                <Search className="w-3 h-3" />
                &quot;{searchTerm}&quot;
              </span>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
