// Mock attendance data for student attendance page

export interface AttendanceRecord {
  id: string;
  course: string;
  date: string;
  status: "present" | "absent" | "late";
  type: "Lecture" | "Lab" | "Tutorial" | "Seminar";
  time: string;
  instructor: string;
  code?: string;
}

export interface WeeklyAttendance {
  week: string;
  percentage: number;
  course?: string;
}

export interface AttendanceStats {
  overallAttendance: number;
  missedClasses: number;
  totalClasses: number;
  lateClasses: number;
}

// Mock attendance records
export const attendanceRecords: AttendanceRecord[] = [
  {
    id: "1",
    course: "Machine Learning",
    date: "Oct 2, 2025",
    status: "present",
    type: "Lecture",
    time: "9:00 AM - 10:30 AM",
    instructor: "Dr. Ahmed",
  },
  {
    id: "2",
    course: "Databases",
    date: "Oct 3, 2025",
    status: "absent",
    type: "Lab",
    time: "11:00 AM - 12:30 PM",
    instructor: "Dr. Omar",
  },
  {
    id: "3",
    course: "Artificial Intelligence",
    date: "Oct 5, 2025",
    status: "late",
    type: "Tutorial",
    time: "2:00 PM - 3:30 PM",
    instructor: "Dr. Hossam",
  },
  {
    id: "4",
    course: "Operating Systems",
    date: "Oct 7, 2025",
    status: "present",
    type: "Lecture",
    time: "10:00 AM - 11:30 AM",
    instructor: "Dr. Sara",
  },
  {
    id: "5",
    course: "Machine Learning",
    date: "Oct 9, 2025",
    status: "present",
    type: "Lab",
    time: "1:00 PM - 2:30 PM",
    instructor: "Dr. Ahmed",
  },
  {
    id: "6",
    course: "Linear Algebra",
    date: "Oct 10, 2025",
    status: "present",
    type: "Lecture",
    time: "9:00 AM - 10:30 AM",
    instructor: "Dr. Mona",
  },
  {
    id: "7",
    course: "Artificial Intelligence",
    date: "Oct 12, 2025",
    status: "absent",
    type: "Lecture",
    time: "12:00 PM - 1:30 PM",
    instructor: "Dr. Hossam",
  },
  {
    id: "8",
    course: "Data Structures",
    date: "Oct 14, 2025",
    status: "present",
    type: "Tutorial",
    time: "3:00 PM - 4:30 PM",
    instructor: "Dr. Youssef",
  },
  {
    id: "9",
    course: "Software Engineering",
    date: "Oct 16, 2025",
    status: "late",
    type: "Seminar",
    time: "2:00 PM - 3:30 PM",
    instructor: "Dr. Nour",
  },
  {
    id: "10",
    course: "Computer Networks",
    date: "Oct 17, 2025",
    status: "present",
    type: "Lab",
    time: "10:00 AM - 11:30 AM",
    instructor: "Dr. Karim",
  },
  {
    id: "11",
    course: "Web Development",
    date: "Oct 19, 2025",
    status: "present",
    type: "Lecture",
    time: "1:00 PM - 2:30 PM",
    instructor: "Dr. Layla",
  },
  {
    id: "12",
    course: "Mobile Development",
    date: "Oct 21, 2025",
    status: "present",
    type: "Tutorial",
    time: "3:00 PM - 4:30 PM",
    instructor: "Dr. Tarek",
  },
  {
    id: "13",
    course: "Machine Learning",
    date: "Oct 23, 2025",
    status: "present",
    type: "Lecture",
    time: "9:00 AM - 10:30 AM",
    instructor: "Dr. Ahmed",
  },
  {
    id: "14",
    course: "Artificial Intelligence",
    date: "Oct 24, 2025",
    status: "absent",
    type: "Lab",
    time: "11:00 AM - 12:30 PM",
    instructor: "Dr. Hossam",
  },
  {
    id: "15",
    course: "Operating Systems",
    date: "Oct 26, 2025",
    status: "present",
    type: "Lecture",
    time: "10:00 AM - 11:30 AM",
    instructor: "Dr. Sara",
  },
];

// Weekly attendance data for charts
export const weeklyAttendanceData: WeeklyAttendance[] = [
  { week: "Week 1", percentage: 95, course: "All Courses" },
  { week: "Week 2", percentage: 88, course: "All Courses" },
  { week: "Week 3", percentage: 92, course: "All Courses" },
  { week: "Week 4", percentage: 90, course: "All Courses" },
  { week: "Week 5", percentage: 96, course: "All Courses" },
  { week: "Week 6", percentage: 94, course: "All Courses" },
  { week: "Week 7", percentage: 89, course: "All Courses" },
  { week: "Week 8", percentage: 92, course: "All Courses" },
];

