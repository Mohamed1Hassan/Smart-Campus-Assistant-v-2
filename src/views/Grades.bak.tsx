"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  TrendingUp,
  BookOpen,
  AlertCircle,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import { getStudentGradesAction } from "../actions/grade.actions";
import { StatsSkeleton } from "../components/common/LoadingSkeleton";

export default function Grades() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const { data: gradesResponse, isLoading } = useQuery({
    queryKey: ["student-grades"],
    queryFn: async () => {
      const res = await getStudentGradesAction();
      if (res.success) return res.data;
      throw new Error(res.error);
    },
  });

  const grades = gradesResponse || [];

  const filteredGrades = grades.filter((g: any) => {
    const matchesSearch =
      g.course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.quiz?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "ALL" || g.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const gpa =
    (grades.reduce((acc: number, g: any) => acc + g.score / g.maxScore, 0) /
      (grades.length || 1)) *
    4;

  if (isLoading) {
    return (
      <DashboardLayout userType="student">
        <StatsSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="student">
      <div className="space-y-8 pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Academic Performance
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Track your progress across all courses
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cumulative GPA
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {gpa.toFixed(2)}
              </p>
            </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses or assessments..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {["ALL", "QUIZ", "EXAM", "ASSIGNMENT"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  filterType === type
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredGrades.map((grade: any, index: number) => (
              <motion.div
                key={grade.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-gray-600 dark:text-gray-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600 transition-colors">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      grade.score / grade.maxScore >= 0.8
                        ? "bg-emerald-100 text-emerald-700"
                        : grade.score / grade.maxScore >= 0.6
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {Math.round((grade.score / grade.maxScore) * 100)}%
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                  {grade.course.courseName}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {grade.quiz?.title || "General Assessment"}
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Score</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {grade.score} / {grade.maxScore}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        grade.score / grade.maxScore >= 0.8
                          ? "bg-emerald-500"
                          : grade.score / grade.maxScore >= 0.6
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{
                        width: `${(grade.score / grade.maxScore) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {new Date(grade.createdAt).toLocaleDateString()}
                  </span>
                  <button className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-1 hover:underline">
                    Feedback <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredGrades.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              No grades found
            </h3>
            <p className="text-gray-500">
              You haven't received any grades yet.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
