/**
 * Utility functions for determining professor department from courses
 */

export interface Course {
  courseCode?: string;
  courseName?: string;
  name?: string;
  major?: string;
}

/**
 * Determine department name from course information
 * Returns course names instead of department name
 * @param courses - Array of courses taught by the professor
 * @returns Course names separated by comma, or empty string if no courses
 */
/**
 * Major code to full name mapping
 */
export const MAJOR_NAMES: Record<string, string> = {
  IS: "Information Systems",
  CS: "Computer Science",
  ACC: "Accounting",
  ACC_EN: "Accounting English",
  BM: "Banking Management",
  BA: "Business Administration",
};

/**
 * Determine department name from course information
 * Prioritizes the 'major' field of courses.
 * @param courses - Array of courses taught by the professor
 * @returns Department/Major name(s) or Course names if major is not found
 */
export function determineDepartmentFromCourses(courses: Course[]): string {
  if (!courses || courses.length === 0) {
    return "";
  }

  // 1. Try to find unique majors
  const majors = new Set<string>();
  for (const course of courses) {
    if (course.major) {
      majors.add(course.major);
    }
  }

  if (majors.size > 0) {
    const majorNames = Array.from(majors).map(
      (code) => MAJOR_NAMES[code] || code,
    );
    return majorNames.join(", ");
  }

  // 2. Fallback to course names if no major found
  const courseNames: string[] = [];
  for (const course of courses) {
    const courseName = course.courseName || course.name;
    if (courseName && courseName.trim()) {
      courseNames.push(courseName.trim());
    }
  }

  return courseNames.join(", ");
}

/**
 * Fetch courses and determine department for a professor
 * @param professorId - Professor user ID
 * @param apiClient - API client instance
 * @returns Department name or empty string
 */
export async function getDepartmentFromCourses(
  professorId: number | string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiClient: any,
): Promise<string> {
  try {
    const profId =
      typeof professorId === "string" ? parseInt(professorId) : professorId;
    const response = await apiClient.get("/api/courses", {
      params: { professorId: profId },
    });

    if (
      response.success &&
      Array.isArray(response.data) &&
      response.data.length > 0
    ) {
      return determineDepartmentFromCourses(response.data);
    }
  } catch (error) {
    console.error("Error fetching courses for department:", error);
  }

  return "";
}
