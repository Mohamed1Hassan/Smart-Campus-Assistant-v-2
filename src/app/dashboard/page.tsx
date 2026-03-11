import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { JWTUtils } from "@/utils/jwt";

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
  try {
    // Verify token to get the role
    const payload = JWTUtils.verifyAccessToken(accessToken);
    role = payload.role.toLowerCase();
    console.log(
      `[DashboardRedirect] User role: ${role}, redirecting to appropriate dashboard`,
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

  if (role === "professor" || role === "admin") {
    redirect("/dashboard/professor");
  } else {
    redirect("/dashboard/student");
  }
}
