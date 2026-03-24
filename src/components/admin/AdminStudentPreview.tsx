"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  Calendar,
  Search,
  Edit2,
  Loader2,
  AlertCircle,
  ChevronRight,
  X,
  Image as ImageIcon,
} from "lucide-react";
import NextImage from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/services/api";
import { getCourseImage } from "@/utils/courseImages";
import ScheduleTable from "../student/schedule/ScheduleTable";
import { ScheduleClass } from "../../data/scheduleData";
import { useToast } from "../common/ToastProvider";

interface Course {
  id: number;
  courseCode: string;
  courseName: string;
  professorId: number;
  professor?: {
    firstName: string;
    lastName: string;
  };
  level: number;
  major: string;
  semester: string;
  academicYear: string;
  credits: number;
  coverImage?: string;
  schedules?: RawSchedule[];
}

interface MappedSchedule {
  id: string;
  course: string;
  day: string;
  time: string;
  rawStartTime: string;
  rawEndTime: string;
  room: string;
  instructor: string;
  status: "upcoming" | "ongoing" | "completed";
  duration: string;
  type: "Lecture" | "Section" | undefined;
}

interface RawSchedule {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
  room?: string;
  course: {
    courseName: string;
  };
  professorId: number;
  professor: {
    firstName: string;
    lastName: string;
  };
}

interface Professor {
  id: number;
  firstName: string;
  lastName: string;
}

