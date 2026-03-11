"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Calendar } from "lucide-react";

interface SyncModalStudentProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SyncModalStudent({
  isOpen,
  onClose,
}: SyncModalStudentProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white dark:bg-cardDark rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </motion.div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-textDark mb-2">
                Synced with Google Calendar!
              </h3>

              <p className="text-gray-600 dark:text-mutedDark mb-6">
                Your class schedule has been successfully synced with your
                Google Calendar. You&apos;ll receive notifications for upcoming
                classes.
              </p>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-mutedDark mb-6">
                <Calendar className="w-4 h-4" />
                <span>Next sync: Tomorrow at 6:00 AM</span>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
