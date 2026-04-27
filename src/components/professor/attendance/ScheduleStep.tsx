import React from "react";
import { motion } from "framer-motion";

interface ScheduleFormData {
  startTime: string;
  duration: number;
}

interface FormErrors {
  startTime?: string;
}

interface ScheduleStepProps {
  formData: ScheduleFormData;
  errors: FormErrors;
  handleInputChange: (field: string, value: string | number) => void;
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
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl border border-white/40 dark:border-gray-700/50">
        <h2 className="text-xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
          </div>
          Session Timing | وقت الجلسة
        </h2>

        <div className="space-y-8">
          <div className="relative group">
            <label
              htmlFor="session-start-time"
              className="block text-sm font-black text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider"
            >
              Start Date & Time
            </label>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleQuickTimeSelect("now")}
                className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all border border-purple-100 dark:border-purple-800/50 active:scale-95"
              >
                ⚡ Starts in 5 min
              </button>
              <button
                type="button"
                onClick={() => handleQuickTimeSelect("today")}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-gray-100 dark:border-gray-700 active:scale-95"
              >
                📅 Today 2:00 PM
              </button>
              <button
                type="button"
                onClick={() => handleQuickTimeSelect("tomorrow")}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-gray-100 dark:border-gray-700 active:scale-95"
              >
                🌅 Tomorrow 9:00 AM
              </button>
            </div>

            <input
              id="session-start-time"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => handleInputChange("startTime", e.target.value)}
              className={`w-full px-5 py-4 rounded-2xl border bg-gray-50/50 dark:bg-gray-900/50 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium ${
                errors.startTime
                  ? "border-red-300 ring-4 ring-red-500/10"
                  : "border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600"
              }`}
            />
            {errors.startTime && (
              <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.startTime}
              </p>
            )}
          </div>

          <div className="bg-gray-50/50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <label
                htmlFor="session-duration-range"
                className="block text-sm font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider"
              >
                Duration (Hours)
              </label>
              <span className="text-lg font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-4 py-1.5 rounded-xl border border-purple-100 dark:border-purple-800/50">
                {formData.duration}h
              </span>
            </div>
            
            <div className="flex items-center gap-6">
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
                className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-600 transition-all hover:accent-purple-700"
                aria-label={`Duration: ${formData.duration} hours`}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>30 Min</span>
                <span>4 Hours</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ScheduleStep;
