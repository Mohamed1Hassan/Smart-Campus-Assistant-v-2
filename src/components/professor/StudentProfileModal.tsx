/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  BookOpen,
  Award,
  TrendingUp,
  User,
  Clock,
  Loader2,
  Navigation,
} from "lucide-react";
import { apiClient } from "@/services/api";

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | number;
}

interface StudentPublicData {
  id: string;
  universityId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  major?: string;
  department?: string;
  year?: string;
  overallAttendance: number;
  gpa: number;
  completedCourses: number;
  totalCredits: number;
}

export default function StudentProfileModal({
  isOpen,
  onClose,
  studentId,
}: StudentProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentPublicData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !studentId) return;

    const fetchStudentData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<StudentPublicData>(
          `/api/users/${studentId}`,
        );
        if (response.success && response.data) {
          setStudentData(response.data);
        } else {
          setError("Could not load student profile.");
        }
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to fetch student data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-cardDark rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-cardDark/80 backdrop-blur-md z-10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Student Profile
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">
                  Loading profile data...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg mb-2">Error</h3>
                <p className="text-red-500">{error}</p>
              </div>
            ) : studentData ? (
              <div className="space-y-8">
                {/* Profile overview */}
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold shadow-inner overflow-hidden flex-shrink-0 border-2 border-white dark:border-gray-800">
                    {studentData.avatarUrl ? (
                      <img
                        src={studentData.avatarUrl}
                        alt={studentData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      studentData.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                        {studentData.name}
                      </h3>
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-fit">
                        ID: {studentData.universityId}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate" title={studentData.email}>
                          {studentData.email}
                        </span>
                      </div>
                      {studentData.major && (
                        <div className="flex items-center gap-2 truncate">
                          <BookOpen className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="truncate" title={studentData.major}>
                            {studentData.major}
                          </span>
                        </div>
                      )}
                      {studentData.department && (
                        <div className="flex items-center gap-2 truncate">
                          <Navigation className="w-4 h-4 text-gray-400 shrink-0" />
                          <span
                            className="truncate"
                            title={studentData.department}
                          >
                            {studentData.department}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />

                {/* Academic Stats */}
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-500" />
                    Academic Overview
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                      <div className="text-blue-500 dark:text-blue-400 mb-2">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {studentData.gpa.toFixed(2)}
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        GPA
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4">
                      <div className="text-emerald-500 dark:text-emerald-400 mb-2">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {studentData.overallAttendance}%
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        Attendance
                      </div>
                    </div>

                    <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl p-4">
                      <div className="text-purple-500 dark:text-purple-400 mb-2">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {studentData.completedCourses}
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        Completed Courses
                      </div>
                    </div>

                    <div className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4">
                      <div className="text-orange-500 dark:text-orange-400 mb-2">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {studentData.totalCredits}
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        Earned Credits
                      </div>
                    </div>
                  </div>

                  {/* Detailed Attendance Progress Bar */}
                  <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <h5 className="font-semibold text-sm">
                          Overall Attendance
                        </h5>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Across all enrolled courses
                        </p>
                      </div>
                      <span
                        className={`font-bold ${studentData.overallAttendance >= 75 ? "text-emerald-500" : studentData.overallAttendance >= 50 ? "text-yellow-500" : "text-red-500"}`}
                      >
                        {studentData.overallAttendance}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${studentData.overallAttendance}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${studentData.overallAttendance >= 75 ? "bg-emerald-500" : studentData.overallAttendance >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
