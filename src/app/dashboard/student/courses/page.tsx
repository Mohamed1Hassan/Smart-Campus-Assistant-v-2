import StudentCourses from "../../../../views/StudentCourses";
import { getStudentCoursesAction } from "../../../../actions/course.actions";

export default async function StudentCoursesPage() {
  const result = await getStudentCoursesAction();
  const initialCourses = result.success ? result.data : [];

  return <StudentCourses initialCourses={initialCourses} />;
}
