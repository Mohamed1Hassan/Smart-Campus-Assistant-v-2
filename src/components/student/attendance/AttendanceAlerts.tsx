"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, CheckCircle, Info } from "lucide-react";
import { useState } from "react";

interface AttendanceAlertsProps {
  alerts: string[];
}

export default function AttendanceAlerts({ alerts }: AttendanceAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(
    new Set(),
  );

  const dismissAlert = (index: number) => {
    setDismissedAlerts((prev) => new Set([...prev, index]));
  };

  const getAlertConfig = (alert: string) => {
    if (alert.includes("below 80%")) {
      return {
        icon: AlertTriangle,
        color:
          "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
        iconColor: "text-red-600 dark:text-red-400",
        textColor: "text-red-800 dark:text-red-200",
        severity: "high",
      };
    } else if (alert.includes("missed 3 or more")) {
      return {
        icon: AlertTriangle,
        color:
          "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
        iconColor: "text-orange-600 dark:text-orange-400",
        textColor: "text-orange-800 dark:text-orange-200",
        severity: "medium",
      };
    } else if (alert.includes("consecutive")) {
      return {
        icon: Info,
        color:
          "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
        iconColor: "text-yellow-600 dark:text-yellow-400",
        textColor: "text-yellow-800 dark:text-yellow-200",
        severity: "low",
      };
    } else {
      return {
        icon: CheckCircle,
        color:
          "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
        iconColor: "text-green-600 dark:text-green-400",
        textColor: "text-green-800 dark:text-green-200",
        severity: "info",
      };
    }
  };

  if (alerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white dark:bg-cardDark rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-textDark">
              All Good! 🎉
            </h3>
            <p className="text-sm text-gray-600 dark:text-mutedDark">
              Your attendance is on track. Keep up the great work!
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 rounded-full flex items-center justify-center"
        >
          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </motion.div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-textDark">
            Attendance Alerts
          </h3>
          <p className="text-sm text-gray-600 dark:text-mutedDark">
            Important notices about your attendance
          </p>
        </div>
      </div>

      <AnimatePresence>
        {alerts.map((alert, index) => {
          if (dismissedAlerts.has(index)) return null;

          const config = getAlertConfig(alert);
          const Icon = config.icon;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className={`${config.color} border rounded-xl p-4 relative overflow-hidden`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-20 h-20 bg-current rounded-full -translate-y-10 translate-x-10" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-current rounded-full translate-y-8 -translate-x-8" />
              </div>

              <div className="relative flex items-start gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: index * 0.1 + 0.2,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className={`w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm`}
                >
                  <Icon className={`w-4 h-4 ${config.iconColor}`} />
                </motion.div>

                <div className="flex-1">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className={`text-sm font-medium ${config.textColor} leading-relaxed`}
                  >
                    {alert}
                  </motion.p>
                </div>

                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.4 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => dismissAlert(index)}
                  className={`p-1 rounded-full hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors ${config.iconColor}`}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Severity Indicator */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                className={`absolute bottom-0 left-0 h-1 ${
                  config.severity === "high"
                    ? "bg-red-500"
                    : config.severity === "medium"
                      ? "bg-orange-500"
                      : config.severity === "low"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                }`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Dismiss All Button */}
      {alerts.length > 1 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() =>
            setDismissedAlerts(new Set(alerts.map((_, index) => index)))
          }
          className="w-full py-2 px-4 text-sm font-medium text-gray-600 dark:text-mutedDark bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
        >
          Dismiss All Alerts
        </motion.button>
      )}
    </motion.div>
  );
}
