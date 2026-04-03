"use client";
import { useState, useEffect } from "react";
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

interface StudentCoursesProps {
  initialCourses?: Course[];
}

export default function StudentCourses({ initialCourses = [] }: StudentCoursesProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [imgErrors, setImgErrors] = useState<{ [key: string]: boolean }>({});
  
  // Fix hydration mismatch (#418)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: courses = initialCourses.length > 0 ? initialCourses : ([] as Course[]),
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["student-courses", user?.id],
    queryFn: async () => {
      if (!user) return initialCourses;
      const response = await apiClient.get("/api/courses/student/enrolled");

      if (response.success && Array.isArray(response.data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedCourses = response.data.map((course: any): Course => ({
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
        return mappedCourses;
      }
      return initialCourses;
    },
    initialData: initialCourses.length > 0 ? initialCourses : undefined,
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
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 sm:p-0 bg-white/60 sm:bg-transparent dark:bg-gray-800/60 sm:dark:bg-transparent rounded-3xl sm:rounded-none border border-white/40 dark:border-gray-700/40 sm:border-transparent shadow-sm sm:shadow-none backdrop-blur-xl"
        >
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0"
            >
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </motion.div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                My Courses
              </h1>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mt-0.5 sm:mt-1 font-bold">
                Access your course materials.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters & Search */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 dark:bg-cardDark/80 backdrop-blur-xl p-3 sm:p-4 rounded-3xl border border-white/40 dark:border-gray-700/50 shadow-lg shadow-gray-200/50 dark:shadow-none flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center sticky top-20 z-30"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-gray-300" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50/80 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-bold placeholder:text-gray-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex bg-gray-100/80 dark:bg-gray-800/80 p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-xl transition-all ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-xl transition-all ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                aria-label="List view"
              >
                <List className="w-5 h-5" />
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Failed to load courses
            </h2>
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
                className={`group bg-white/80 dark:bg-cardDark/80 rounded-3xl border border-white/40 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/20 dark:hover:shadow-indigo-900/30 transition-all duration-500 cursor-pointer ${
                  viewMode === "list"
                    ? "flex flex-col sm:flex-row sm:items-center p-4 gap-4 sm:gap-6"
                    : "flex flex-col"
                }`}
                style={{ willChange: "transform, opacity" }}
              >
                {/* Card Header (Grid Mode) */}
                {viewMode === "grid" && (
                  <div className="h-48 sm:h-52 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80 z-10" />
                    {!imgErrors[course.id] ? (
                      <Image
                        src={
                          course.coverImage ||
                          "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1000&auto=format&fit=crop"
                        }
                        alt={course.name}
                        fill
                        priority={courses.indexOf(course) < 1}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        fetchPriority={courses.indexOf(course) === 0 ? "high" : "auto"}
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
                        <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-xs font-extrabold text-white border border-white/30 shadow-sm uppercase tracking-wider">
                          {course.code} • {course.semester}
                        </span>
                      </div>
                      <h2 className="text-xl font-extrabold text-white line-clamp-2 leading-tight drop-shadow-lg group-hover:text-indigo-200 transition-colors">
                        {course.name}
                      </h2>
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div
                  className={`p-5 sm:p-6 ${
                    viewMode === "list"
                      ? "flex-1 p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      : "flex-1 flex flex-col justify-between"
                  }`}
                >
                  {viewMode === "list" && (
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-indigo-500/20">
                        {course.code.substring(0, 2)}
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {course.name}
                        </h2>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-bold mt-0.5">
                          {course.code} • {course.semester}{" "}
                          {course.academicYear}
                        </p>
                      </div>
                    </div>
                  )}

                  <div
                    className={`${
                      viewMode === "list"
                        ? "flex flex-wrap items-center justify-between gap-4 sm:mr-8 bg-gray-50/50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 w-full sm:w-auto"
                        : "mt-2 space-y-3"
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm w-full sm:w-auto gap-4">
                      <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300 font-bold shrink-0">
                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-sm">Professor</span>
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white text-sm text-right">
                        {course.professor}
                      </span>
                    </div>

                    {course.scheduleTime && (
                      <div className="flex items-center justify-between text-sm w-full sm:w-auto gap-4">
                        <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300 font-bold shrink-0">
                          <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-sm">Schedule</span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white text-sm text-right">
                          {course.scheduleTime}
                        </span>
                      </div>
                    )}
                  </div>

                  {viewMode === "grid" && (
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                      <button className="w-full bg-gray-50 hover:bg-indigo-50 dark:bg-gray-800 dark:hover:bg-indigo-900/20 text-gray-700 hover:text-indigo-700 dark:text-gray-300 dark:hover:text-indigo-300 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 border border-transparent shadow-sm">
                        View Course Details
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}
                  {viewMode === "list" && (
                     <div className="hidden sm:flex items-center text-indigo-500">
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No courses found
            </h2>
            <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto">
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
