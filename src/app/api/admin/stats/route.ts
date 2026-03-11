import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate Admin
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    const payload = JWTUtils.verifyAccessToken(token);

    if (payload.role.toLowerCase() !== "admin") {
      return NextResponse.json(
        { success: false, message: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // 2. Fetch Real Stats
    const [
      totalStudents,
      totalProfessors,
      activeCourses,
      totalCourses,
      recentAlertsCount,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "PROFESSOR" } }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.course.count(),
      prisma.fraudAlert
        ? prisma.fraudAlert.count({ where: { isResolved: false } })
        : Promise.resolve(0),
    ]);

    // 3. Calculate Average Attendance
    const attendanceStats = await prisma.attendanceRecord.groupBy({
      by: ["status"],
      _count: true,
    });

    const totalRecords = attendanceStats.reduce(
      (acc, curr) => acc + curr._count,
      0,
    );
    const presentRecords =
      attendanceStats.find((s) => s.status === "PRESENT")?._count || 0;

    const avgAttendance =
      totalRecords > 0
        ? Math.round((presentRecords / totalRecords) * 1000) / 10
        : 0;

    // 4. Calculate Trends
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const newStudentsThisMonth = await prisma.user.count({
      where: {
        role: "STUDENT",
        createdAt: { gte: oneMonthAgo },
      },
    });

    const studentTrend =
      totalStudents > 0
        ? Math.round((newStudentsThisMonth / totalStudents) * 100)
        : 0;

    const newProfessorsThisMonth = await prisma.user.count({
      where: {
        role: "PROFESSOR",
        createdAt: { gte: oneMonthAgo },
      },
    });

    // 5. Fetch Recent Activity Feed
    const [recentUsers, recentCourses, recentAlerts] = await Promise.all([
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.course.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          courseName: true,
          courseCode: true,
          createdAt: true,
        },
      }),
      prisma.fraudAlert.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, alertType: true, severity: true, createdAt: true },
      }),
    ]);

    const activityFeed = [
      ...recentUsers.map((u) => ({
        id: `u-${u.id}`,
        type: "USER",
        title: "New User Joined",
        description: `${u.firstName} ${u.lastName} (${u.role})`,
        time: u.createdAt,
      })),
      ...recentCourses.map((c) => ({
        id: `c-${c.id}`,
        type: "COURSE",
        title: "New Course Created",
        description: `${c.courseCode}: ${c.courseName}`,
        time: c.createdAt,
      })),
      ...recentAlerts.map((a) => ({
        id: `a-${a.id}`,
        type: "ALERT",
        title: "Security Alert",
        description: `${a.alertType} - ${a.severity}`,
        time: a.createdAt,
      })),
    ]
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        totalProfessors,
        activeCourses,
        totalCourses,
        recentAlertsCount,
        avgAttendance,
        studentTrend: `+${studentTrend}%`,
        attendanceTrend: "Steady",
        recentProfessorsCount: newProfessorsThisMonth,
        activityFeed,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
