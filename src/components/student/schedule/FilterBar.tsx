"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Filter, Calendar, RotateCcw } from "lucide-react";
import { FilterOptions } from "../../../data/scheduleData";

interface FilterBarProps {
  filters: FilterOptions;
  searchTerm: string;
  onFilterChange: (filters: FilterOptions) => void;
  onSearchChange: (term: string) => void;
  onClearSearch: () => void;
}

export default function FilterBar({
  filters,
  searchTerm,
  onFilterChange,
  onSearchChange,
  onClearSearch,
}: FilterBarProps) {
  const dayOptions = [
    "Days",
    "Saturday",
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
  ];
  const statusOptions = ["Status", "Upcoming", "Ongoing", "Completed"];

  const hasActiveFilters =
    filters.day !== "Days" || filters.status !== "Status" || searchTerm;

  const resetFilters = () => {
    onFilterChange({ day: "Days", status: "Status" });
    onClearSearch();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/30 p-6 mb-6 sticky top-24 z-10"
    >
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by course or instructor..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-inner"
          />
          <AnimatePresence>
            {searchTerm && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={onClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
            <Filter className="w-3 h-3" />
            Filters
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Day Filter */}
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
              <select
                value={filters.day}
                onChange={(e) =>
                  onFilterChange({ ...filters, day: e.target.value })
                }
                className="w-full pl-10 pr-14 py-3 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 appearance-none cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
              >
                {dayOptions.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none">
                <div
                  className={`w-2.5 h-2.5 rounded-full border-2 border-current ${
                    filters.status === "Upcoming"
                      ? "text-amber-500"
                      : filters.status === "Ongoing"
                        ? "text-emerald-500"
                        : filters.status === "Completed"
                          ? "text-slate-500"
                          : "text-gray-400"
                  }`}
                />
              </div>
              <select
                value={filters.status}
                onChange={(e) =>
                  onFilterChange({ ...filters, status: e.target.value })
                }
                className="w-full pl-10 pr-14 py-3 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 appearance-none cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Filters Button */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onClick={resetFilters}
              className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-100 dark:border-red-900/30 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Filters
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Active Filters Summary */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50"
          >
            <div className="flex flex-wrap gap-2">
              {filters.day !== "Days" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <Calendar className="w-3 h-3" />
                  {filters.day}
                </span>
              )}
              {filters.status !== "Status" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                  <Filter className="w-3 h-3" />
                  {filters.status}
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-lg border border-purple-100 dark:border-purple-900/30">
                  <Search className="w-3 h-3" />
                  &quot;{searchTerm}&quot;
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