// Course-specific attendance data
export const courseAttendanceData: { [key: string]: WeeklyAttendance[] } = {
  "Introduction to Computer Science": [
    { week: "Week 1", percentage: 100 },
    { week: "Week 2", percentage: 95 },
    { week: "Week 3", percentage: 100 },
    { week: "Week 4", percentage: 90 },
    { week: "Week 5", percentage: 95 },
    { week: "Week 6", percentage: 100 },
    { week: "Week 7", percentage: 90 },
    { week: "Week 8", percentage: 95 },
  ],
  "Data Structures and Algorithms": [
    { week: "Week 1", percentage: 95 },
    { week: "Week 2", percentage: 85 },
    { week: "Week 3", percentage: 90 },
    { week: "Week 4", percentage: 88 },
    { week: "Week 5", percentage: 92 },
    { week: "Week 6", percentage: 90 },
    { week: "Week 7", percentage: 85 },
    { week: "Week 8", percentage: 88 },
  ],
  "Machine Learning": [
    { week: "Week 1", percentage: 100 },
    { week: "Week 2", percentage: 90 },
    { week: "Week 3", percentage: 95 },
    { week: "Week 4", percentage: 88 },
    { week: "Week 5", percentage: 100 },
    { week: "Week 6", percentage: 95 },
    { week: "Week 7", percentage: 90 },
    { week: "Week 8", percentage: 95 },
  ],
  "Database Systems": [
    { week: "Week 1", percentage: 90 },
    { week: "Week 2", percentage: 85 },
    { week: "Week 3", percentage: 88 },
    { week: "Week 4", percentage: 92 },
    { week: "Week 5", percentage: 90 },
    { week: "Week 6", percentage: 85 },
    { week: "Week 7", percentage: 88 },
    { week: "Week 8", percentage: 90 },
  ],
  "Operating Systems": [
    { week: "Week 1", percentage: 95 },
    { week: "Week 2", percentage: 85 },
    { week: "Week 3", percentage: 90 },
    { week: "Week 4", percentage: 92 },
    { week: "Week 5", percentage: 95 },
    { week: "Week 6", percentage: 90 },
    { week: "Week 7", percentage: 88 },
    { week: "Week 8", percentage: 90 },
  ],
  "Computer Networks": [
    { week: "Week 1", percentage: 88 },
    { week: "Week 2", percentage: 82 },
    { week: "Week 3", percentage: 85 },
    { week: "Week 4", percentage: 90 },
    { week: "Week 5", percentage: 88 },
    { week: "Week 6", percentage: 85 },
    { week: "Week 7", percentage: 82 },
    { week: "Week 8", percentage: 85 },
  ],
  "Software Engineering": [
    { week: "Week 1", percentage: 92 },
    { week: "Week 2", percentage: 88 },
    { week: "Week 3", percentage: 90 },
    { week: "Week 4", percentage: 95 },
    { week: "Week 5", percentage: 92 },
    { week: "Week 6", percentage: 88 },
    { week: "Week 7", percentage: 90 },
    { week: "Week 8", percentage: 92 },
  ],
  "Artificial Intelligence": [
    { week: "Week 1", percentage: 90 },
    { week: "Week 2", percentage: 80 },
    { week: "Week 3", percentage: 85 },
    { week: "Week 4", percentage: 88 },
    { week: "Week 5", percentage: 92 },
    { week: "Week 6", percentage: 85 },
    { week: "Week 7", percentage: 82 },
    { week: "Week 8", percentage: 88 },
  ],
  "Linear Algebra": [
    { week: "Week 1", percentage: 95 },
    { week: "Week 2", percentage: 90 },
    { week: "Week 3", percentage: 92 },
    { week: "Week 4", percentage: 88 },
    { week: "Week 5", percentage: 95 },
    { week: "Week 6", percentage: 90 },
    { week: "Week 7", percentage: 88 },
    { week: "Week 8", percentage: 92 },
  ],
  "Discrete Mathematics": [
    { week: "Week 1", percentage: 88 },
    { week: "Week 2", percentage: 85 },
    { week: "Week 3", percentage: 90 },
    { week: "Week 4", percentage: 82 },
    { week: "Week 5", percentage: 88 },
    { week: "Week 6", percentage: 85 },
    { week: "Week 7", percentage: 80 },
    { week: "Week 8", percentage: 85 },
  ],
  "Computer Graphics": [
    { week: "Week 1", percentage: 90 },
    { week: "Week 2", percentage: 88 },
    { week: "Week 3", percentage: 92 },
    { week: "Week 4", percentage: 85 },
    { week: "Week 5", percentage: 90 },
    { week: "Week 6", percentage: 88 },
    { week: "Week 7", percentage: 85 },
    { week: "Week 8", percentage: 88 },
  ],
  "Web Development": [
    { week: "Week 1", percentage: 95 },
    { week: "Week 2", percentage: 90 },
    { week: "Week 3", percentage: 88 },
    { week: "Week 4", percentage: 92 },
    { week: "Week 5", percentage: 95 },
    { week: "Week 6", percentage: 90 },
    { week: "Week 7", percentage: 88 },
    { week: "Week 8", percentage: 90 },
  ],
  "Mobile App Development": [
    { week: "Week 1", percentage: 88 },
    { week: "Week 2", percentage: 85 },
    { week: "Week 3", percentage: 90 },
    { week: "Week 4", percentage: 82 },
    { week: "Week 5", percentage: 88 },
    { week: "Week 6", percentage: 85 },
    { week: "Week 7", percentage: 80 },
    { week: "Week 8", percentage: 85 },
  ],
  Cybersecurity: [
    { week: "Week 1", percentage: 92 },
    { week: "Week 2", percentage: 88 },
    { week: "Week 3", percentage: 90 },
    { week: "Week 4", percentage: 95 },
    { week: "Week 5", percentage: 92 },
    { week: "Week 6", percentage: 88 },
    { week: "Week 7", percentage: 90 },
    { week: "Week 8", percentage: 92 },
  ],
  "Cloud Computing": [
    { week: "Week 1", percentage: 90 },
    { week: "Week 2", percentage: 85 },
    { week: "Week 3", percentage: 88 },
    { week: "Week 4", percentage: 92 },
    { week: "Week 5", percentage: 90 },
    { week: "Week 6", percentage: 85 },
    { week: "Week 7", percentage: 88 },
    { week: "Week 8", percentage: 90 },
  ],
  "Data Science": [
    { week: "Week 1", percentage: 95 },
    { week: "Week 2", percentage: 90 },
    { week: "Week 3", percentage: 92 },
    { week: "Week 4", percentage: 88 },
    { week: "Week 5", percentage: 95 },
    { week: "Week 6", percentage: 90 },
    { week: "Week 7", percentage: 88 },
    { week: "Week 8", percentage: 92 },
  ],
};

