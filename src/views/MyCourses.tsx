"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Plus,
  BookOpen,
  Users,
  Clock,
  Search,
  Trash2,
  Edit,
  ExternalLink,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../components/common/DashboardLayout";
import AddCourseModal from "../components/professor/AddCourseModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/common/ToastProvider";
import { apiClient } from "../services/api";
import { getCourseImage } from "@/utils/courseImages";

interface Course {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  maxStudents: number;
  scheduleTime?: string;
  professorName?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  semester?: string;
  academicYear?: string;
  coverImage?: string;
}

export default function MyCourses() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const professorId =
    typeof user?.id === "string" ? parseInt(user.id) : user?.id;

  // Fetch courses using React Query
  const {
    data: courses = [],
    isLoading,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["professor-courses", professorId, "full"],
    queryFn: async () => {
      console.log("Fetching courses for professor:", professorId);
      if (!isAuthenticated || !professorId) return [];

      const response = await apiClient.get("/api/courses", {
        params: { professorId },
      });

      if (response.success && Array.isArray(response.data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.data.map((course: any) => ({
          id: String(course.id),
          name: course.courseName,
          code: course.courseCode,
          studentCount:
            course._count?.enrollments ??
            (Array.isArray(course.enrollments)
              ? course.enrollments.length
              : course.enrolledCount || 0),
          maxStudents: course.capacity || 500,
          scheduleTime: course.schedules?.[0]
            ? `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][course.schedules[0].dayOfWeek]} ${course.schedules[0].startTime}`
            : undefined,
          professorName: course.professor
            ? `${course.professor.firstName} ${course.professor.lastName}`
            : undefined,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          description: course.description,
          semester: course.semester,
          academicYear: course.academicYear,
          coverImage: course.coverImage,
        }));
      }
      throw new Error("Invalid response format");
    },
    enabled: !!isAuthenticated && !!professorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    refetchOnMount: true,
  });

  // Debug effect
  useMemo(() => {
    console.log("MyCourses State:", {
      isAuthenticated,
      professorId,
      isLoading,
      isPending,
      hasData: courses.length > 0,
    });
  }, [isAuthenticated, professorId, isLoading, isPending, courses.length]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (courseId: string) => {
      await apiClient.delete(`/api/courses/${courseId}`);
      return courseId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professor-courses"] });
      success("Course deleted successfully");
    },
    onError: () => {
      showError("Failed to delete course");
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddCourse = async (newCourseData: any) => {
    try {
      const response = await apiClient.post("/api/courses", {
        ...newCourseData,
        courseCode: newCourseData.code,
        courseName: newCourseData.name,
        professorId,
      });

      if (response.success) {
        success("Course created successfully");
        queryClient.invalidateQueries({ queryKey: ["professor-courses"] });
        setShowAddModal(false);
      }
    } catch {
      showError("Failed to create course");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    deleteMutation.mutate(courseId);
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course: Course) => {
      const matchesSearch =
        course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [courses, searchTerm]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  // Determine if we are effectively loading
  // In v5, isPending is true if there is no data yet (status === 'pending')
  // isLoading is true only if status === 'pending' AND isFetching is true
  // We want to show loading state if we are pending (no data) or if auth is loading
  const isEffectiveLoading =
    isPending || isAuthLoading || (isAuthenticated && !professorId);

  return (
    <DashboardLayout
      userName={user ? `${user.firstName} ${user.lastName}` : "Professor"}
      userType="professor"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8 pb-12"
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
              className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0"
            >
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </motion.div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                My Courses
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
                Manage your curriculum and students.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
            >
              <Plus className="w-5 h-5" />
              Add Course
            </motion.button>
          </div>
        </motion.div>

        {/* Filters & Search */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 dark:bg-cardDark/80 backdrop-blur-xl p-3 sm:p-4 rounded-3xl border border-white/40 dark:border-gray-700/50 shadow-lg shadow-gray-200/50 dark:shadow-none flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center sticky top-20 z-30"
        >
          <div className="relative flex-1 sm:w-96 sm:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50/80 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex bg-gray-100/80 dark:bg-gray-800/80 p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-xl transition-all ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-xl transition-all ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Error State */}
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
        ) : isEffectiveLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                className={`group bg-white/80 dark:bg-cardDark/80 rounded-3xl border border-white/40 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-blue-900/30 transition-all duration-500 ${
                  viewMode === "list"
                    ? "flex flex-col sm:flex-row sm:items-center p-4 gap-4 sm:gap-6"
                    : "flex flex-col"
                }`}
              >
                {/* Card Header (Grid Mode) */}
                {viewMode === "grid" && (
                  <div className="h-48 sm:h-52 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80 z-10" />
                    <Image
                       
                      src={
                        (course as { coverImage?: string }).coverImage ||
                        getCourseImage(course.name, course.id)
                      }
                      alt={course.name}
                      fill
                      unoptimized
                      className="object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 z-20 p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-xs font-extrabold text-white border border-white/30 shadow-sm uppercase tracking-wider">
                          {course.code} • {course.semester}
                        </span>
                        <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCourse(course.id);
                            }}
                            className="p-2.5 bg-black/40 backdrop-blur-md rounded-xl text-white/90 hover:bg-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-extrabold text-white line-clamp-2 leading-tight drop-shadow-lg group-hover:text-blue-200 transition-colors">
                        {course.name}
                      </h3>
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div
                  className={`p-5 sm:p-6 ${
                    viewMode === "list"
                      ? "flex-1 p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0"
                      : "flex-1 flex flex-col justify-between"
                  }`}
                >
                  {viewMode === "list" && (
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-500/20">
                        {course.code.substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {course.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                          {course.code} • {course.semester}{" "}
                          {course.academicYear}
                        </p>
                      </div>
                    </div>
                  )}

                  <div
                    className={`${
                      viewMode === "list"
                        ? "flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-8 bg-gray-50/50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 w-full sm:w-auto sm:mr-8"
                        : "mt-2 space-y-4"
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm w-full sm:w-auto gap-4">
                      <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span>Students</span>
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white text-sm text-right">
                        {course.studentCount} / {course.maxStudents}
                      </span>
                    </div>

                    {course.scheduleTime && (
                      <div className="flex items-center justify-between text-sm w-full sm:w-auto gap-4">
                        <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
                          <div className="p-1.5 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                            <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <span>Schedule</span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white text-sm text-right">
                          {course.scheduleTime}
                        </span>
                      </div>
                    )}

                    {viewMode === "grid" && (
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${(course.studentCount / course.maxStudents) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {viewMode === "grid" && (
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-3">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/professor/courses/${course.id}`,
                          )
                        }
                        className="flex-1 bg-gray-50 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-900/20 text-gray-700 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-300 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group-hover:border-blue-200 dark:group-hover:border-blue-800 border border-transparent shadow-sm"
                      >
                        Manage Course
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button className="p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors border border-gray-100 dark:border-gray-700 shadow-sm">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {viewMode === "list" && (
                    <div className="flex items-center gap-2 self-end sm:self-auto mt-2 sm:mt-0">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/professor/courses/${course.id}`,
                          )
                        }
                        className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-blue-600 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={itemVariants}
            className="text-center py-20 bg-white dark:bg-cardDark rounded-3xl border border-dashed border-gray-200 dark:border-gray-700"
          >
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No courses found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
              Get started by creating your first course. You can manage
              students, attendance, and materials.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
            >
              Create First Course
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      <AddCourseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddCourse={handleAddCourse}
      />
    </DashboardLayout>
  );
}
