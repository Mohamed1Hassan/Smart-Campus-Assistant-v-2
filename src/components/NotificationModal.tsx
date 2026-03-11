"use client";
import {
  X,
  BookOpen,
  Bell,
  Award,
  FileText,
  Settings,
  ExternalLink,
} from "lucide-react";
import { Notification } from "../data/notificationsData";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface NotificationModalProps {
  notification: Notification | null;
  onClose: () => void;
}

const typeIcons = {
  exam: BookOpen,
  announcement: Bell,
  grade: Award,
  assignment: FileText,
  system: Settings,
};

const typeColors = {
  exam: "text-orange-500 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20",
  announcement:
    "text-blue-500 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
  grade: "text-green-500 bg-green-50 dark:text-green-400 dark:bg-green-900/20",
  assignment:
    "text-purple-500 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20",
  system: "text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/50",
};

const typeTags = {
  exam: "Exam",
  announcement: "Announcement",
  grade: "Grade",
  assignment: "Assignment",
  system: "System",
};

export default function NotificationModal({
  notification,
  onClose,
}: NotificationModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (notification) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [notification]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (notification) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [notification, onClose]);

  if (!notification) return null;

  const Icon = typeIcons[notification.type];

  const handleLinkClick = () => {
    if (notification.link) {
      router.push(notification.link);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white dark:bg-cardDark rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-cardDark border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${typeColors[notification.type]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-mutedDark uppercase tracking-wide">
              {typeTags[notification.type]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <h2
            id="modal-title"
            className="text-xl font-bold text-gray-900 dark:text-textDark mb-3"
          >
            {notification.title}
          </h2>

          <p className="text-sm text-gray-500 dark:text-mutedDark mb-4">
            {notification.time}
          </p>

          <p className="text-base text-gray-700 dark:text-textDark leading-relaxed mb-6">
            {notification.message}
          </p>

          {notification.link && (
            <button
              onClick={handleLinkClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              View Details
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
