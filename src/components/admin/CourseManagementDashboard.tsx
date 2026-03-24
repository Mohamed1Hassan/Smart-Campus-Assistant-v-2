"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  User,
  Clock,
  ShieldOff,
  Loader2,
  LayoutGrid,
  List,
  Users,
  ChevronRight,
  X,
  Image as ImageIcon,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { apiClient } from "@/services/api";
import { getCourseImage } from "@/utils/courseImages";

interface Course {
  id: number;
  courseCode: string;
  courseName: string;
  major?: string | null;
  level?: number | null;
  professor?: {
    firstName: string;
    lastName: string;
  } | null;
  professorId: number;
  semester: string;
  academicYear: string;
  isActive: boolean;
  credits: number;
  coverImage?: string | null;
  capacity: number;
  description?: string | null;
  _count?: {
    enrollments: number;
  };
}

interface Professor {
  id: number;
  firstName: string;
  lastName: string;
  universityId: string;
}

// Variants removed as they were unused

const CourseCard = React.memo(
  ({
    course,
    onEdit,
    onToggleStatus,
    onDelete,
  }: {
    course: Course;
    onEdit: (c: Course) => void;
    onToggleStatus: (id: number, status: boolean) => void;
    onDelete: (id: number) => void;
  }) => {
    const enrolledCount = course._count?.enrollments || 0;
    const capacity = course.capacity || 500;
    const enrollmentProgress = (enrolledCount / capacity) * 100;
    const [imgError, setImgError] = useState(false);
    const coverImg =
      course.coverImage || getCourseImage(course.courseName, course.id);

    return (
      <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col animate-in fade-in slide-in-from-bottom-4">
        <div className="relative h-44 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
          {!imgError ? (
            <Image
              src={coverImg}
              alt={course.courseName}
              onError={() => setImgError(true)}
              width={400}
              height={200}
              unoptimized
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-6 text-center">
              <div className="space-y-2">
                <ImageIcon className="w-8 h-8 text-white/40 mx-auto" />
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider leading-tight line-clamp-2">
                  {course.courseName}
                </p>
              </div>
            </div>
          )}
          <div className="absolute top-3 left-3 z-20 flex gap-2">
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
              {course.courseCode}
            </span>
            <span
              className={`px-2.5 py-1 backdrop-blur-md border rounded-lg text-[10px] font-bold uppercase tracking-wider ${course.isActive ? "bg-green-500/20 border-green-500/30 text-green-100" : "bg-gray-500/20 border-gray-500/30 text-gray-100"}`}
            >
              {course.isActive ? "Active" : "Archived"}
            </span>
          </div>
          <div className="absolute bottom-3 left-4 z-20 right-4">
            <h3 className="text-lg font-bold text-white line-clamp-1 leading-tight drop-shadow-md">
              {course.courseName}
            </h3>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <User className="w-4 h-4" />
                <span className="truncate max-w-[120px]">
                  {course.professor
                    ? `${course.professor.firstName} ${course.professor.lastName}`
                    : "Unassigned"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                <Clock className="w-4 h-4 text-blue-500" />
                {course.credits} Credits
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Capacity</span>
                <span className="text-gray-900 font-bold">
                  {enrolledCount} / {capacity}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(enrollmentProgress, 100)}%` }}
                  className={`h-full rounded-full transition-all duration-1000 ${enrollmentProgress >= 90 ? "bg-red-500" : enrollmentProgress >= 70 ? "bg-orange-500" : "bg-blue-600"}`}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(course)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Edit Course"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onToggleStatus(course.id, course.isActive)}
                className={`p-2 rounded-lg transition-all ${course.isActive ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                title={course.isActive ? "Archive" : "Activate"}
              >
                <ShieldOff className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => onDelete(course.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Delete Course"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  },
);

CourseCard.displayName = "CourseCard";

export default function CourseManagementDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [majors, setMajors] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [filters, setFilters] = useState({
    searchTerm: "",
    selectedMajor: "",
    selectedSemester: "",
    showArchived: false,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const [formData, setFormData] = useState({
    courseCode: "",
    courseName: "",
    description: "",
    major: "",
    level: 1,
    credits: 3,
    professorId: "",
    semester: "FALL",
    academicYear: "2024-2025",
    capacity: 500,
    coverImage: "",
  });

  const fetchCourses = useCallback(
    async (page = 1) => {
      // Cancel existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      try {
        let url = `/api/admin/courses?page=${page}&limit=${viewMode === "grid" ? 12 : 10}`;
        if (filters.searchTerm)
          url += `&query=${encodeURIComponent(filters.searchTerm)}`;
        if (filters.selectedMajor)
          url += `&major=${encodeURIComponent(filters.selectedMajor)}`;
        if (filters.selectedSemester)
          url += `&semester=${encodeURIComponent(filters.selectedSemester)}`;
        if (filters.showArchived) url += `&isArchived=true`;
        else url += `&isArchived=false`;

        const result = await apiClient.get<{
          courses: Course[];
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        }>(url, { signal: controller.signal });
        if (result.success && result.data) {
          setCourses(result.data.courses || []);
          setPagination({
            page: result.data.page,
            limit: result.data.limit,
            total: result.data.total,
            totalPages: result.data.totalPages,
          });
        }
      } catch (error: unknown) {
        if (
          (error as { name?: string; code?: string })?.name === "AbortError" ||
          (error as { name?: string; code?: string })?.code === "ERR_CANCELED"
        ) {
          return;
        }
        const errorMsg = (error as any)?.message || (error as any)?.error || JSON.stringify(error);
        console.error("Failed to fetch courses:", errorMsg);
      } finally {
        if (abortControllerRef.current === controller) {
          setLoading(false);
          abortControllerRef.current = null;
        }
      }
    },
    [filters, viewMode],
  );

  const fetchMajors = async () => {
    try {
      const result = await apiClient.get<string[]>(
        "/api/admin/courses?action=majors",
      );
      if (result.success && result.data) {
        setMajors(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch majors:", error);
    }
  };

  const fetchProfessors = async () => {
    try {
      const result = await apiClient.get<Professor[]>(
        "/api/admin/courses?action=professors",
      );
      if (result.success && result.data) {
        setProfessors(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch professors:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses(1);
    }, 300);
    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filters, viewMode, fetchCourses]);

  useEffect(() => {
    fetchMajors();
  }, []);

  useEffect(() => {
    if (showModal && professors.length === 0) {
      fetchProfessors();
    }
  }, [showModal, professors.length]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchCourses(newPage);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingCourseId(null);
    setFormData({
      courseCode: "",
      courseName: "",
      description: "",
      major: "",
      level: 1,
      credits: 3,
      professorId: "",
      semester: "FALL",
      academicYear: "2024-2025",
      capacity: 500,
      coverImage: "",
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setModalMode("edit");
    setEditingCourseId(course.id);
    setFormData({
      courseCode: course.courseCode,
      courseName: course.courseName,
      description: course.description || "",
      major: course.major || "",
      level: course.level || 1,
      credits: course.credits,
      professorId: String(course.professorId),
      semester: course.semester,
      academicYear: course.academicYear,
      capacity: course.capacity || 500,
      coverImage: course.coverImage || "",
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (
    courseId: number,
    currentStatus: boolean,
  ) => {
    try {
      const result = await apiClient.patch("/api/admin/courses", {
        courseId,
        isActive: !currentStatus,
      });
      if (result.success) {
        fetchCourses(pagination.page);
      }
    } catch (error) {
      console.error("Failed to toggle course status:", error);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm("Are you sure you want to archive this course?")) return;

    try {
      const result = await apiClient.delete(
        `/api/admin/courses?courseId=${courseId}`,
      );
      if (result.success) {
        fetchCourses(pagination.page);
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  // Stable callbacks to prevent React.memo from breaking on every filter keystroke
  const handlersRef = React.useRef({
    handleOpenEditModal,
    handleToggleStatus,
    handleDeleteCourse,
  });
  useEffect(() => {
    handlersRef.current = {
      handleOpenEditModal,
      handleToggleStatus,
      handleDeleteCourse,
    };
  });

  const onEditStable = React.useCallback(
    (course: Course) => handlersRef.current.handleOpenEditModal(course),
    [],
  );
  const onToggleStatusStable = React.useCallback(
    (id: number, status: boolean) =>
      handlersRef.current.handleToggleStatus(id, status),
    [],
  );
  const onDeleteStable = React.useCallback(
    (id: number) => handlersRef.current.handleDeleteCourse(id),
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.professorId) {
      alert("Please select a professor");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        professorId: parseInt(formData.professorId),
        capacity: parseInt(String(formData.capacity)),
        credits: parseInt(String(formData.credits)),
      };

      let result;
      if (modalMode === "create") {
        result = await apiClient.post("/api/admin/courses", data);
      } else {
        result = await apiClient.patch("/api/admin/courses", {
          courseId: editingCourseId,
          ...data,
        });
      }

      if (result.success) {
        setShowModal(false);
        fetchCourses(modalMode === "create" ? 1 : pagination.page);
      } else {
        alert(result.message || `Failed to ${modalMode} course`);
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Error occurred";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Course Management
            </h2>
            <p className="text-gray-500">
              Configure curriculum and academic offerings
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          Create New Course
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
            />
            {filters.searchTerm && (
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, searchTerm: "" }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={filters.selectedMajor}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, selectedMajor: e.target.value }))
            }
            className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-gray-50/50 font-medium min-w-[160px]"
          >
            <option value="">All Specializations</option>
            {majors.map((major) => (
              <option key={major} value={major}>
                {major}
              </option>
            ))}
          </select>

          <select
            value={filters.selectedSemester}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                selectedSemester: e.target.value,
              }))
            }
            className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-gray-50/50 font-medium min-w-[140px]"
          >
            <option value="">All Semesters</option>
            <option value="FALL">Fall</option>
            <option value="SPRING">Spring</option>
            <option value="SUMMER">Summer</option>
          </select>

          <label className="flex items-center gap-2 px-3 py-2 cursor-pointer bg-gray-50/50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
            <input
              type="checkbox"
              checked={filters.showArchived}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  showArchived: e.target.checked,
                }))
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-bold text-gray-700 select-none">
              Show Archived
            </span>
          </label>

          {(filters.selectedMajor ||
            filters.selectedSemester ||
            filters.searchTerm ||
            filters.showArchived) && (
            <button
              onClick={() => {
                setFilters({
                  searchTerm: "",
                  selectedMajor: "",
                  selectedSemester: "",
                  showArchived: false,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600 font-bold" : "text-gray-500 hover:text-gray-700"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-white shadow-sm text-blue-600 font-bold" : "text-gray-500 hover:text-gray-700"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Courses View */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {loading && courses.length === 0 ? (
            <div
              key="skeleton"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 animate-pulse"
                  >
                    <div className="h-40 bg-gray-100 rounded-xl" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                  </div>
                ))}
            </div>
          ) : courses.length > 0 ? (
            <div key="content" className="relative">
              {loading && (
                <div className="absolute inset-0 z-30 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-2xl transition-all">
                  <div className="bg-white p-4 rounded-full shadow-xl shadow-blue-500/10 border border-blue-50">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                </div>
              )}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {courses.map((course: Course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onEdit={onEditStable}
                      onToggleStatus={onToggleStatusStable}
                      onDelete={onDeleteStable}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Professor
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Enrollment
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {courses.map((course: Course) => (
                        <tr
                          key={course.id}
                          className="hover:bg-gray-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-100 relative">
                                <Image
                                  src={
                                    course.coverImage ||
                                    getCourseImage(course.courseName, course.id)
                                  }
                                  alt={course.courseName}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">
                                  {course.courseName}
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                  {course.courseCode}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-700">
                              {course.professor
                                ? `${course.professor.firstName} ${course.professor.lastName}`
                                : "Unassigned"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">
                                {course._count?.enrollments || 0}/
                                {course.capacity || 500}
                              </span>
                              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600"
                                  style={{
                                    width: `${Math.min(((course._count?.enrollments || 0) / (course.capacity || 500)) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${course.isActive ? "bg-green-50 text-green-700 border border-green-100" : "bg-gray-50 text-gray-500 border border-gray-100"}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${course.isActive ? "bg-green-500" : "bg-gray-400"}`}
                              />
                              {course.isActive ? "Active" : "Archived"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditModal(course)}
                                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleStatus(course.id, course.isActive)
                                }
                                className="p-2 text-gray-400 hover:text-orange-600 rounded-lg transition-all"
                              >
                                <ShieldOff className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(course.id)}
                                className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div
              key="empty"
              className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                No courses found
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Try adjusting your filters or create a new course to get
                started.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-bold text-gray-900">
              {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-gray-900">{pagination.total}</span>{" "}
            materials
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === pagination.totalPages ||
                  Math.abs(p - pagination.page) <= 1,
              )
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(p)}
                    className={`w-9 h-9 rounded-lg border font-bold text-sm transition-all ${pagination.page === p ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200" : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"}`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl my-auto shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 bg-gray-50/50 relative">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    {modalMode === "create" ? (
                      <Plus className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Edit2 className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {modalMode === "create"
                        ? "Create New Course"
                        : "Edit Course Details"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Provide the details for the academic course offering.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Course Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.courseName}
                      onChange={(e) =>
                        setFormData({ ...formData, courseName: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                      placeholder="Fundamentals of Data Science"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Course Code
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.courseCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          courseCode: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono"
                      placeholder="CS-101"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none"
                      placeholder="Brief overview of the course content..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Cover Image URL
                    </label>
                    <input
                      type="text"
                      value={formData.coverImage}
                      onChange={(e) =>
                        setFormData({ ...formData, coverImage: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      placeholder="https://images.unsplash.com/..."
                    />
                    <p className="text-[10px] text-gray-400">
                      Leave empty to use a topic-based default image.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Specialization (Major)
                    </label>
                    <input
                      type="text"
                      value={formData.major}
                      onChange={(e) =>
                        setFormData({ ...formData, major: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                      placeholder="e.g. إدارة أعمال"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Level
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          level: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-gray-50 cursor-pointer"
                    >
                      <option value={1}>Level 1</option>
                      <option value={2}>Level 2</option>
                      <option value={3}>Level 3</option>
                      <option value={4}>Level 4</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Student Capacity
                    </label>
                    <input
                      required
                      type="number"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capacity: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Credits
                    </label>
                    <input
                      required
                      type="number"
                      value={formData.credits}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          credits: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Assigned Professor
                    </label>
                    <select
                      required
                      value={formData.professorId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          professorId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-gray-50 cursor-pointer"
                    >
                      <option value="">Select a professor</option>
                      {professors.map((p: Professor) => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} ({p.universityId})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Semester
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-gray-50 cursor-pointer"
                    >
                      <option value="FALL">Fall</option>
                      <option value="SPRING">Spring</option>
                      <option value="SUMMER">Summer</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Academic Year
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          academicYear: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      placeholder="2024-2025"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all hover:border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-3.5 rounded-2xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : null}
                    {isSubmitting
                      ? modalMode === "create"
                        ? "Creating..."
                        : "Saving..."
                      : modalMode === "create"
                        ? "Create Course"
                        : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
