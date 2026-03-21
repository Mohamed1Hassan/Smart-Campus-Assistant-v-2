"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  TrendingUp,
  BookOpen,
  AlertCircle,
  ChevronRight,
  Search,
  Calculator,
  Target,
  Award,
  BarChart3,
  Info,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DashboardLayout from "../components/common/DashboardLayout";
import { getStudentGradesAction } from "../actions/grade.actions";
import { StatsSkeleton } from "../components/common/LoadingSkeleton";

// --- Types ---

interface Grade {
  score: number | null;
  maxScore: number;
  createdAt: string;
  course: {
    courseName: string;
  };
  quiz?: {
    title?: string;
  };
  type: string;
}

// --- Components ---

const GlassCard = ({
  children,
  className = "",
  noBlur = false,
}: {
  children: React.ReactNode;
  className?: string;
  noBlur?: boolean;
}) => (
  <div
    className={`${noBlur ? "" : "backdrop-blur-md"} bg-white/80 dark:bg-gray-800/70 border border-white/20 dark:border-gray-700/50 rounded-3xl shadow-xl ${className}`}
  >
    {children}
  </div>
);

const GPASimulator = ({
  currentGPA,
  onHide,
}: {
  currentGPA: number;
  onHide: () => void;
}) => {
  const [targetGPA, setTargetGPA] = useState(
    currentGPA + 0.2 > 4 ? 4 : currentGPA + 0.2,
  );
  const [futureCredits, setFutureCredits] = useState(15);
  const [totalCredits, setTotalCredits] = useState(60);

  // Simple GPA Calc: (CurrentGPA * TotalCredits + FutureGPA * FutureCredits) / (TotalCredits + FutureCredits)
  const neededGPA = useMemo(() => {
    const totalPointsNeeded = targetGPA * (totalCredits + futureCredits);
    const currentPoints = currentGPA * totalCredits;
    const futurePointsNeeded = totalPointsNeeded - currentPoints;
    const result = futurePointsNeeded / futureCredits;
    return Math.min(4, Math.max(0, isNaN(result) ? 0 : result));
  }, [targetGPA, currentGPA, totalCredits, futureCredits]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-4 top-24 bottom-24 w-80 z-40 hidden xl:block"
    >
      <GlassCard className="h-full p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-500" />
            GPA Simulator
          </h3>
          <button
            onClick={onHide}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter mb-1">
              Target Score Needed
            </p>
            <p className="text-3xl font-black text-indigo-900 dark:text-white">
              {neededGPA.toFixed(2)}
            </p>
            <p className="text-[10px] text-indigo-500 mt-1">
              GPA required in next {futureCredits} credits to hit target.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Target GPA: {targetGPA.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="4"
                step="0.05"
                value={targetGPA}
                onChange={(e) => setTargetGPA(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Future Credits: {futureCredits}
              </label>
              <input
                type="range"
                min="3"
                max="21"
                step="3"
                value={futureCredits}
                onChange={(e) => setFutureCredits(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Total Credits Earned: {totalCredits}
              </label>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={totalCredits}
                onChange={(e) => setTotalCredits(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="pt-4 mt-auto border-t border-gray-100 dark:border-gray-700/50">
            <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
              <Target className="w-4 h-4" /> Save Goal
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

// --- Main Page ---

export default function Grades() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [showSimulator, setShowSimulator] = useState(true);

  const { data: gradesResponse, isLoading } = useQuery({
    queryKey: ["student-grades"],
    queryFn: async () => {
      const res = await getStudentGradesAction();
      if (res.success) return res.data;
      throw new Error(res.error);
    },
  });

   
  const grades = useMemo(
    () => (gradesResponse as Grade[]) || [],
    [gradesResponse],
  );

  const stats = useMemo(() => {
    if (!grades.length) return { gpa: 0, total: 0, trend: [] };

    const validGrades = grades.filter(
      (g): g is Grade & { score: number } => g.score !== null,
    );
    const gpa =
      (validGrades.reduce((acc: number, g) => acc + g.score / g.maxScore, 0) /
        (validGrades.length || 1)) *
      4;

    const trendData = [...validGrades]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((g) => ({
        name: new Date(g.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        score: Math.round((g.score / g.maxScore) * 100),
      }));

    return { gpa, total: validGrades.length, trend: trendData };
  }, [grades]);

  const filteredGrades = grades.filter((g) => {
    const matchesSearch =
      g.course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.quiz?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "ALL" || g.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <DashboardLayout userType="student">
        <StatsSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="student">
      <div
        className={`space-y-8 pb-32 transition-all duration-500 ${showSimulator ? "xl:mr-[340px]" : ""}`}
      >
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              Elite Student Status
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Academic{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Analytics
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Real-time performance profiling and GPA management.
            </p>
          </div>

          <div className="flex gap-4">
            <GlassCard className="px-6 py-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Cumulative GPA
                </p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {stats.gpa.toFixed(2)}
                </p>
              </div>
            </GlassCard>

            {!showSimulator && (
              <button
                onClick={() => setShowSimulator(true)}
                className="px-6 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-3xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
              >
                <Calculator className="w-5 h-5" /> Open Simulator
              </button>
            )}
          </div>
        </header>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Performance Over Time
              </h3>
              <select className="bg-transparent text-xs font-bold text-gray-400 outline-none border-none">
                <option>Current Semester</option>
                <option>Academic Year</option>
              </select>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trend}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: "bold" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: "bold" }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-8 hidden lg:block">
            <h3 className="font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
              <GraduationCap className="w-5 h-5 text-purple-500" />
              Skill Mapping
            </h3>
            {/* Radar Chart Placeholder */}
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-purple-100 dark:border-purple-800">
                  <BarChart3 className="w-10 h-10 text-purple-500" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Broadcaster Matrix
                </p>
                <p className="text-[10px] text-gray-500">
                  More data needed for 3D Radar mapping.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Identify courses or specific units..."
              className="w-full pl-14 pr-6 py-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 px-2 sm:px-0">
            {["ALL", "QUIZ", "EXAM", "ASSIGNMENT"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-6 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap tracking-wider ${
                  filterType === type
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xl"
                    : "bg-white/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-gray-500 hover:bg-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Grades Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {filteredGrades.map((grade: any, index: number) => (
              <motion.div
                key={grade.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
              >
                <GlassCard className="p-6 h-full hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 group cursor-default">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center text-gray-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          grade.score / grade.maxScore >= 0.8
                            ? "bg-emerald-100/50 text-emerald-700"
                            : grade.score / grade.maxScore >= 0.6
                              ? "bg-amber-100/50 text-amber-700"
                              : "bg-red-100/50 text-red-700"
                        }`}
                      >
                        {grade.type}
                      </span>
                      <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
                        {Math.round((grade.score / grade.maxScore) * 100)}%
                      </p>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {grade.course.courseName}
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tight mb-6">
                    {grade.quiz?.title || "General Assessment"}
                  </p>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end text-xs">
                      <span className="text-gray-400 font-bold uppercase">
                        Raw Score
                      </span>
                      <span className="font-black text-gray-900 dark:text-white uppercase">
                        {grade.score}{" "}
                        <span className="text-gray-400 font-normal">
                          / {grade.maxScore}
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(grade.score / grade.maxScore) * 100}%`,
                        }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          grade.score / grade.maxScore >= 0.8
                            ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                            : grade.score / grade.maxScore >= 0.6
                              ? "bg-gradient-to-r from-amber-400 to-amber-600"
                              : "bg-gradient-to-r from-red-400 to-red-600"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        Finalized{" "}
                        {new Date(grade.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:translate-x-1 transition-transform">
                      Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredGrades.length === 0 && (
          <GlassCard className="py-24 text-center">
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-200 dark:border-gray-700">
              <AlertCircle className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              Shadow Records Empty
            </h3>
            <p className="text-gray-500 font-medium max-w-sm mx-auto">
              No matching grade descriptors found for your current search
              parameters. System idle.
            </p>
          </GlassCard>
        )}
      </div>

      {/* GPA Simulator - Fixed Sidebar */}
      <AnimatePresence>
        {showSimulator && (
          <GPASimulator
            currentGPA={stats.gpa}
            onHide={() => setShowSimulator(false)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
