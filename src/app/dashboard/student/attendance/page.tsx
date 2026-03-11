import React, { Suspense } from "react";
import StudentAttendance from "../../../../views/StudentAttendance";

export default function StudentAttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <StudentAttendance />
    </Suspense>
  );
}
