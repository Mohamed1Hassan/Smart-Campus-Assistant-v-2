// Enhanced schedule data for student schedule page

export interface ScheduleClass {
  id: string;
  course: string;
  day: string;
  time: string;
  room: string;
  instructor: string;
  status: "upcoming" | "ongoing" | "completed";
  duration: string;
  type?: "Lecture" | "Section";
}

export interface FilterOptions {
  day: string;
  status: string;
}

// Sample weekly schedule data
export const weeklySchedule: ScheduleClass[] = [
  {
    id: "1",
    course: "Machine Learning",
    day: "Sunday",
    time: "9:00 AM - 10:30 AM",
    room: "A12",
    instructor: "Dr. Ahmed",
    status: "upcoming",
    duration: "1.5h",
  },
  {
    id: "2",
    course: "Operating Systems",
    day: "Monday",
    time: "11:00 AM - 12:30 PM",
    room: "B2",
    instructor: "Dr. Sara",
    status: "upcoming",
    duration: "1.5h",
  },
  {
    id: "3",
    course: "Databases",
    day: "Tuesday",
    time: "1:00 PM - 2:30 PM",
    room: "C5",
    instructor: "Dr. Omar",
    status: "ongoing",
    duration: "1.5h",
  },
  {
    id: "4",
    course: "Linear Algebra",
    day: "Wednesday",
    time: "9:00 AM - 10:30 AM",
    room: "D3",
    instructor: "Dr. Mona",
    status: "completed",
    duration: "1.5h",
  },
  {
    id: "5",
    course: "Artificial Intelligence",
    day: "Thursday",
    time: "12:00 PM - 1:30 PM",
    room: "E1",
    instructor: "Dr. Hossam",
    status: "upcoming",
    duration: "1.5h",
  },
  {
    id: "6",
    course: "Data Structures",
    day: "Sunday",
    time: "2:00 PM - 3:30 PM",
    room: "F4",
    instructor: "Dr. Youssef",
    status: "upcoming",
    duration: "1.5h",
  },
  {
    id: "7",
    course: "Software Engineering",
    day: "Monday",
    time: "3:00 PM - 4:30 PM",
    room: "G7",
    instructor: "Dr. Nour",
    status: "completed",
    duration: "1.5h",
  },
  {
    id: "8",
    course: "Computer Networks",
    day: "Tuesday",
    time: "10:00 AM - 11:30 AM",
    room: "H9",
    instructor: "Dr. Karim",
    status: "upcoming",
    duration: "1.5h",
  },
  {
    id: "9",
    course: "Web Development",
    day: "Wednesday",
    time: "1:00 PM - 2:30 PM",
    room: "I2",
    instructor: "Dr. Layla",
    status: "ongoing",
    duration: "1.5h",
  },
  {
    id: "10",
    course: "Mobile Development",
    day: "Thursday",
    time: "3:00 PM - 4:30 PM",
    room: "J5",
    instructor: "Dr. Tarek",
    status: "upcoming",
    duration: "1.5h",
  },
];

// Get current day for highlighting
export const getCurrentDay = (): string => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[new Date().getDay()];
};

// Filter options
export const dayOptions = [
  "All Days",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
];
export const statusOptions = ["All Status", "Upcoming", "Ongoing", "Completed"];

// LocalStorage functions for schedule
export const saveScheduleFilters = (filters: FilterOptions) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("student-schedule-filters", JSON.stringify(filters));
  } catch (error) {
    console.error("Error saving schedule filters:", error);
  }
};

export const loadScheduleFilters = (): FilterOptions => {
  if (typeof window === "undefined")
    return { day: "All Days", status: "All Status" };
  try {
    const saved = localStorage.getItem("student-schedule-filters");
    return saved
      ? JSON.parse(saved)
      : { day: "All Days", status: "All Status" };
  } catch (error) {
    console.error("Error loading schedule filters:", error);
    return { day: "All Days", status: "All Status" };
  }
};
