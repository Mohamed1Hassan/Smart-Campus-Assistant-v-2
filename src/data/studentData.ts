// Mock data for student dashboard

export interface ClassItem {
  id: string;
  course: string;
  time: string;
  room: string;
  status: "upcoming" | "ongoing" | "completed";
}

export interface Announcement {
  id: string;
  icon: "megaphone" | "building" | "lightbulb" | "book" | "calendar" | "alert";
  title: string;
  message: string;
  timestamp: string;
  type: "info" | "warning" | "success";
}

// LocalStorage persistence functions
export const saveStudentData = <T>(key: string, data: T) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`student-${key}`, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving student data:", error);
  }
};

export const loadStudentData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const saved = localStorage.getItem(`student-${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error("Error loading student data:", error);
    return defaultValue;
  }
};

// Sample schedule data for today
export const todaySchedule: ClassItem[] = [
  {
    id: "1",
    course: "Machine Learning",
    time: "9:00 AM",
    room: "Room A12",
    status: "upcoming",
  },
  {
    id: "2",
    course: "Operating Systems",
    time: "11:00 AM",
    room: "Room B2",
    status: "ongoing",
  },
  {
    id: "3",
    course: "Databases",
    time: "2:00 PM",
    room: "Room C5",
    status: "completed",
  },
];

// Sample announcements data
export const announcementsData: Announcement[] = [
  {
    id: "1",
    icon: "megaphone",
    title: "Exam Schedule Released",
    message:
      "Midterm exam schedule for all courses has been published. Check your student portal for detailed timings and room assignments.",
    timestamp: "2h ago",
    type: "info",
  },
  {
    id: "2",
    icon: "building",
    title: "Library Hours Updated",
    message:
      "The main library will now be open 24/7 during exam period. Extended hours start from next Monday.",
    timestamp: "4h ago",
    type: "success",
  },
  {
    id: "3",
    icon: "lightbulb",
    title: "New AI Course Added",
    message:
      "Advanced AI and Machine Learning course has been added to the elective list for next semester. Registration opens next week.",
    timestamp: "6h ago",
    type: "info",
  },
  {
    id: "4",
    icon: "alert",
    title: "Campus Wi-Fi Maintenance",
    message:
      "Scheduled maintenance for campus Wi-Fi will occur this Friday from 11 PM to 2 AM. Plan your online activities accordingly.",
    timestamp: "1d ago",
    type: "warning",
  },
];

// Student statistics
export const studentStats = {
  gpa: 3.85,
  upcomingClasses: 2,
  completedCourses: 10,
  pendingAssignments: 3,
};
