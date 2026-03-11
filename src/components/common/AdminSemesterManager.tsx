"use client";
import { useState } from "react";
import { RefreshCw, Play, AlertTriangle } from "lucide-react";
import ConfirmModal from "../ConfirmModal";
import { useToast } from "./ToastProvider";
import { apiClient } from "../../services/api";

interface SemesterManagerProps {
  onRolloverComplete?: () => void;
}

export default function AdminSemesterManager({
  onRolloverComplete,
}: SemesterManagerProps) {
  const [activeSemester, setActiveSemester] = useState<string>("FALL");
  const [activeYear, setActiveYear] = useState<string>("2025-2026");
  const [nextSemester, setNextSemester] = useState<string>("SPRING");
  const [nextYear, setNextYear] = useState<string>("2025-2026");

  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const handleRollover = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post("/admin/semester/rollover", {
        newSemester: nextSemester,
        newYear: nextYear,
        oldSemester: activeSemester,
        oldYear: activeYear,
      });

      if (response.success) {
        showSuccess(
          response.message || "Semester Rollover Completed successfully!",
          { showProgress: true },
        );
        setActiveSemester(nextSemester);
        setActiveYear(nextYear);
        if (onRolloverComplete) onRolloverComplete();
      } else {
        const errorObj = response.error as { message?: string; error?: string };
        const errorMessage =
          typeof response.error === "object" && response.error !== null
            ? errorObj.message || errorObj.error
            : response.error;
        showError(
          errorMessage || response.message || "Failed to rollover semester.",
        );
      }
    } catch (error: unknown) {
      console.error("Rollover error:", error);
      const err = error as { message?: string; code?: string; stack?: string };
      const errorMessage =
        err.message ||
        (typeof error === "string" ? error : "An unexpected error occurred");
      const technicalDetails = err.code ? ` (Code: ${err.code})` : "";

      showError(`${errorMessage}${technicalDetails}`);

      // For developers: log the full details in more readable format
      console.group("Semester Rollover Failure Diagnostics");
      console.log("Message:", errorMessage);
      console.log("Full Error Object:", error);
      if (err.stack) console.log("Stack Trace:", err.stack);
      console.groupEnd();
    } finally {
      setIsLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="bg-white dark:bg-cardDark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Semester Rollover & Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Transition to a new semester. This will archive current courses and
            duplicate them for the next term.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Current State - Now Editable */}
        <div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Play className="w-4 h-4 text-green-500 rotate-180" />
            Source Term (From)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Source Academic Year
              </label>
              <input
                type="text"
                value={activeYear}
                onChange={(e) => setActiveYear(e.target.value)}
                className="w-full font-medium px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="Year in DB (e.g. 2024-2025)"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Source Semester
              </label>
              <select
                value={activeSemester}
                onChange={(e) => setActiveSemester(e.target.value)}
                className="w-full font-medium px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                <option value="FALL">FALL</option>
                <option value="SPRING">SPRING</option>
                <option value="SUMMER">SUMMER</option>
              </select>
            </div>
          </div>
        </div>

        {/* Next State setup */}
        <div className="p-5 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 relative">
          <div className="absolute top-1/2 -left-4 md:-left-6 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 transform -translate-y-1/2 z-10 text-gray-400 hidden md:block">
            <Play className="w-4 h-4" />
          </div>

          <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Next Term Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Target Academic Year
              </label>
              <input
                type="text"
                value={nextYear}
                onChange={(e) => setNextYear(e.target.value)}
                className="w-full font-medium px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. 2024-2025"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Target Semester
              </label>
              <select
                value={nextSemester}
                onChange={(e) => setNextSemester(e.target.value)}
                className="w-full font-medium px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="FALL">FALL</option>
                <option value="SPRING">SPRING</option>
                <option value="SUMMER">SUMMER</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={isLoading}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-xl flex items-center gap-2 transition-colors shadow-sm shadow-red-500/20"
        >
          {isLoading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          {isLoading ? "Processing..." : "Start Semester Rollover"}
        </button>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Semester Rollover"
        message={`Are you absolutely sure you want to rollover to ${nextSemester} ${nextYear}? This will archive all ACTIVE courses from ${activeSemester} ${activeYear} and duplicate them for the new term. This action cannot be undone.`}
        confirmText="Yes, Execute Rollover"
        cancelText="Cancel"
        onConfirm={handleRollover}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
}
