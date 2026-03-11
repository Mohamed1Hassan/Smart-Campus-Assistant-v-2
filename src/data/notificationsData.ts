export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
  type: "exam" | "announcement" | "grade" | "assignment" | "system";
}

export const notificationsData: Notification[] = [
  {
    id: 1,
    title: "Exam Schedule Updated",
    message:
      "Final exam for Database Systems has been moved to December 10, 2025 at 10:00 AM",
    time: "2h ago",
    read: false,
    link: "/schedule#db",
    type: "exam",
  },
  {
    id: 2,
    title: "New Announcement",
    message:
      "Registration for next semester opens next week. Please check your eligibility",
    time: "1 day ago",
    read: true,
    link: "/announcements/12",
    type: "announcement",
  },
  {
    id: 3,
    title: "Grade Posted",
    message: "Your grade for Data Structures midterm exam is now available",
    time: "2 days ago",
    read: false,
    link: "/grades",
    type: "grade",
  },
  {
    id: 4,
    title: "Assignment Due Soon",
    message: "Operating Systems project submission deadline is in 3 days",
    time: "3 days ago",
    read: true,
    link: "/assignments/45",
    type: "assignment",
  },
  {
    id: 5,
    title: "Campus Wi-Fi Maintenance",
    message: "Network services will be unavailable on Friday from 2 AM to 6 AM",
    time: "4 days ago",
    read: true,
    link: undefined,
    type: "system",
  },
  {
    id: 6,
    title: "New Course Materials",
    message: "Professor Johnson uploaded lecture slides for Week 7",
    time: "5 days ago",
    read: true,
    link: "/courses/materials",
    type: "announcement",
  },
  {
    id: 7,
    title: "Lab Session Rescheduled",
    message: "AI Fundamentals lab moved from Monday 2 PM to Wednesday 3 PM",
    time: "6 days ago",
    read: false,
    link: "/schedule",
    type: "announcement",
  },
  {
    id: 8,
    title: "Quiz Reminder",
    message: "Linear Algebra quiz scheduled for tomorrow at 11 AM",
    time: "1 week ago",
    read: true,
    link: "/schedule",
    type: "exam",
  },
];
