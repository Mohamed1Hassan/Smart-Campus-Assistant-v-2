"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Users, Clock, Hash } from "lucide-react";

interface Course {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  maxStudents: number;
  scheduleTime?: string;
}

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCourse: (course: Omit<Course, "id" | "studentCount">) => void;
}

export default function AddCourseModal({
  isOpen,
  onClose,
  onAddCourse,
}: AddCourseModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    maxStudents: 50,
    scheduleTime: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Course name is required";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Course code is required";
    } else if (!/^[A-Z]{2,4}\d{3,4}$/i.test(formData.code.trim())) {
      newErrors.code = "Course code should be in format like CS401, MATH101";
    }

    if (formData.maxStudents < 1 || formData.maxStudents > 500) {
      newErrors.maxStudents = "Max students should be between 1 and 500";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onAddCourse({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        maxStudents: formData.maxStudents,
        scheduleTime: formData.scheduleTime.trim() || undefined,
      });

      // Reset form
      setFormData({
        name: "",
        code: "",
        maxStudents: 50,
        scheduleTime: "",
      });
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white dark:bg-cardDark rounded-xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-textDark">
                    Add New Course
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-mutedDark">
                    Create a new course for your students
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Name *
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-darkBg border rounded-lg text-gray-900 dark:text-textDark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.name
                        ? "border-red-300 dark:border-red-600"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    placeholder="e.g., Machine Learning"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Course Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Code *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      handleInputChange("code", e.target.value.toUpperCase())
                    }
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-darkBg border rounded-lg text-gray-900 dark:text-textDark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.code
                        ? "border-red-300 dark:border-red-600"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    placeholder="e.g., CS401"
                  />
                </div>
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.code}
                  </p>
                )}
              </div>

              {/* Max Students */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Students *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formData.maxStudents}
                    onChange={(e) =>
                      handleInputChange(
                        "maxStudents",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-darkBg border rounded-lg text-gray-900 dark:text-textDark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.maxStudents
                        ? "border-red-300 dark:border-red-600"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  />
                </div>
                {errors.maxStudents && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.maxStudents}
                  </p>
                )}
              </div>

              {/* Schedule Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Schedule Time (Optional)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={formData.scheduleTime}
                    onChange={(e) =>
                      handleInputChange("scheduleTime", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-darkBg border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-textDark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., Mon/Wed/Fri 9:00 AM"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Add Course
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
