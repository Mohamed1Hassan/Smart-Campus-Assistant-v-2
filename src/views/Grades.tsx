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
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  noBlur?: boolean;
  style?: React.CSSProperties;
}) => (
  <div
    style={style}
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

  const neededGPA = useMemo(() => {
    const totalPointsNeeded = targetGPA * (totalCredits + futureCredits);
    const currentPoints = currentGPA * totalCredits;
    const futurePointsNeeded = totalPointsNeeded - currentPoints;
    const result = futurePointsNeeded / futureCredits;
    return Math.min(4, Math.max(0, isNaN(result) ? 0 : result));
  }, [targetGPA, currentGPA, totalCredits, futureCredits]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed right-6 top-32 bottom-32 w-[22rem] z-40 hidden xl:block"
    >
      <GlassCard className="h-full p-8 flex flex-col shadow-2xl border-white/50 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-20 -right-20 h-40 w-40 bg-indigo-500/10 blur-[80px] rounded-full" />
        
        <div className="flex justify-between items-center mb-10 relative z-10">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            Simulator
          </h3>
          <button
            onClick={onHide}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors group"
          >
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar relative z-10">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-900/20 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl rounded-full -mr-12 -mt-12" />
            
            <p className="text-[10px] font-black text-indigo-100/60 uppercase tracking-[0.2em] mb-3">
              Target GPA Requirement
            </p>
            <p className="text-6xl font-black text-white mb-2 tabular-nums">
              {neededGPA.toFixed(2)}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[9px] font-black text-white uppercase tracking-tighter">
              <Target className="w-3 h-3" />
              Maintain in next {futureCredits} credits
            </div>
          </div>

          <div className="space-y-8 px-2">
            <div className="space-y-5">
              <div className="flex justify-between items-end">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Target GPA
                </label>
                <span className="text-xl font-black text-gray-900 dark:text-white px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {targetGPA.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="0.05"
                value={targetGPA}
                onChange={(e) => setTargetGPA(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-5">
              <div className="flex justify-between items-end">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Future Credits
                </label>
                <span className="text-xl font-black text-gray-900 dark:text-white px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {futureCredits}
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="21"
                step="3"
                value={futureCredits}
                onChange={(e) => setFutureCredits(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-5">
              <div className="flex justify-between items-end">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Completed Credits
                </label>
                <span className="text-xl font-black text-gray-900 dark:text-white px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {totalCredits}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={totalCredits}
                onChange={(e) => setTotalCredits(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="pt-10 mt-auto border-t border-gray-100 dark:border-gray-800/50 relative z-10">
            <button className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[2rem] font-black shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
              <Award className="w-5 h-5" /> Lock Academic Goal
            </button>
            <p className="text-[9px] text-gray-400 text-center mt-4 font-black uppercase tracking-tight">
              Theoretical calculation based on credit weighting
            </p>
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
      <div className={`space-y-8 pb-32 transition-all duration-500 ${showSimulator ? "xl:mr-[340px]" : ""}`}>
        {/* Premium Floating Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 shadow-2xl">
          {/* Decorative background elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full text-xs font-bold uppercase tracking-wider"
              >
                <Award className="w-3.5 h-3.5" />
                Elite Academic Status
              </motion.div>
              
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                  Academic <br />
                  <span className="text-indigo-200">Analytics</span>
                </h1>
                <p className="text-indigo-100/80 font-medium max-w-md">
                  Track your academic journey with precision and manage your GPA goals effectively.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="px-8 py-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-xl flex items-center gap-5 min-w-[220px]"
              >
                <div className="p-4 bg-white/20 rounded-2xl text-white shadow-inner">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-100/60 uppercase tracking-widest mb-1">
                    Cumulative GPA
                  </p>
                  <p className="text-3xl font-black text-white">
                    {stats.gpa.toFixed(2)}
                  </p>
                </div>
              </motion.div>

              {!showSimulator && (
                <button
                  onClick={() => setShowSimulator(true)}
                  className="px-8 py-6 bg-white text-indigo-600 rounded-[2rem] font-black flex items-center gap-3 hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/20 active:scale-95 group"
                >
                  <Calculator className="w-6 h-6 group-hover:rotate-12 transition-transform" /> 
                  GPA Simulator
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2 p-8 overflow-hidden relative group">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="font-bold flex items-center gap-3 text-gray-900 dark:text-white text-lg">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                </div>
                Performance Tracking
              </h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <select className="bg-transparent text-xs font-bold text-gray-500 dark:text-gray-400 outline-none border-none cursor-pointer">
                  <option>Current Semester</option>
                  <option>Academic Year</option>
                </select>
              </div>
            </div>
            
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trend}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: "600" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: "600" }}
                    domain={[0, 100]}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "20px",
                      border: "none",
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(10px)",
                      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                      padding: "12px 16px",
                    }}
                    itemStyle={{ fontWeight: "bold", color: "#4f46e5" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-8 hidden lg:flex flex-col items-center justify-center text-center relative overflow-hidden">
             {/* Decorative pattern */}
             <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)', backgroundSize: '24px 24px' }} />
             
            <div className="relative z-10 w-full">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-purple-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <Target className="w-12 h-12 text-white" />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">
                Broadcaster Matrix
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-[200px] mx-auto leading-relaxed">
                Advanced skill-mapping analytics will be available once more data is collected.
              </p>
              
              <div className="mt-8 flex flex-col gap-2">
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full w-[65%] bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
                </div>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest text-right">
                  65% Data Maturity
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Enhanced Filters Row */}
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by course name or assessment title..."
              className="w-full pl-14 pr-6 py-5 bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 p-1.5 bg-gray-100/50 dark:bg-gray-800/40 backdrop-blur-sm rounded-[1.8rem] border border-gray-200/50 dark:border-gray-700/30 overflow-x-auto no-scrollbar w-full md:w-auto">
            {["ALL", "QUIZ", "EXAM", "ASSIGNMENT"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-6 py-3 rounded-[1.4rem] text-[11px] font-black tracking-widest transition-all duration-300 uppercase whitespace-nowrap ${
                  filterType === type
                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
            {filteredGrades.map((grade: any, index: number) => {
              const percentage = Math.round((grade.score / grade.maxScore) * 100);
              const colorClass = percentage >= 80 ? 'emerald' : percentage >= 60 ? 'amber' : 'red';
              const themeColor = colorClass === 'emerald' ? '#10b981' : colorClass === 'amber' ? '#f59e0b' : '#ef4444';

              return (
                <motion.div
                  key={grade.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                >
                  <GlassCard className="p-8 h-full hover:scale-[1.03] hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden border-b-4" 
                             style={{ borderBottomColor: themeColor }}>
                    {/* Grade Badge Overlay */}
                    <div className={`absolute top-0 right-0 p-6 bg-gradient-to-br from-${colorClass}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-[4rem]`}>
                      <Award className={`w-12 h-12 text-${colorClass}-500/20`} />
                    </div>

                    <div className="flex items-start justify-between mb-8 relative z-10">
                      <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900/50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/40 group-hover:text-indigo-600 transition-all duration-500 shadow-inner group-hover:shadow-indigo-200/50">
                        <BookOpen className="w-7 h-7" />
                      </div>
                      
                      <div className="text-right">
                        <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                          colorClass === 'emerald' ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600" :
                          colorClass === 'amber' ? "bg-amber-50 dark:bg-amber-900/40 text-amber-600" :
                          "bg-red-50 dark:bg-red-900/40 text-red-600"
                        }`}>
                          {grade.type}
                        </span>
                        <div className="mt-3 flex items-baseline justify-end gap-1">
                          <p className={`text-4xl font-black ${
                            colorClass === 'emerald' ? "text-emerald-600" :
                            colorClass === 'amber' ? "text-amber-600" :
                            "text-red-500"
                          }`}>
                            {percentage}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 mb-8 relative z-10">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {grade.course.courseName}
                      </h3>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" />
                        {grade.quiz?.title || "Standard Assessment"}
                      </p>
                    </div>

                    <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Performance Metric</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white">
                          {grade.score} <span className="text-gray-400 font-bold mx-1">/</span> {grade.maxScore}
                        </p>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-900 rounded-full h-2.5 p-0.5 shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-full rounded-full bg-gradient-to-r ${
                            colorClass === 'emerald' ? "from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
                            colorClass === 'amber' ? "from-amber-400 to-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.3)]" :
                            "from-red-400 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-${colorClass}-500 animate-pulse ring-4 ring-${colorClass}-500/10`} />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {new Date(grade.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <button className="h-10 w-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-indigo-600 hover:text-white hover:scale-110 active:scale-95 transition-all group-hover:shadow-lg group-hover:shadow-indigo-500/25">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
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
