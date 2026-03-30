"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Search,
  Plus,
  Save,
  X,
  BookOpen,
  AlertCircle,
  BarChart3,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), {
  ssr: false,
});
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false },
);
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), {
  ssr: false,
});
import DashboardLayout from "../components/common/DashboardLayout";
import {
  getCourseGradesAction,
  assignGradeAction,
} from "../actions/grade.actions";
import { useToast } from "../components/common/ToastProvider";
import { apiClient } from "../services/api";

interface Student {
  firstName: string;
  lastName: string;
  universityId: string;
}

interface Grade {
  id: number;
  score: number;
  maxScore: number;
  type: string;
  studentId: number;
  student: Student;
  createdAt: string;
  quiz?: { title: string };
}

interface CourseEnrollment {
  studentId: number;
  student: Student;
}

// --- Components ---

const Skeleton = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl ${className}`}
  />
);

const GlassCard = ({
  children,
  className = "",
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "danger" | "warning";
}) => {
  const variants = {
    default:
      "bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/50",
    danger:
      "bg-red-50/90 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50",
    warning:
      "bg-amber-50/90 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50",
  };
  return (
    <div
      className={`backdrop-blur-xl rounded-3xl shadow-sm hover:shadow-xl transition-all ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
};

export default function ProfessorGrades() {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  // Data Fetching
  const { data: courses = [] } = useQuery<
    { id: number; courseName: string; courseCode: string }[]
  >({
    queryKey: ["professor-courses-summary"],
    queryFn: async () => {
      const res = await apiClient.get<
        { id: number; courseName: string; courseCode: string }[]
      >("/api/courses", { params: { summary: true } });
      return res.success ? res.data || [] : [];
    },
  });

  const { data: students = [] } = useQuery<CourseEnrollment[]>({
    queryKey: ["course-students", selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const res = await apiClient.get<CourseEnrollment[]>(
        `/api/courses/${selectedCourse}/students`,
        { params: { status: "ACTIVE" } },
      );
      return res.success ? res.data || [] : [];
    },
    enabled: !!selectedCourse,
  });

  const { data: grades = [], isLoading } = useQuery<Grade[]>({
    queryKey: ["course-grades", selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const res = await getCourseGradesAction(selectedCourse);
      return res.success ? res.data || [] : [];
    },
    enabled: !!selectedCourse,
  });

  // Analytics Calculations
  const classAnalytics = useMemo(() => {
    if (!grades.length || !students.length) return null;

    // Calculate Average per student
    const studentAverages = new Map<
      number,
      { score: number; total: number; name: string; id: string }
    >();

    grades.forEach((g: Grade) => {
      if (g.score == null || g.maxScore == null || g.maxScore === 0) return;
      const current = studentAverages.get(g.studentId) || {
        score: 0,
        total: 0,
        name: `${g.student.firstName} ${g.student.lastName}`,
        id: g.student.universityId,
      };
      current.score += (g.score / g.maxScore) * 100;
      current.total += 1;
      studentAverages.set(g.studentId, current);
    });

    const averagesArray = Array.from(studentAverages.values()).map((s) => ({
      ...s,
      avg: s.score / s.total,
    }));

    const classAverage =
      averagesArray.reduce((acc, curr) => acc + curr.avg, 0) /
      (averagesArray.length || 1);

    // At-risk calculation (below 60%)
    const atRiskStudents = averagesArray
      .filter((s) => s.avg < 60)
      .sort((a, b) => a.avg - b.avg);

    // Bell Curve Distribution (Buckets: 0-50, 50-60, 60-70, 70-80, 80-90, 90-100)
    const buckets = {
      "0-50": 0,
      "50-60": 0,
      "60-70": 0,
      "70-80": 0,
      "80-90": 0,
      "90-100": 0,
    };
    averagesArray.forEach((s) => {
      if (s.avg < 50) buckets["0-50"]++;
      else if (s.avg < 60) buckets["50-60"]++;
      else if (s.avg < 70) buckets["60-70"]++;
      else if (s.avg < 80) buckets["70-80"]++;
      else if (s.avg < 90) buckets["80-90"]++;
      else buckets["90-100"]++;
    });

    const distributionData = Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
    }));

    return {
      classAverage,
      atRiskStudents,
      distributionData,
      totalAssessed: averagesArray.length,
    };
  }, [grades, students]);

  // Modal Form State
  const [form, setForm] = useState({
    studentId: "",
    score: "",
    maxScore: "100",
    type: "QUIZ",
    notes: "",
  });

  const assignMutation = useMutation({
    mutationFn: assignGradeAction,
    onSuccess: (res) => {
      if (res.success) {
        success("Grade assigned tracking active.");
        queryClient.invalidateQueries({
          queryKey: ["course-grades", selectedCourse],
        });
        setShowAssignModal(false);
      } else {
        error(res.error ?? "Unknown error");
      }
    },
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignMutation.mutate({
      studentId: parseInt(form.studentId),
      courseId: selectedCourse!,
      score: parseFloat(form.score),
      maxScore: parseFloat(form.maxScore),
      type: form.type,
      notes: form.notes,
    });
  };

  return (
    <DashboardLayout userType="professor">
      <div className="space-y-8 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5" />
              Academic Analytics
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Grade{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Intelligence
              </span>
            </h1>
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Class performance distribution and at-risk student tracking.
            </p>
          </div>

          {selectedCourse && (
            <button
              onClick={() => {
                setForm({ ...form, studentId: "" });
                setShowAssignModal(true);
              }}
              className="px-6 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Grades / Log Assessment
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Sidebar - Course Selection */}
          <div className="xl:col-span-1 space-y-6">
            <GlassCard className="p-6">
              <h2 className="font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest text-xs mb-4">
                Active Modules
              </h2>
              <div className="space-y-3">
                {courses.map(
                  (course: {
                    id: number;
                    courseName: string;
                    courseCode: string;
                  }) => (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourse(course.id)}
                      className={`w-full p-4 rounded-2xl text-left transition-all border ${
                        selectedCourse === course.id
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                          : "bg-gray-50 dark:bg-gray-800/50 border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <p className="font-bold truncate text-sm">
                        {course.courseName}
                      </p>
                      <p
                        className={`text-[10px] uppercase tracking-widest mt-1 font-bold ${selectedCourse === course.id ? "text-indigo-200" : "text-gray-600 dark:text-gray-400"}`}
                      >
                        {course.courseCode}
                      </p>
                    </button>
                  ),
                )}
              </div>
            </GlassCard>

            {/* At-Risk Warning Panel */}
            {classAnalytics && classAnalytics.atRiskStudents.length > 0 && (
              <GlassCard variant="danger" className="p-6">
                <h2 className="font-black text-red-700 dark:text-red-400 flex items-center gap-2 mb-4 text-sm uppercase tracking-widest">
                  <AlertTriangle className="w-4 h-4" /> Critical Watchlist
                </h2>
                <div className="space-y-3">
                  {classAnalytics.atRiskStudents.slice(0, 5).map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30"
                    >
                      <div className="truncate pr-4">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {student.name}
                        </p>
                        <p className="text-[10px] text-gray-700 dark:text-gray-300 font-bold">
                          {student.id}
                        </p>
                      </div>
                      <div className="shrink-0 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-1 rounded-md text-xs font-black">
                        {student.avg.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                  {classAnalytics.atRiskStudents.length > 5 && (
                    <p className="text-xs text-center text-red-500 font-bold mt-2">
                      + {classAnalytics.atRiskStudents.length - 5} more students
                      at risk
                    </p>
                  )}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-8">
            {selectedCourse ? (
              <>
                {/* Analytics Row */}
                {classAnalytics ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[220px]">
                    <GlassCard className="p-8 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">
                        Class Median Performance
                      </p>
                      <div className="flex items-end gap-4">
                        <span
                          className={`text-6xl font-black ${classAnalytics.classAverage >= 70 ? "text-emerald-500" : classAnalytics.classAverage >= 60 ? "text-amber-500" : "text-red-500"}`}
                        >
                          {classAnalytics.classAverage.toFixed(1)}
                          <span className="text-3xl text-gray-300">%</span>
                        </span>
                        <div
                          className={`mb-2 flex items-center gap-1 text-sm font-bold ${classAnalytics.classAverage >= 70 ? "text-emerald-500" : "text-red-500"}`}
                        >
                          {classAnalytics.classAverage >= 70 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                        Based on {grades.length} recorded assessments across{" "}
                        {classAnalytics.totalAssessed} students.
                      </p>
                    </GlassCard>

                    <GlassCard className="p-8">
                      <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-6">
                        Performance Distribution (Bell Curve)
                      </p>
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={classAnalytics.distributionData}>
                            <Tooltip
                              cursor={{ fill: "transparent" }}
                              contentStyle={{
                                borderRadius: "12px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              }}
                            />
                            <XAxis
                              dataKey="range"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fontSize: 9,
                                fill: "#9ca3af",
                                fontWeight: "bold",
                              }}
                              interval={0}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {classAnalytics.distributionData.map(
                                (entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      entry.range === "0-50" ||
                                      entry.range === "50-60"
                                        ? "#ef4444"
                                        : entry.range === "60-70"
                                          ? "#f59e0b"
                                          : "#6366f1"
                                    }
                                  />
                                ),
                              )}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </GlassCard>
                  </div>
                ) : isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[220px]">
                     <GlassCard className="p-8">
                        <Skeleton className="h-4 w-32 mb-4" />
                        <Skeleton className="h-16 w-48 mb-4" />
                        <Skeleton className="h-12 w-full" />
                     </GlassCard>
                     <GlassCard className="p-8">
                        <Skeleton className="h-4 w-32 mb-4" />
                        <Skeleton className="h-28 w-full" />
                     </GlassCard>
                  </div>
                ) : null}

                {/* Grade Master Ledger */}
                <GlassCard className="overflow-hidden min-h-[400px]">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-500" />
                      Master Grade Ledger
                    </h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search student..."
                        className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors w-full sm:w-64"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50 dark:bg-gray-800/30">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                            Student Profile
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                            Assessment Focus
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                            Metric Score
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                            Timestamp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm">
                        {grades.map((grade: Grade) => {
                          const percentage =
                            (grade.score / grade.maxScore) * 100;
                          const isAtRisk = percentage < 60;

                          return (
                            <tr
                              key={grade.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-2 h-2 rounded-full ${isAtRisk ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`}
                                  />
                                  <div>
                                    <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                      {grade.student.firstName}{" "}
                                      {grade.student.lastName}
                                    </p>
                                    <p className="text-[10px] text-gray-700 dark:text-gray-300 font-bold font-mono mt-0.5">
                                      {grade.student.universityId}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-[10px] font-black uppercase tracking-wider">
                                    {grade.type}
                                  </span>
                                  <span className="text-gray-700 dark:text-gray-300 font-bold text-xs">
                                    {grade.quiz?.title || "General Activity"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`px-2 py-1 rounded text-xs font-black ${
                                      percentage >= 80
                                        ? "bg-emerald-100 text-emerald-700"
                                        : percentage >= 60
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {grade.score} / {grade.maxScore}
                                  </div>
                                  <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 hidden sm:inline-block">
                                    ({percentage.toFixed(0)}%)
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-xs font-black">
                                {new Date(grade.createdAt).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {isLoading && grades.length === 0 && (
                           [1,2,3,4,5].map(i => (
                             <tr key={i}>
                               <td className="px-6 py-4"><Skeleton className="h-8 w-48" /></td>
                               <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                               <td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td>
                               <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                             </tr>
                           ))
                        )}
                        {grades.length === 0 && !isLoading && (
                          <tr>
                            <td colSpan={4} className="px-6 py-16 text-center">
                              <div className="inline-flex bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-4">
                                <AlertCircle className="w-8 h-8 text-gray-600" />
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 font-black">
                                Awaiting Assessment Data
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-bold mt-1">
                                Click &quot;Log Assessment&quot; above to record
                                student performance.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </>
            ) : (
              <GlassCard className="flex flex-col items-center justify-center py-32 text-center border-dashed border-2">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-3xl mb-6">
                  <BarChart3 className="w-16 h-16 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  Select a Course to Manage Grades
                </h2>
                <p className="text-gray-700 dark:text-gray-300 font-medium max-w-sm">
                  Select a course from the sidebar to view student performance,
                  track at-risk students, and log new grades.
                </p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal UI remains mostly similar but wrapped in GlassCard styles */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 dark:border-gray-700/50"
            >
              <form onSubmit={handleAssignSubmit}>
                <div className="p-8 sm:p-10">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      Log Assessment
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-50 dark:bg-gray-800 p-2 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black tracking-widest text-gray-700 dark:text-gray-300 uppercase mb-2 block">
                        Student Identifier
                      </label>
                      <select
                        required
                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold dark:text-white appearance-none"
                        value={form.studentId}
                        onChange={(e) =>
                          setForm({ ...form, studentId: e.target.value })
                        }
                      >
                        <option value="">Select Student...</option>
                        {students.map((enrollment: CourseEnrollment) => (
                          <option
                            key={enrollment.studentId}
                            value={enrollment.studentId}
                          >
                            {enrollment.student.firstName}{" "}
                            {enrollment.student.lastName} (
                            {enrollment.student.universityId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black tracking-widest text-gray-700 dark:text-gray-300 uppercase mb-2 block">
                          Achieved Score
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.5"
                          placeholder="0.0"
                          className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-black text-xl text-indigo-600 dark:text-indigo-400"
                          value={form.score}
                          onChange={(e) =>
                            setForm({ ...form, score: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black tracking-widest text-gray-700 dark:text-gray-300 uppercase mb-2 block">
                          Maximum Score
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="100"
                          className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-black text-xl text-gray-900 dark:text-white"
                          value={form.maxScore}
                          onChange={(e) =>
                            setForm({ ...form, maxScore: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black tracking-widest text-gray-700 dark:text-gray-300 uppercase mb-2 block">
                        Assessment Category
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          "QUIZ",
                          "EXAM",
                          "ASSIGNMENT",
                          "PARTICIPATION",
                          "OTHER",
                        ]
                          .slice(0, 3)
                          .map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setForm({ ...form, type })}
                              className={`py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${
                                form.type === type
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 text-gray-500"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={assignMutation.isPending}
                      className="w-full mt-4 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                    >
                      {assignMutation.isPending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-b-white"></div>
                      ) : (
                        <>
                          <Save className="w-5 h-5" /> Execute Record Entry
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