export default function AdminStudentPreview() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [selectedMajor, setSelectedMajor] = useState<string>("IS");
  const [selectedLevel, setSelectedLevel] = useState<number>(4);
  const [majors, setMajors] = useState<string[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<MappedSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"courses" | "schedule">("courses");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleClass | null>(
    null,
  );
  const [scheduleFilters, setScheduleFilters] = useState({
    day: "Days",
    status: "Status",
  });
  const [scheduleSearch, setScheduleSearch] = useState("");

  const filteredSchedules = React.useMemo(() => {
    return schedules.filter((cls: MappedSchedule) => {
      const matchesDay =
        scheduleFilters.day === "Days" || cls.day === scheduleFilters.day;
      const matchesStatus =
        scheduleFilters.status === "Status" ||
        (scheduleFilters.status === "Upcoming" && cls.status === "upcoming") ||
        (scheduleFilters.status === "Ongoing" && cls.status === "ongoing") ||
        (scheduleFilters.status === "Completed" && cls.status === "completed");
      const matchesSearch =
        cls.course.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
        cls.instructor.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
        cls.room.toLowerCase().includes(scheduleSearch.toLowerCase());

      return matchesDay && matchesStatus && matchesSearch;
    });
  }, [schedules, scheduleFilters, scheduleSearch]);

  const handleUpdateSchedule = async (data: Partial<RawSchedule>) => {
    if (!editingSchedule) return;
    setIsUpdating(true);
    try {
      const res = await apiClient.put(
        `/api/schedule/${editingSchedule.id}`,
        data,
      );
      if (res.success) {
        toastSuccess("Schedule updated successfully");
        setEditingSchedule(null);
        fetchData();
      } else {
        toastError(res.message || "Failed to update schedule");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update schedule";
      toastError(message);
      console.error("Failed to update schedule:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const CourseCard = ({
    course,
    onEdit,
  }: {
    course: Course;
    onEdit: (c: Course) => void;
  }) => {
    const [imgError, setImgError] = useState(false);
    const coverImg =
      course.coverImage || getCourseImage(course.courseName, course.id);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5 }}
        onClick={() => onEdit(course)}
        className="group bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white/60 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-500 cursor-pointer"
      >
        {/* Card Header */}
        <div className="h-52 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent z-10" />
          {!imgError ? (
            <NextImage
              src={coverImg}
              alt={course.courseName}
              width={400}
              height={208}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-1000"
              unoptimized={true}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 z-20 p-8 flex flex-col justify-between text-left">
            <div className="flex justify-between items-start">
              <span className="px-4 py-1.5 bg-blue-600/90 backdrop-blur-md rounded-xl text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                {course.courseCode}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(course);
                }}
                className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white border border-white/20 hover:bg-blue-600 transition-all group/edit"
              >
                <Edit2 className="w-4 h-4 group-hover/edit:scale-110 transition-transform" />
              </button>
            </div>
            <div>
              <h3 className="text-xl font-black text-white line-clamp-2 leading-tight tracking-tight drop-shadow-lg group-hover:text-blue-200 transition-colors">
                {course.courseName}
              </h3>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-8 space-y-5">
           <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Faculty Lead
            </span>
            <span className="text-sm font-bold text-gray-900">
              {getProfessorDisplay(course)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Domain & Iteration
            </span>
            <span className="text-sm font-bold text-blue-600">
              {course.major} • L{course.level}
            </span>
          </div>

          <div className="pt-5 border-t border-gray-50 flex items-center justify-between text-blue-600 font-black text-[10px] uppercase tracking-widest group-hover:text-blue-700 transition-colors">
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Manifesto Details
            </span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
          </div>
        </div>
      </motion.div>
    );
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [majorsRes, profsRes] = await Promise.all([
          apiClient.get<string[]>("/admin/courses?action=majors"),
          apiClient.get<Professor[]>("/admin/courses?action=professors"),
        ]);
        if (majorsRes.success && majorsRes.data) setMajors(majorsRes.data);
        if (profsRes.success && profsRes.data) setProfessors(profsRes.data);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, schedulesRes] = await Promise.all([
        apiClient.get<{ courses: Course[] }>(
          `/admin/courses?major=${encodeURIComponent(selectedMajor)}&level=${selectedLevel}&isActive=true&isArchived=false&includeSchedules=true&limit=100`,
        ),
        apiClient.get<RawSchedule[]>(
          `/api/schedule?major=${encodeURIComponent(selectedMajor)}&level=${selectedLevel}`,
        ),
      ]);

      if (coursesRes.success && coursesRes.data) {
        setCourses(coursesRes.data.courses || []);
      }
      if (schedulesRes.success && schedulesRes.data) {
        // Map schedules to match ScheduleTable expectations
        const mappedSchedules = (schedulesRes.data || []).map(
          (item: RawSchedule) => {
            const status: "upcoming" | "ongoing" | "completed" = "upcoming"; // Default
            return {
              id: item.id.toString(),
              course: item.course.courseName,
              day: [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ][item.dayOfWeek],
              time: `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`,
              rawStartTime: item.startTime,
              rawEndTime: item.endTime,
              room: item.room || "TBA",
              instructor: `${item.professor.firstName} ${item.professor.lastName}`,
              status: status,
              duration: `${item.duration}h`,
              type: (item.duration >= 1.8 ? "Lecture" : "Section") as
                | "Lecture"
                | "Section",
            };
          },
        );
        setSchedules(mappedSchedules);
      }
    } catch (error) {
      console.error("Failed to fetch preview data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMajor, selectedLevel]); // Add dependencies for fetchData

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getProfessorDisplay = (course: Course) => {
    const doctorPrefixes = ["د.", "د/", "أ.د", "أ.م.د", "م.د"];
    const isDoctor = (name: string) =>
      doctorPrefixes.some((pref) => name.includes(pref));

    const professorSet = new Set<string>();
    const leadProfName = course.professor
      ? `${course.professor.firstName} ${course.professor.lastName}`
      : null;

    if (leadProfName) {
      professorSet.add(leadProfName);
    }

    const scheduleProfs: string[] = [];
    if (course.schedules) {
      course.schedules.forEach((s: RawSchedule) => {
        if (s.professor) {
          const name = `${s.professor.firstName} ${s.professor.lastName}`;
          if (!scheduleProfs.includes(name)) {
            scheduleProfs.push(name);
          }
        }
      });
    }

    scheduleProfs.forEach((p) => {
      if (isDoctor(p) && !professorSet.has(p)) {
        professorSet.add(p);
      }
    });

    if (professorSet.size === 0 && scheduleProfs.length > 0) {
      scheduleProfs.forEach((p) => professorSet.add(p));
    }

    return Array.from(professorSet).join(", ") || "Not Set";
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "TBA";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const handleUpdateCourse = async (data: Partial<Course>) => {
    if (!editingCourse) return;
    setIsUpdating(true);
    try {
      const res = await apiClient.patch("/admin/courses", {
        courseId: editingCourse.id,
        ...data,
      });
      if (res.success) {
        toastSuccess("Course updated successfully");
        setEditingCourse(null);
        fetchData();
      } else {
        toastError(res.message || "Failed to update course");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update course";
      toastError(message);
      console.error("Failed to update course:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Filters */}
      {/* Header & Main Filters */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/60 flex flex-col xl:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
            <Users className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
              Student <span className="text-blue-600">Portal</span> Preview
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Validating ecosystem accessibility and visual integrity.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-[2rem] border border-gray-100/50">
            <select
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="bg-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-700 shadow-sm border border-gray-100/50 outline-none cursor-pointer hover:bg-white/80 transition-all appearance-none text-center min-w-[120px]"
            >
              {majors.map((m) => (
                <option key={m} value={m}>
                  {m} Domain
                </option>
              ))}
            </select>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
              className="bg-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm border border-gray-100/50 outline-none cursor-pointer hover:bg-white/80 transition-all appearance-none text-center min-w-[120px]"
            >
              {[1, 2, 3, 4, 5].map((l) => (
                <option key={l} value={l}>
                  Level {l}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50/50 p-2 rounded-[2rem] border border-gray-100/50">
            <button
              onClick={() => setViewMode("courses")}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "courses" ? "bg-white text-blue-600 shadow-xl shadow-blue-500/10 border border-gray-100 scale-105" : "text-gray-400 hover:text-gray-900"}`}
            >
              <BookOpen className="w-4 h-4" />
              Inventory
            </button>
            <button
              onClick={() => setViewMode("schedule")}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "schedule" ? "bg-white text-blue-600 shadow-xl shadow-blue-500/10 border border-gray-100 scale-105" : "text-gray-400 hover:text-gray-900"}`}
            >
              <Calendar className="w-4 h-4" />
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 border-dashed">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">
            Syncing student view data...
          </p>
        </div>
      ) : viewMode === "courses" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {courses.length > 0 ? (
              courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEdit={setEditingCourse}
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">
                  No Courses Found
                </h3>
                <p className="text-gray-500">
                  No courses match the level {selectedLevel} and major{" "}
                  {selectedMajor}.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Schedule Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide py-2">
              {["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                <button
                  key={day}
                  onClick={() => setScheduleFilters({ ...scheduleFilters, day })}
                  className={`flex-shrink-0 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${scheduleFilters.day === day ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-100/50"}`}
                >
                  {day}
                </button>
              ))}
              <button
                onClick={() => setScheduleFilters({ ...scheduleFilters, day: "Days" })}
                className={`flex-shrink-0 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${scheduleFilters.day === "Days" ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-100/50"}`}
              >
                Entire Timeline
              </button>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Intercept specific curriculum entries..."
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[1.5rem] focus:ring-[6px] focus:ring-blue-500/5 focus:border-blue-500/50 outline-none transition-all text-sm font-bold text-gray-900 shadow-sm"
                />
              </div>
              <select
                value={scheduleFilters.status}
                onChange={(e) =>
                  setScheduleFilters({
                    ...scheduleFilters,
                    status: e.target.value,
                  })
                }
                className="bg-white border border-gray-100 rounded-[1.5rem] px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-600 focus:ring-[6px] focus:ring-blue-500/5 outline-none cursor-pointer hover:bg-gray-50 transition-all appearance-none shadow-sm"
              >
                <option>Filter Status</option>
                <option>Upcoming</option>
                <option>Ongoing</option>
                <option>Completed</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 overflow-hidden">
            <ScheduleTable
              classes={filteredSchedules as ScheduleClass[]}
              currentDay="Saturday"
              onEdit={setEditingSchedule}
            />
          </div>
        </div>
      )}

      {/* Schedule Edit Modal */}
      <AnimatePresence>
        {editingSchedule && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    Edit Schedule Entry
                  </h3>
                  <p className="text-sm text-gray-500">
                    {editingSchedule.course}
                  </p>
                </div>
                <button
                  onClick={() => setEditingSchedule(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleUpdateSchedule({
                    professorId: parseInt(
                      (formData.get("professorId") as string) || "0",
                    ),
                    dayOfWeek: parseInt(
                      (formData.get("dayOfWeek") as string) || "0",
                    ),
                    startTime: (formData.get("startTime") as string) || "",
                    endTime: (formData.get("endTime") as string) || "",
                    room: (formData.get("room") as string) || "",
                  });
                }}
                className="p-6 space-y-4"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Professor
                    </label>
                    <select
                      name="professorId"
                      defaultValue={
                        professors.find(
                          (p) =>
                            `${p.firstName} ${p.lastName}` ===
                            editingSchedule.instructor,
                        )?.id
                      }
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      {professors.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Day
                      </label>
                      <select
                        name="dayOfWeek"
                        defaultValue={[
                          "Sunday",
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                        ].indexOf(editingSchedule.day)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      >
                        {[
                          "Sunday",
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                        ].map((d, i) => (
                          <option key={d} value={i}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Room
                      </label>
                      <input
                        name="room"
                        type="text"
                        defaultValue={editingSchedule.room}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Start Time
                      </label>
                      <input
                        name="startTime"
                        type="time"
                        defaultValue={
                          schedules.find((s) => s.id === editingSchedule.id)
                            ?.rawStartTime || "09:00"
                        }
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        End Time
                      </label>
                      <input
                        name="endTime"
                        type="time"
                        defaultValue={
                          schedules.find((s) => s.id === editingSchedule.id)
                            ?.rawEndTime || "11:00"
                        }
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingSchedule(null)}
                    className="flex-1 px-6 py-3 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Course Edit Modal */}
      <AnimatePresence>
        {editingCourse && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-xl text-gray-900">
                    Edit Course Details
                  </h3>
                  <p className="text-sm text-gray-500">
                    Modify course information in the student portal
                  </p>
                </div>
                <button
                  onClick={() => setEditingCourse(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleUpdateCourse({
                    courseName:
                      (formData.get("courseName") as string) || undefined,
                    courseCode:
                      (formData.get("courseCode") as string) || undefined,
                    professorId: parseInt(
                      (formData.get("professorId") as string) || "0",
                    ),
                    credits: parseInt(
                      (formData.get("credits") as string) || "0",
                    ),
                    major: (formData.get("major") as string) || undefined,
                    level: parseInt((formData.get("level") as string) || "0"),
                    semester: (formData.get("semester") as string) || undefined,
                    academicYear:
                      (formData.get("academicYear") as string) || undefined,
                    coverImage:
                      (formData.get("coverImage") as string) || undefined,
                  });
                }}
                className="p-6 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Course Name
                      </label>
                      <input
                        name="courseName"
                        type="text"
                        defaultValue={editingCourse.courseName}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Course Code
                      </label>
                      <input
                        name="courseCode"
                        type="text"
                        defaultValue={editingCourse.courseCode}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Professor
                      </label>
                      <select
                        name="professorId"
                        defaultValue={editingCourse.professorId}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      >
                        {professors.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Credits
                      </label>
                      <input
                        name="credits"
                        type="number"
                        defaultValue={3} // Default from schema
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Major
                        </label>
                        <input
                          name="major"
                          type="text"
                          defaultValue={editingCourse.major}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Level
                        </label>
                        <select
                          name="level"
                          defaultValue={editingCourse.level}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        >
                          {[1, 2, 3, 4].map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Semester
                        </label>
                        <select
                          name="semester"
                          defaultValue={editingCourse.semester || "FALL"}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        >
                          <option value="FALL">Fall</option>
                          <option value="SPRING">Spring</option>
                          <option value="SUMMER">Summer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Academic Year
                        </label>
                        <input
                          name="academicYear"
                          type="text"
                          defaultValue={
                            editingCourse.academicYear || "2025-2026"
                          }
                          placeholder="e.g. 2025-2026"
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Cover Image URL
                      </label>
                      <input
                        name="coverImage"
                        type="text"
                        defaultValue={editingCourse.coverImage}
                        placeholder="Leave empty for default"
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingCourse(null)}
                    className="flex-1 px-6 py-3 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      "Save Course Details"
                    )}
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
