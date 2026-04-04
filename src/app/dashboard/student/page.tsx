import StudentDashboard from "../../../views/StudentDashboard";
import { getStudentStatsAction, getUserProfileAction } from "../../../actions/user.actions";
import { getStudentScheduleAction } from "../../../actions/schedule.actions";
import { getStudentSessionsAction } from "../../../actions/attendance.actions";
import { getStudentNotificationsAction } from "../../../actions/notification.actions";

export default async function StudentDashboardPage() {
  // Parallel fetch for best performance
  const [statsRes, scheduleRes, sessionsRes, profileRes, notificationsRes] = await Promise.all([
    getStudentStatsAction(),
    getStudentScheduleAction(),
    getStudentSessionsAction(),
    getUserProfileAction(),
    getStudentNotificationsAction(5), // Latest 5 for announcements
  ]);

  const initialStats = statsRes.success ? statsRes.data : null;
  const initialScheduleRaw = scheduleRes.success ? scheduleRes.data : [];
  const initialSessionsRaw = sessionsRes.success ? sessionsRes.data : [];
  const initialUser = profileRes.success ? profileRes.data : null;
  const initialNotifications = notificationsRes.success ? notificationsRes.data : [];

  // Filter for today's schedule on the server to match the client's initial view
  // Convert standard Sun=0..Sat=6 to Sat=0..Fri=6 mapping used in the DB
  const adjustDay = (d: number) => (d + 1) % 7;
  const currentDayOfWeek = adjustDay(new Date().getDay());
  const todayScheduleRaw = (initialScheduleRaw as any[]).filter(
    (s) => s.dayOfWeek === currentDayOfWeek
  );

  return (
    <StudentDashboard 
      initialStats={initialStats} 
      initialScheduleRaw={todayScheduleRaw}
      initialSessionsRaw={initialSessionsRaw}
      initialUser={initialUser}
      initialNotifications={initialNotifications}
    />
  );
}
