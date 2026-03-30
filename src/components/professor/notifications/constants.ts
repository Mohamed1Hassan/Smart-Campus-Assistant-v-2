import { NotificationItem } from "./NotificationCard";

// Mock notification data for professors
export const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "submission",
    title: "New Assignment Submitted",
    description: "Ahmed Hassan submitted AI Project - Final FileText.",
    timestamp: "5 minutes ago",
    read: false,
    studentName: "Ahmed Hassan",
    courseName: "AI Project",
  },
  {
    id: "2",
    type: "message",
    title: "New Message Received",
    description:
      "Sara Mohamed asked a question about the Machine Learning assignment.",
    timestamp: "15 minutes ago",
    read: false,
    studentName: "Sara Mohamed",
    courseName: "Machine Learning",
  },
  {
    id: "3",
    type: "assignment",
    title: "Assignment Reminder",
    description: "Data Structures Project deadline is in 2 days.",
    timestamp: "1 hour ago",
    read: true,
    courseName: "Data Structures",
  },
  {
    id: "4",
    type: "schedule",
    title: "Class Schedule Update",
    description: "Operating Systems class moved from Room 205 to Room 301.",
    timestamp: "2 hours ago",
    read: false,
    courseName: "Operating Systems",
  },
  {
    id: "5",
    type: "system",
    title: "System Maintenance Alert",
    description: "LMS will be under maintenance tonight from 11 PM to 2 AM.",
    timestamp: "3 hours ago",
    read: true,
  },
  {
    id: "6",
    type: "submission",
    title: "Lab FileText Submitted",
    description: "Omar Ali submitted Database Systems Lab FileText #3.",
    timestamp: "4 hours ago",
    read: true,
    studentName: "Omar Ali",
    courseName: "Database Systems",
  },
  {
    id: "7",
    type: "message",
    title: "Question About Grading",
    description: "Fatima Ahmed has a question about her recent quiz grade.",
    timestamp: "6 hours ago",
    read: false,
    studentName: "Fatima Ahmed",
    courseName: "Software Engineering",
  },
  {
    id: "8",
    type: "assignment",
    title: "Assignment Deadline Extended",
    description: "Machine Learning Project deadline extended by 2 days.",
    timestamp: "1 day ago",
    read: true,
    courseName: "Machine Learning",
  },
  {
    id: "9",
    type: "submission",
    title: "Quiz Completed",
    description: "Youssef Ibrahim completed the Linear Algebra Quiz #3.",
    timestamp: "2 days ago",
    read: false,
    studentName: "Youssef Ibrahim",
    courseName: "Linear Algebra",
  },
  {
    id: "10",
    type: "message",
    title: "Office Hours Request",
    description:
      "Nour Hassan requested an office hours appointment for next week.",
    timestamp: "3 days ago",
    read: true,
    studentName: "Nour Hassan",
    courseName: "Data Structures",
  },
];

// Helper to parse timestamp
export const parseTimestamp = (ts: string): Date => {
  // Try ISO format first
  const isoDate = new Date(ts);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Parse relative time like "5 minutes ago", "1 hour ago", "2 days ago"
  const now = new Date();
  const matches = ts.match(/(\d+)\s+(minute|hour|day|week|month)s?\s+ago/i);
  if (matches) {
    const amount = parseInt(matches[1]);
    const unit = matches[2].toLowerCase();
    const date = new Date(now);

    switch (unit) {
      case "minute":
        date.setMinutes(date.getMinutes() - amount);
        break;
      case "hour":
        date.setHours(date.getHours() - amount);
        break;
      case "day":
        date.setDate(date.getDate() - amount);
        break;
      case "week":
        date.setDate(date.getDate() - amount * 7);
        break;
      case "month":
        date.setMonth(date.getMonth() - amount);
        break;
    }
    return date;
  }

  return now;
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

export const isThisWeek = (date: Date): boolean => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return date > weekAgo && !isToday(date) && !isYesterday(date);
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};
