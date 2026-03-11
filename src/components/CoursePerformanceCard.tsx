import { ChevronRight } from "lucide-react";

export default function CoursePerformanceCard() {
  return (
    <div className="bg-white dark:bg-cardDark rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-textDark">
          Course Performance
        </h3>
        <button className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
          View all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="h-32 flex items-end justify-between gap-2 px-4">
        <div className="flex-1 bg-gradient-to-t from-blue-100 dark:from-blue-900/30 to-blue-50 dark:to-blue-800/20 rounded-t-lg h-[60%]"></div>
        <div className="flex-1 bg-gradient-to-t from-blue-100 dark:from-blue-900/30 to-blue-50 dark:to-blue-800/20 rounded-t-lg h-[80%]"></div>
        <div className="flex-1 bg-gradient-to-t from-blue-100 dark:from-blue-900/30 to-blue-50 dark:to-blue-800/20 rounded-t-lg h-[45%]"></div>
        <div className="flex-1 bg-gradient-to-t from-blue-100 dark:from-blue-900/30 to-blue-50 dark:to-blue-800/20 rounded-t-lg h-[70%]"></div>
        <div className="flex-1 bg-gradient-to-t from-blue-100 dark:from-blue-900/30 to-blue-50 dark:to-blue-800/20 rounded-t-lg h-[55%]"></div>
        <div className="flex-1 bg-gradient-to-t from-blue-100 dark:from-blue-900/30 to-blue-50 dark:to-blue-800/20 rounded-t-lg h-[90%]"></div>
      </div>
    </div>
  );
}
