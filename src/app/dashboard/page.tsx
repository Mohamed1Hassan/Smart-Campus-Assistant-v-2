import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { JWTUtils } from "@/utils/jwt";
import prisma from "@/lib/db";

export default async function DashboardRedirect() {
  // Get cookies on the server
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    console.log(
      "[DashboardRedirect] No access token found in cookies, redirecting to login",
    );
    redirect("/");
  }

  let role: string | null = null;
  let userId: string | null = null;
  try {
    // Verify token to get the role
    const payload = JWTUtils.verifyAccessToken(accessToken);
    role = payload.role.toLowerCase();
    userId = payload.userId;
    console.log(
      `[DashboardRedirect] User role: ${role}, ID: ${userId}, redirecting...`,
    );
  } catch (error) {
    console.error("[DashboardRedirect] Error verifying token:", error);
    // We can't delete cookies here in a Server Component page.
    // Redirecting to / is safe because Home now validates the token before redirecting back.
    redirect("/");
  }

  if (!role) {
    redirect("/");
  }
  if (role === "admin") {
    // Admin no longer redirects directly to /dashboard/admin
    // We check if this admin is also a professor to land them in the correct dashboard
    // We use a broader check for professor-like data if they don't have settings yet
    const user = userId
      ? await prisma.user.findUnique({
          where: { id: parseInt(userId, 10) },
          include: { 
            professorSettings: true,
            _count: {
              select: { coursesCreated: true, enrollments: true }
            }
          },
        })
      : null;

    // If they have professor settings, or have created courses, 
    // or simply have no student enrollments (not a student), 
    // they should go to the professor dashboard by default
    const isProbablyProfessor = 
      user?.professorSettings || 
      (user?._count && user._count.coursesCreated > 0) ||
      (user?._count && user._count.enrollments === 0);

    if (isProbablyProfessor) {
      redirect("/dashboard/professor");
    } else {
      redirect("/dashboard/student");
    }
  } else if (role === "professor") {
    redirect("/dashboard/professor");
  } else {
    redirect("/dashboard/student");
  }
}
