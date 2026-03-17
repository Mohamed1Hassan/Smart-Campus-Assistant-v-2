"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getCourseImage } from "@/utils/courseImages";
import {
  Edit,
  Copy,
  Archive,
  CheckSquare,
  MoreVertical,
  Eye,
  BookOpen,
  Users,
  Upload,
  Trash2,
} from "lucide-react";

interface Course {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  maxStudents: number;
  scheduleTime?: string;
  professorName?: string;
  coverImage?: string;
}

interface CourseCardProps {
  course: Course;
  onViewDetails: (course: Course) => void;
  onUploadMaterials: (course: Course) => void;
  onRemoveCourse: (course: Course) => void;
  index: number;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export default function CourseCard({
  course,
  onViewDetails,
  onUploadMaterials,
  onRemoveCourse,
  index,
  selectionMode = false,
  isSelected = false,
  onToggleSelection,
}: CourseCardProps) {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowQuickActions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const capacityPercentage = (course.studentCount / course.maxStudents) * 100;
  const isFull = course.studentCount >= course.maxStudents;
  const isAlmostFull = capacityPercentage >= 80 && !isFull;
  const isActive = course.studentCount > 0;

  const getStatusBadge = () => {
    if (isFull) {
      return {
        text: "Full",
        className:
          "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700",
      };
    } else if (isAlmostFull) {
      return {
        text: "Almost Full",
        className:
          "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700",
      };
    } else {
      return {
        text: "Available",
        className:
          "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700",
      };
    }
  };

  const statusBadge = getStatusBadge();

  const getBorderColor = () => {
    if (isFull) return "border-red-300 dark:border-red-600";
    if (isAlmostFull) return "border-yellow-300 dark:border-yellow-600";
    if (isActive) return "border-green-300 dark:border-green-600";
    return "border-gray-200 dark:border-gray-700";
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode && onToggleSelection) {
      e.stopPropagation();
      onToggleSelection();
    } else if (!selectionMode) {
      // Navigate to course details if not in selection mode
      onViewDetails(course);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (selectionMode && onToggleSelection) {
        onToggleSelection();
      } else {
        onViewDetails(course);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={!selectionMode ? { scale: 1.02, y: -4 } : {}}
      className={`bg-white dark:bg-cardDark rounded-xl border-2 ${getBorderColor()} p-6 shadow-sm hover:shadow-lg transition-all duration-300 ${
        selectionMode
          ? isSelected
            ? "ring-2 ring-blue-500 dark:ring-blue-400"
            : ""
          : "cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      } group relative`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role={selectionMode ? undefined : "button"}
      tabIndex={selectionMode ? undefined : 0}
      aria-label={
        selectionMode
          ? undefined
          : `Course: ${course.name} (${course.code}). Click to view details.`
      }
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection?.();
            }}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isSelected
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white dark:bg-cardDark border-gray-300 dark:border-gray-600 text-transparent"
            }`}
            aria-label={
              isSelected ? `Deselect ${course.name}` : `Select ${course.name}`
            }
          >
            {isSelected && <CheckSquare className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Course Header/Image */}
      {course.coverImage ? (
        <div className="relative h-32 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
          <Image
            src={course.coverImage || getCourseImage(course.name, course.id)}
            alt={course.name}
            fill
            unoptimized
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute bottom-3 left-6 z-20">
            <h3 className="text-lg font-bold text-white leading-tight shadow-black/50 drop-shadow-md">
              {course.name}
            </h3>
            <p className="text-sm text-gray-200 font-mono">{course.code}</p>
          </div>

          {/* Quick Actions Overlay for Image Mode */}
          {!selectionMode && (
            <div className="absolute top-2 right-2 z-30" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuickActions(!showQuickActions);
                }}
                className="p-1.5 text-white/80 hover:text-white hover:bg-black/20 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showQuickActions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-cardDark border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                    role="menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(course);
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-textDark group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                {course.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-mutedDark font-mono">
                {course.code}
              </p>
              {course.professorName && (
                <p className="text-sm text-gray-600 dark:text-mutedDark mt-1 line-clamp-1">
                  {course.professorName}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions for No-Image Mode */}
          {!selectionMode && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuickActions(!showQuickActions);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showQuickActions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-cardDark border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(course);
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Status Badge & Student Count Row */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.className}`}
        >
          {statusBadge.text}
        </span>

        <div
          className={`flex items-center gap-1 text-sm ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-mutedDark"}`}
        >
          <Users className="w-4 h-4" />
          <span>
            {course.studentCount}/{course.maxStudents}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-mutedDark mb-1">
          <span>Enrollment</span>
          <span>{Math.round(capacityPercentage)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${capacityPercentage}%` }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`h-full rounded-full ${
              isFull
                ? "bg-red-500 dark:bg-red-600"
                : isAlmostFull
                  ? "bg-yellow-500 dark:bg-yellow-600"
                  : "bg-green-500 dark:bg-green-600"
            }`}
          />
        </div>
      </div>

      {/* Schedule Time */}
      {course.scheduleTime && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 dark:text-mutedDark">
            📅 {course.scheduleTime}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {!selectionMode && (
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(course);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`View details for ${course.name}`}
          >
            <Eye className="w-4 h-4" />
            View
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onUploadMaterials(course);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label={`Upload materials for ${course.name}`}
          >
            <Upload className="w-4 h-4" />
            Upload
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveCourse(course);
            }}
            className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            title="Remove Course"
            aria-label={`Remove ${course.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
