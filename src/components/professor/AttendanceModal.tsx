"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, User, BookOpen, Hash } from "lucide-react";
import { AttendanceRecord } from "./AttendanceTable";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<AttendanceRecord, "id">) => void;
  editingRecord?: AttendanceRecord | null;
}

const courses = [
  "Machine Learning",
  "Operating Systems",
  "Databases",
  "Linear Algebra",
  "Artificial Intelligence",
];

const statusOptions: AttendanceRecord["status"][] = [
  "Present",
  "Absent",
  "Late",
];

export default function AttendanceModal({
  isOpen,
  onClose,
  onSave,
  editingRecord,
}: AttendanceModalProps) {
  const [formData, setFormData] = useState({
    studentName: "",
    studentId: "",
    course: "",
    date: new Date().toISOString().split("T")[0],
    status: "Present" as AttendanceRecord["status"],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // No need for useEffect here if we handle initialization logic carefully.
  // Instead of syncing state, we can use a key on the component to force a remount when it opens
  // or just simplify the logic. For now, let's keep the useEffect but ensure it only runs once per open.
  useEffect(() => {
    if (!isOpen) return;

    // Initial data setup
    const initialData = editingRecord
      ? {
          studentName: editingRecord.studentName,
          studentId: editingRecord.studentId,
          course: editingRecord.course,
          date: editingRecord.date,
          status: editingRecord.status,
        }
      : {
          studentName: "",
          studentId: "",
          course: "",
          date: new Date().toISOString().split("T")[0],
          status: "Present" as AttendanceRecord["status"],
        };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(initialData);
    setErrors({});
  }, [isOpen, editingRecord]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentName.trim()) {
      newErrors.studentName = "Student name is required";
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = "Student ID is required";
    } else if (!/^[A-Z0-9]{6,10}$/i.test(formData.studentId.trim())) {
      newErrors.studentId =
        "Student ID should be 6-10 characters (letters/numbers)";
    }

    if (!formData.course) {
      newErrors.course = "Course selection is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.date = "Date cannot be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSave({
        studentName: formData.studentName.trim(),
        studentId: formData.studentId.trim().toUpperCase(),
        course: formData.course,
        date: formData.date,
        status: formData.status,
      });

      onClose();
    }
  };

  const handleInputChange = (field: string, value: string) => {
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
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-textDark">
                    {editingRecord
                      ? "Edit Attendance"
                      : "Add Attendance Record"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-mutedDark">
                    {editingRecord
                      ? "Update attendance information"
                      : "Record student attendance"}
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
              {/* Student Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Student Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) =>
                      handleInputChange("studentName", e.target.value)
                    }
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-darkBg border rounded-lg text-gray-900 dark:text-textDark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.studentName
                        ? "border-red-300 dark:border-red-600"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    placeholder="e.g., Ahmed Hassan"
                  />
                </div>
                {errors.studentName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.studentName}
                  </p>
                )}
              </div>

              {/* Student ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Student ID *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) =>
                      handleInputChange(
                        "studentId",
                        e.target.value.toUpperCase(),
                      )
                    }
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-darkBg border rounded-lg text-gray-900 dark:text-textDark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.studentId
                        ? "border-red-300 dark:border-red-600"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    placeholder="e.g., STU123456"
                  />
                </div>
                {errors.studentId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.studentId}
                  </p>
                )}
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course *
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <select
                    value={formData.course}
                    onChange={(e) =>
                      handleInputChange("course", e.target.value)
                    }
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-darkBg border rounded-lg text-gray-900 dark:text-textDark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.course
                        ? "border-red-300 dark:border-red-600"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.course && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.course}
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-darkBg border rounded-lg text-gray-900 dark:text-textDark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.date
                        ? "border-red-300 dark:border-red-600"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  />
                </div>
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.date}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Attendance Status *
                </label>
                <div className="space-y-3">
                  {statusOptions.map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={formData.status === status}
                        onChange={(e) =>
                          handleInputChange("status", e.target.value)
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                      <span className="text-sm text-gray-900 dark:text-textDark">
                        {status === "Present" && "🟢 Present"}
                        {status === "Absent" && "🔴 Absent"}
                        {status === "Late" && "🟡 Late"}
                      </span>
                    </label>
                  ))}
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
                  {editingRecord ? "Update Record" : "Add Record"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
