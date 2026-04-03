import { cookies } from "next/headers";
import StudentCourses from "../../../../views/StudentCourses";
import { getStudentCoursesAction } from "../../../../actions/course.actions";
import { getCourseImage } from "../../../../utils/courseImages";

export default async function StudentCoursesPage() {
  const result = await getStudentCoursesAction();
  
  // Need to map the raw Prisma enrollments from the action to the flat Course format expected by the UI.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialCourses = result.success ? result.data.map((enrollment: any) => {
    const c = enrollment.course;
    
    // Construct professor string similarly to API
    const leadProfName = c.professor ? `${c.professor.firstName} ${c.professor.lastName}` : "Unknown Professor";
    
    // Extract first schedule time
    const s = c.schedules?.[0];
    const timeString = s ? `${s.startTime} - ${s.endTime}` : "";
    
    return {
      id: String(c.id),
      name: c.courseName || "",
      code: c.courseCode || "",
      professor: leadProfName,
      credits: c.credits || 0,
      semester: c.semester || "",
      academicYear: c.academicYear || "",
      scheduleTime: timeString,
      description: c.description || "",
      coverImage: c.coverImage || getCourseImage(c.courseName || "", String(c.id)),
    };
  }) : [];

  return <StudentCourses initialCourses={initialCourses} />;
}
