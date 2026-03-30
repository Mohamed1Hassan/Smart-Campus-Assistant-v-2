import React from "react";
import { motion } from "framer-motion";

interface ScheduleStepProps {
  formData: any;
  errors: any;
  handleInputChange: (field: string, value: any) => void;
  handleQuickTimeSelect: (type: "now" | "today" | "tomorrow") => void;
}

const ScheduleStep: React.FC<ScheduleStepProps> = ({
  formData,
  errors,
  handleInputChange,
  handleQuickTimeSelect,
}) => {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-white dark:bg-cardDark rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Timing
        </h2>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="session-start-time"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Start Time
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleQuickTimeSelect("now")}
                className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs rounded-full hover:bg-purple-100 transition-colors"
              >
                Starts in 5 min
              </button>
              <button
                type="button"
                onClick={() => handleQuickTimeSelect("today")}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-full hover:bg-gray-200 transition-colors"
              >
                Today 2:00 PM
              </button>
              <button
                type="button"
                onClick={() => handleQuickTimeSelect("tomorrow")}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-full hover:bg-gray-200 transition-colors"
              >
                Tomorrow 9:00 AM
              </button>
            </div>
            <input
              id="session-start-time"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => handleInputChange("startTime", e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition-all ${
                errors.startTime
                  ? "border-red-300 focus:ring-red-200"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            />
            {errors.startTime && (
              <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="session-duration-range"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Duration (Hours)
            </label>
            <div className="flex items-center gap-4">
              <input
                id="session-duration-range"
                type="range"
                min="0.5"
                max="4"
                step="0.5"
                value={formData.duration}
                onChange={(e) =>
                  handleInputChange("duration", parseFloat(e.target.value))
                }
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                aria-label={`Duration: ${formData.duration} hours`}
              />
              <span className="w-16 text-center font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                {formData.duration}h
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ScheduleStep;
