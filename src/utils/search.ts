/**
 * Search Utilities
 * Comprehensive search functionality for courses, students, and other entities
 */

// Search Result Types
export type SearchResultType =
  | "course"
  | "student"
  | "professor"
  | "schedule"
  | "notification"
  | "assignment"
  | "exam";

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: SearchResultType;
  url: string;
  metadata?: {
    [key: string]: unknown;
  };
  score?: number;
}

export interface SearchMetadata {
  total: number;
  categories: {
    courses?: number;
    students?: number;
    professors?: number;
    schedules?: number;
    notifications?: number;
    assignments?: number;
    exams?: number;
  };
  query: string;
  timestamp: number;
}

export interface SearchResponse {
  results: SearchResult[];
  metadata: SearchMetadata;
}

/**
 * Debounce function to limit function calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format search metadata into a readable string
 * @param metadata - Search metadata categories
 * @returns Formatted string representation
 */
export function formatSearchMetadata(
  metadata: SearchMetadata["categories"],
): string {
  const parts: string[] = [];

  if (metadata.courses && metadata.courses > 0) {
    parts.push(`${metadata.courses} course${metadata.courses > 1 ? "s" : ""}`);
  }
  if (metadata.students && metadata.students > 0) {
    parts.push(
      `${metadata.students} student${metadata.students > 1 ? "s" : ""}`,
    );
  }
  if (metadata.professors && metadata.professors > 0) {
    parts.push(
      `${metadata.professors} professor${metadata.professors > 1 ? "s" : ""}`,
    );
  }
  if (metadata.schedules && metadata.schedules > 0) {
    parts.push(
      `${metadata.schedules} schedule${metadata.schedules > 1 ? "s" : ""}`,
    );
  }
  if (metadata.notifications && metadata.notifications > 0) {
    parts.push(
      `${metadata.notifications} notification${metadata.notifications > 1 ? "s" : ""}`,
    );
  }
  if (metadata.assignments && metadata.assignments > 0) {
    parts.push(
      `${metadata.assignments} assignment${metadata.assignments > 1 ? "s" : ""}`,
    );
  }
  if (metadata.exams && metadata.exams > 0) {
    parts.push(`${metadata.exams} exam${metadata.exams > 1 ? "s" : ""}`);
  }

  if (parts.length === 0) {
    return "No results found";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  }

  const last = parts.pop();
  return `${parts.join(", ")}, and ${last}`;
}

/**
 * Comprehensive search function
 * Searches across courses, students, schedules, and other entities
 * @param query - Search query string
 * @param userType - Type of user ('student' | 'professor')
 * @returns Promise with search results and metadata
 */
export async function comprehensiveSearch(
  query: string,
  userType: "student" | "professor" = "student",
): Promise<SearchResponse> {
  if (!query || !query.trim()) {
    return {
      results: [],
      metadata: {
        total: 0,
        categories: {},
        query: "",
        timestamp: Date.now(),
      },
    };
  }

  const normalizedQuery = query.trim().toLowerCase();
  const searchTerms = normalizedQuery.split(/\s+/);

  // Mock search results - in production, this would call an API
  const allResults: SearchResult[] = [];

  // Mock course search
  const courseResults: SearchResult[] = [
    {
      id: "course-1",
      title: "Introduction to Computer Science",
      description: "CS101 - Fundamentals of programming and computer science",
      type: "course" as SearchResultType,
      url: "/courses/cs101",
      score: 0.9,
    },
    {
      id: "course-2",
      title: "Data Structures",
      description: "CS201 - Advanced data structures and algorithms",
      type: "course" as SearchResultType,
      url: "/courses/cs201",
      score: 0.8,
    },
    {
      id: "course-3",
      title: "Database Systems",
      description: "CS301 - Database design and management",
      type: "course" as SearchResultType,
      url: "/courses/cs301",
      score: 0.7,
    },
  ].filter((course) => {
    const matchText = `${course.title} ${course.description}`.toLowerCase();
    return searchTerms.some((term) => matchText.includes(term));
  });

  allResults.push(...courseResults);

  // Mock student search (only for professors)
  if (userType === "professor") {
    const studentResults: SearchResult[] = [
      {
        id: "student-1",
        title: "Ahmed Hassan",
        description: "Student ID: 20221245",
        type: "student" as SearchResultType,
        url: "/students/20221245",
        score: 0.85,
      },
      {
        id: "student-2",
        title: "Mohamed Ali",
        description: "Student ID: 20221246",
        type: "student" as SearchResultType,
        url: "/students/20221246",
        score: 0.75,
      },
    ].filter((student) => {
      const matchText = `${student.title} ${student.description}`.toLowerCase();
      return searchTerms.some((term) => matchText.includes(term));
    });

    allResults.push(...studentResults);
  }

  // Mock schedule search
  const scheduleResults: SearchResult[] = [
    {
      id: "schedule-1",
      title: "Monday Schedule",
      description: "CS101 - 9:00 AM - 10:30 AM",
      type: "schedule" as SearchResultType,
      url: "/schedule",
      score: 0.7,
    },
  ].filter((schedule) => {
    const matchText = `${schedule.title} ${schedule.description}`.toLowerCase();
    return searchTerms.some((term) => matchText.includes(term));
  });

  allResults.push(...scheduleResults);

  // Calculate metadata
  const metadata: SearchMetadata = {
    total: allResults.length,
    categories: {
      courses: courseResults.length,
      students:
        userType === "professor"
          ? allResults.filter((r) => r.type === "student").length
          : 0,
      professors: 0,
      schedules: scheduleResults.length,
      notifications: 0,
      assignments: 0,
      exams: 0,
    },
    query: normalizedQuery,
    timestamp: Date.now(),
  };

  // Sort results by score (if available) or relevance
  const sortedResults = allResults.sort((a, b) => {
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    return scoreB - scoreA;
  });

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    results: sortedResults,
    metadata,
  };
}
