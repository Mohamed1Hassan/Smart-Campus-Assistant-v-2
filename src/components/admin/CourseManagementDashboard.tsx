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
  ShieldCheck,
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
      <div className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-500 flex flex-col animate-in fade-in slide-in-from-bottom-4">
        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 opacity-60 group-hover:opacity-80 transition-opacity" />
          {!imgError ? (
            <Image
              src={coverImg}
              alt={course.courseName}
              onError={() => setImgError(true)}
              width={400}
              height={220}
              unoptimized
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-6 text-center">
              <div className="space-y-2">
                <ImageIcon className="w-10 h-10 text-white/30 mx-auto" />
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest leading-tight line-clamp-2 px-4">
                  {course.courseName}
                </p>
              </div>
            </div>
          )}
          <div className="absolute top-4 left-4 z-20 flex gap-2">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-[10px] font-black text-white uppercase tracking-widest">
              {course.courseCode}
            </span>
            <span
              className={`px-3 py-1 backdrop-blur-md border rounded-xl text-[10px] font-black uppercase tracking-widest ${course.isActive ? "bg-green-500/20 border-green-500/30 text-green-100" : "bg-red-500/20 border-red-500/30 text-red-100"}`}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${course.isActive ? "bg-green-400" : "bg-red-400"}`}></span>
              {course.isActive ? "Active" : "Archived"}
            </span>
          </div>
          <div className="absolute bottom-4 left-5 z-20 right-5">
            <h3 className="text-xl font-black text-white line-clamp-1 leading-tight drop-shadow-lg tracking-tight">
              {course.courseName}
            </h3>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-gray-500 font-bold">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100/50">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="truncate max-w-[120px]">
                  {course.professor
                    ? `${course.professor.firstName} ${course.professor.lastName}`
                    : "Unassigned"}
                </span>
              </div>
              <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-black text-[10px] uppercase tracking-widest">
                {course.credits} Credits
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest leading-none">
                <span className="text-gray-400">Enrollment</span>
                <span className="text-gray-900 font-black">
                  {enrolledCount} / {capacity}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                <div
                  style={{ width: `${Math.min(enrollmentProgress, 100)}%` }}
                  className={`h-full rounded-full transition-all duration-1000 ${enrollmentProgress >= 90 ? "bg-red-500Shadow" : enrollmentProgress >= 70 ? "bg-orange-500" : "bg-blue-600 shadow-lg shadow-blue-500/20"}`}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
            <div className="flex gap-1.5">
              <button
                onClick={() => onEdit(course)}
                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                title="Edit Course"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onToggleStatus(course.id, course.isActive)}
                className={`p-2.5 rounded-xl transition-all border border-transparent ${course.isActive ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-100" : "text-gray-400 hover:text-green-600 hover:bg-green-50 hover:border-green-100"}`}
                title={course.isActive ? "Archive" : "Activate"}
              >
                <ShieldOff className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => onDelete(course.id)}
              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
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
        const err = error as any;
        if (
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          err?.code === "ABORT_ERROR"
        ) {
          return;
        }
        const errorMsg = err?.message || err?.error || JSON.stringify(error);
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
    <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mix-blend-isolation">
      {/* Header Area */}
      <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-r from-gray-50/50 to-white/30">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600">
            Curriculum Management
          </h2>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            Review and organize the academic course catalog.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100/50 p-1 rounded-2xl border border-gray-100/50">
             <button 
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
             >
                <LayoutGrid className="w-4 h-4" />
             </button>
             <button 
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl transition-all ${viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
             >
                <List className="w-4 h-4" />
             </button>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all text-xs uppercase tracking-widest flex items-center gap-2 group shrink-0"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4 items-center bg-white/50">
        <div className="relative flex-1 min-w-[300px] group">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search courses by name, code, or description..."
            value={filters.searchTerm}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
            }
            className="w-full pl-12 pr-12 py-3 rounded-2xl border border-gray-100 bg-white/50 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-medium shadow-sm"
          />
          {filters.searchTerm && (
            <button
              onClick={() =>
                setFilters((prev) => ({ ...prev, searchTerm: "" }))
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <select
              value={filters.selectedMajor}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, selectedMajor: e.target.value }))
              }
              className="appearance-none pl-4 pr-10 py-3 rounded-2xl border border-gray-100 bg-white/50 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-[10px] font-black uppercase tracking-widest text-gray-700 cursor-pointer min-w-[170px] shadow-sm"
            >
              <option value="">All Specializations</option>
              {majors.map((major) => (
                <option key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90 group-hover:translate-y-[-40%] transition-transform" />
          </div>

          <div className="relative group">
            <select
              value={filters.selectedSemester}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  selectedSemester: e.target.value,
                }))
              }
              className="appearance-none pl-4 pr-11 py-3 rounded-2xl border border-gray-100 bg-white/50 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-[10px] font-black uppercase tracking-widest text-gray-700 cursor-pointer min-w-[150px] shadow-sm"
            >
              <option value="">All Semesters</option>
              <option value="FALL">Fall</option>
              <option value="SPRING">Spring</option>
              <option value="SUMMER">Summer</option>
            </select>
            <ChevronRight className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90 group-hover:translate-y-[-40%] transition-transform" />
          </div>

          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                showArchived: !prev.showArchived,
              }))
            }
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              filters.showArchived 
              ? "bg-amber-50 border-amber-200 text-amber-700 shadow-inner" 
              : "bg-white border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-100"
            }`}
          >
            {filters.showArchived ? "Hidden (Archived)" : "Show Archived"}
          </button>

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
              className="flex items-center gap-1.5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
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
            <div key="content" className="relative p-8">
              {loading && (
                <div className="absolute inset-0 z-[40] bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-[3rem] transition-all">
                  <div className="bg-white p-5 rounded-[2rem] shadow-2xl shadow-blue-500/10 border border-blue-50/50">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  </div>
                </div>
              )}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                <div className="bg-white/30 rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 first:pl-10">
                          Academic Course
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                          Faculty
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                          Engagement
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                          Security
                        </th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pr-10">
                          Operations
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/50">
                      {courses.map((course: Course) => (
                        <tr
                          key={course.id}
                          className="hover:bg-blue-50/30 transition-all group/row"
                        >
                          <td className="px-8 py-5 first:pl-10">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/10 shrink-0 group-hover/row:scale-110 transition-transform duration-300">
                                {course.courseCode.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 group-hover/row:text-blue-600 transition-colors uppercase tracking-tight">
                                  {course.courseName}
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mt-0.5">
                                  {course.courseCode}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2.5 text-xs font-bold text-gray-700">
                               <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100/50 text-gray-400 group-hover/row:text-blue-500 transition-colors">
                                  <User className="w-3.5 h-3.5" />
                               </div>
                               {course.professor
                                 ? `${course.professor.firstName} ${course.professor.lastName}`
                                 : "Unassigned"}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="text-xs font-black text-gray-900">
                                {course._count?.enrollments || 0}/
                                {course.capacity || 500}
                              </div>
                              <div className="w-20 h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                                <div
                                  className="h-full bg-blue-600 shadow-[0_0_8px_rgb(37,99,235,0.3)] transition-all duration-1000"
                                  style={{
                                    width: `${Math.min(((course._count?.enrollments || 0) / (course.capacity || 500)) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                course.isActive 
                                ? "bg-green-50 text-green-700 border-green-100 shadow-sm shadow-green-500/5" 
                                : "bg-red-50 text-red-700 border-red-100 shadow-sm shadow-red-500/5"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${course.isActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                              />
                              {course.isActive ? "Active" : "Archived"}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right pr-10">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0">
                              <button
                                onClick={() => handleOpenEditModal(course)}
                                className="p-2.5 text-gray-400 hover:text-blue-600 rounded-xl transition-all border border-transparent hover:border-blue-100 hover:bg-blue-50"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleStatus(course.id, course.isActive)
                                }
                                className={`p-2.5 rounded-xl transition-all border border-transparent ${course.isActive ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-100" : "text-gray-400 hover:text-green-600 hover:bg-green-50 hover:border-green-100"}`}
                              >
                                <ShieldOff className="w-4 h-4" />
                              </button>
                              <div className="h-4 w-px bg-gray-100 mx-1"></div>
                              <button
                                onClick={() => handleDeleteCourse(course.id)}
                                className="p-2.5 text-gray-400 hover:text-red-600 rounded-xl transition-all border border-transparent hover:border-red-100 hover:bg-red-50"
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
      <div className="p-8 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 bg-white/50 px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
          Displaying <span className="text-gray-900">{(pagination.page - 1) * pagination.limit + 1}</span> -{" "}
          <span className="text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> 
          <span className="mx-2 text-gray-200">|</span> Total <span className="text-blue-600">{pagination.total}</span>
        </div>
        
        <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              pagination.page === 1 
              ? "text-gray-300 bg-gray-50/50 cursor-not-allowed" 
              : "bg-white text-gray-600 hover:text-blue-600 shadow-sm border border-gray-100/50 active:scale-95"
            }`}
          >
            Prev
          </button>
          
          <div className="hidden sm:flex items-center gap-1.5 px-1">
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
                    <span className="px-2 text-gray-300 font-black">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(p)}
                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                      pagination.page === p 
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-110 z-10" 
                      : "hover:bg-white text-gray-400 border border-transparent hover:border-gray-100 hover:text-gray-900 active:scale-95"
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              pagination.page === pagination.totalPages 
              ? "text-gray-300 bg-gray-50/50 cursor-not-allowed" 
              : "bg-white text-gray-600 hover:text-blue-600 shadow-sm border border-gray-100/50 active:scale-95"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] w-full max-w-2xl my-auto shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden border border-white/60"
            >
              <div className="p-10 border-b border-gray-100 bg-gradient-to-br from-gray-50/80 to-white/20 relative">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-8 right-8 p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group/close"
                >
                  <X className="w-5 h-5 group-hover/close:rotate-90 transition-transform duration-300" />
                </button>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-300">
                    {modalMode === "create" ? (
                      <Plus className="w-8 h-8" />
                    ) : (
                      <Edit2 className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                      {modalMode === "create"
                        ? "Curriculum Evolution"
                        : "Refine Offering"}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                      {modalMode === "create" 
                        ? "Initialize a new academic course in the system."
                        : "Update course parameters and identifiers."}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Full Academic Title
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.courseName}
                      onChange={(e) =>
                        setFormData({ ...formData, courseName: e.target.value })
                      }
                      className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all placeholder:text-gray-200 font-bold text-gray-900 shadow-sm"
                      placeholder="Fundamentals of Neural Networks"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Course Token (Code)
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
                      className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all font-mono font-black text-blue-600 bg-blue-50/10 shadow-sm"
                      placeholder="CS-402"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Curriculum Abstract
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
                      className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all resize-none font-medium text-gray-600 shadow-sm"
                      placeholder="Establish a brief overview of the learning objectives and core curriculum components..."
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                      Visual Identity URL
                    </label>
                    <input
                      type="text"
                      value={formData.coverImage}
                      onChange={(e) =>
                        setFormData({ ...formData, coverImage: e.target.value })
                      }
                      className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all text-xs font-mono text-gray-400 shadow-sm"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Academic Domain
                    </label>
                    <input
                      type="text"
                      value={formData.major}
                      onChange={(e) =>
                        setFormData({ ...formData, major: e.target.value })
                      }
                      className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-900 shadow-sm"
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Level
                    </label>
                    <div className="relative group/sel">
                      <select
                        value={formData.level}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            level: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-900 shadow-sm appearance-none cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5].map(lv => <option key={lv} value={lv}>Level {lv}</option>)}
                      </select>
                      <ChevronRight className="w-4 h-4 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90 group-hover/sel:translate-y-[-40%] transition-transform" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Academic Credits
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
                      className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-900 shadow-sm"
                      min="1"
                      max="10"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Faculty Assignment
                    </label>
                    <div className="relative group/sel">
                      <select
                        required
                        value={formData.professorId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            professorId: e.target.value,
                          })
                        }
                        className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-900 shadow-sm appearance-none cursor-pointer"
                      >
                        <option value="">Choose Professor...</option>
                        {professors.map((p: Professor) => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="w-4 h-4 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90 group-hover/sel:translate-y-[-40%] transition-transform" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Academic Term
                    </label>
                    <div className="relative group/sel">
                      <select
                        value={formData.semester}
                        onChange={(e) =>
                          setFormData({ ...formData, semester: e.target.value })
                        }
                        className="w-full px-5 py-4 rounded-[1.25rem] border border-gray-100 bg-white focus:border-blue-500/50 focus:ring-[6px] focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-900 shadow-sm appearance-none cursor-pointer"
                      >
                        <option value="FALL">Fall Semester</option>
                        <option value="SPRING">Spring Semester</option>
                        <option value="SUMMER">Summer Term</option>
                      </select>
                      <ChevronRight className="w-4 h-4 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90 group-hover/sel:translate-y-[-40%] transition-transform" />
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-gray-50 flex items-center justify-between gap-6">
                   <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-8 py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-sm"
                  >
                    Discard Changes
                  </button>
                  <button
                    disabled={isSubmitting}
                    className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all text-[10px] uppercase tracking-widest flex items-center gap-3 group disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 group-hover:scale-125 transition-transform" />
                    )}
                    <span>{modalMode === "create" ? "Initiate Offering" : "Authorize Changes"}</span>
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
