"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X } from "lucide-react";

interface ToastStudentProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onClose: () => void;
}

export default function ToastStudent({
  message,
  type = "success",
  onClose,
}: ToastStudentProps) {
  const typeConfig = {
    success: {
      bgColor: "bg-green-500",
      icon: CheckCircle,
      iconColor: "text-white",
    },
    error: {
      bgColor: "bg-red-500",
      icon: CheckCircle,
      iconColor: "text-white",
    },
    info: {
      bgColor: "bg-blue-500",
      icon: CheckCircle,
      iconColor: "text-white",
    },
    warning: {
      bgColor: "bg-orange-500",
      icon: CheckCircle,
      iconColor: "text-white",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.3 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.3 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        className={`${config.bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-sm`}
      >
        <Icon className={`w-5 h-5 ${config.iconColor}`} />
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-auto p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