// Calculate attendance stats from provided records or use default mock data
export const calculateAttendanceStats = (
  records: AttendanceRecord[] = attendanceRecords,
): AttendanceStats => {
  const totalClasses = records.length;
  const presentClasses = records.filter(
    (record) => record.status === "present",
  ).length;
  const absentClasses = records.filter(
    (record) => record.status === "absent",
  ).length;
  const lateClasses = records.filter(
    (record) => record.status === "late",
  ).length;

  const overallAttendance =
    totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  return {
    overallAttendance,
    missedClasses: absentClasses,
    totalClasses,
    lateClasses,
  };
};

// Get attendance alerts based on provided records or use default mock data
export const getAttendanceAlerts = (
  records: AttendanceRecord[] = attendanceRecords,
  overallAttendance?: number,
): string[] => {
  const alerts: string[] = [];
  const stats = calculateAttendanceStats(records);
  const attendance =
    overallAttendance !== undefined
      ? overallAttendance
      : stats.overallAttendance;

  if (attendance < 80) {
    alerts.push(
      "⚠️ Your overall attendance is below 80%. Please improve your attendance to avoid academic issues.",
    );
  }

  if (stats.missedClasses >= 3) {
    alerts.push(
      "⚠️ You have missed 3 or more classes. Consider contacting your professors for missed material.",
    );
  }

  // Check for consecutive absences in AI course
  const aiRecords = records.filter(
    (record) =>
      record.course === "Artificial Intelligence" ||
      record.course.includes("AI"),
  );
  let consecutiveAbsences = 0;
  for (let i = aiRecords.length - 1; i >= 0; i--) {
    if (aiRecords[i].status === "absent") {
      consecutiveAbsences++;
    } else {
      break;
    }
  }

  if (consecutiveAbsences >= 2) {
    alerts.push(
      "⚠️ You have missed 2 consecutive AI lectures. Contact your professor.",
    );
  }

  return alerts;
};

// Available courses for filtering
export const availableCourses = [
  "All Courses",
  "Introduction to Computer Science",
  "Data Structures and Algorithms",
  "Machine Learning",
  "Database Systems",
  "Operating Systems",
  "Computer Networks",
  "Software Engineering",
  "Artificial Intelligence",
  "Linear Algebra",
  "Discrete Mathematics",
  "Computer Graphics",
  "Web Development",
  "Mobile App Development",
  "Cybersecurity",
  "Cloud Computing",
  "Data Science",
];
