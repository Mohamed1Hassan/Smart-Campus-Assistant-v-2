"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Search,
  LayoutGrid,
  List,
  Clock,
  ChevronRight,
  Users,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "../components/common/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../services/api";
// Image mapping is now handled by the backend

interface Course {
  id: string;
  name: string;
  code: string;
  professor: string;
  credits: number;
  scheduleTime?: string;
  description?: string;
  semester: string;
  academicYear: string;
  coverImage?: string;
}

export default function StudentCourses() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [imgErrors, setImgErrors] = useState<{ [key: string]: boolean }>({});

  const {
    data: courses = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["student-courses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await apiClient.get("/api/courses/student/enrolled");

      if (response.success && Array.isArray(response.data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.data.map((course: any) => ({
          id: String(course.id),
          name: course.name,
          code: course.code,
          professor: course.professor,
          credits: course.credits,
          semester: course.semester,
          academicYear: course.academicYear,
          scheduleTime: course.schedules?.[0]?.time,
          description: course.description,
          coverImage: course.coverImage,
        }));
      }
      throw new Error("Failed to fetch courses");
    },
    enabled: !!user && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnMount: true,
  });

  const filteredCourses = courses.filter(
    (course: Course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }, // Much faster
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: "easeOut" as const },
    },
  };

  return (
    <DashboardLayout userName={user?.firstName} userType="student">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20"
            >
              <BookOpen className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                My Courses
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                Access your course materials.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters & Search */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 dark:bg-cardDark/80 backdrop-blur-xl p-3 sm:p-4 rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-lg shadow-gray-200/50 dark:shadow-none flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center sticky top-20 z-30"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Course Grid */}
        {isError ? (
          <motion.div
            variants={itemVariants}
            className="text-center py-12 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20"
          >
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Failed to load courses
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              We couldn&apos;t fetch your courses. This might be due to a
              network issue or server timeout.
            </p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-500/20"
            >
              Try Again
            </button>
          </motion.div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                : "space-y-4"
            }
          >
            {filteredCourses.map((course: Course) => (
              <motion.div
                key={course.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                onClick={() =>
                  router.push(`/dashboard/student/courses/${course.id}`)
                }
                className={`group bg-white/80 dark:bg-cardDark/80 rounded-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-900/20 transition-all duration-300 cursor-pointer ${viewMode === "list" ? "flex flex-col sm:flex-row sm:items-center p-4 gap-4 sm:gap-6" : ""}`}
                style={{ willChange: "transform, opacity" }}
              >
                {/* Card Header (Grid Mode) */}
                {viewMode === "grid" && (
                  <div className="h-44 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                    {!imgErrors[course.id] ? (
                      <Image
                        src={
                          course.coverImage ||
                          "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1000&auto=format&fit=crop"
                        }
                        alt={course.name}
                        fill
                        unoptimized
                        onError={() =>
                          setImgErrors((prev) => ({
                            ...prev,
                            [course.id]: true,
                          }))
                        }
                        referrerPolicy="no-referrer"
                        className="object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-white/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 z-20 p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/30 shadow-sm">
                          {course.code} • {course.semester}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight drop-shadow-md group-hover:text-indigo-200 transition-colors">
                        {course.name}
                      </h3>
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div
                  className={`p-5 ${viewMode === "list" ? "flex-1 p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4" : ""}`}
                >
                  {viewMode === "list" && (
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm border border-indigo-100 dark:border-indigo-800">
                        {course.code.substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {course.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {course.code} • {course.semester}{" "}
                          {course.academicYear}
                        </p>
                      </div>
                    </div>
                  )}

                  <div
                    className={`space-y-3 ${viewMode === "list" ? "flex flex-wrap items-center gap-6 space-y-0 sm:mr-8" : ""}`}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span className="text-xs sm:text-sm">Professor</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                        {course.professor}
                      </span>
                    </div>

                    {course.scheduleTime && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs sm:text-sm">Schedule</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                          {course.scheduleTime}
                        </span>
                      </div>
                    )}
                  </div>

                  {viewMode === "grid" && (
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-medium text-sm group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        View Details
                      </span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white/50 dark:bg-cardDark/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-200 dark:border-gray-700"
          >
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No courses found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {searchTerm
                ? "Try adjusting your search terms."
                : "You are not enrolled in any courses yet."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20"
            >
              Refresh Courses
            </button>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
