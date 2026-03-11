import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";
import { getCourseImage } from "@/utils/courseImages";

export async function GET(req: NextRequest) {
  try {
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

    let payload;
    try {
      payload = JWTUtils.verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    if (payload.role.toLowerCase() !== "student") {
      return NextResponse.json(
        { success: false, message: "Access denied. Student role required." },
        { status: 403 },
      );
    }

    // Fetch user's major and level
    const user = await prisma.user.findUnique({
      where: { id: parseInt(payload.userId) },
      select: { major: true, level: true },
    });

    if (!user || !user.major || user.level === null) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "No courses found for your major/level.",
      });
    }

    // Fetch courses matching student's major and level for the active semester
    const courses = await prisma.course.findMany({
      where: {
        major: user.major,
        level: user.level,
        isActive: true,
        isArchived: false,
      },
      include: {
        professor: true,
        schedules: {
          where: { isActive: true },
          include: {
            professor: true,
          },
        },
      },
    });

    // Map to the format expected by the frontend
    const formattedCourses = courses.map((course) => {
      // Logic to distinguish between Doctors and TAs:
      // 1. Always include the "lead" professor (course.professor)
      // 2. Identify "Doctors" by common prefixes
      const doctorPrefixes = ["د.", "د/", "أ.د", "أ.م.د", "م.د"];
      const isDoctor = (name: string) =>
        doctorPrefixes.some((pref) => name.includes(pref));

      const professorSet = new Set<string>();
      const leadProfName = course.professor
        ? `${course.professor.firstName} ${course.professor.lastName}`
        : null;

      if (leadProfName) {
        professorSet.add(leadProfName);
      }

      // Collect all professors from schedules
      const scheduleProfs: string[] = [];
      course.schedules.forEach((s) => {
        if (s.professor) {
          const name = `${s.professor.firstName} ${s.professor.lastName}`;
          if (!scheduleProfs.includes(name)) {
            scheduleProfs.push(name);
          }
        }
      });

      // If we have Doctors in the schedules that aren't the lead, add them (co-teachers)
      scheduleProfs.forEach((p) => {
        if (isDoctor(p) && !professorSet.has(p)) {
          professorSet.add(p);
        }
      });

      // If we have NO lead professor and NO doctors in schedules, then and only then show TAs/others
      if (professorSet.size === 0 && scheduleProfs.length > 0) {
        scheduleProfs.forEach((p) => professorSet.add(p));
      }

      const allProfessors = Array.from(professorSet);

      return {
        id: course.id,
        name: course.courseName,
        code: course.courseCode,
        semester: course.semester,
        academicYear: course.academicYear,
        professor: allProfessors.join(", "),
        professors: allProfessors,
        credits: course.credits,
        description: course.description,
        coverImage:
          course.coverImage || getCourseImage(course.courseName, course.id),
        schedules: course.schedules.map((s) => ({
          id: s.id,
          day: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
          time: `${s.startTime} - ${s.endTime}`,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedCourses,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/courses/student/enrolled");
  }
}
