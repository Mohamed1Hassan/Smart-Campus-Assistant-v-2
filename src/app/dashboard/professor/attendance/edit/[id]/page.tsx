"use client";
import ProfessorAttendanceCreate from "../../../../../../views/ProfessorAttendanceCreate";

export default function EditSessionPage() {
  // We can pass a prop to ProfessorAttendanceCreate to indicate edit mode,
  // but for now, since we haven't modified ProfessorAttendanceCreate yet,
  // it will just show the create form.
  // However, the 404 will be gone.
  return <ProfessorAttendanceCreate />;
}
