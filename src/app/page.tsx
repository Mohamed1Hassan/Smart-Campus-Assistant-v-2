import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Login from "../views/Login";
import { JWTUtils } from "@/utils/jwt";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  // If the user has a valid session cookie, redirect to dashboard
  if (token) {
    try {
      // Validate the token before redirecting to prevent loops if it's expired
      JWTUtils.verifyAccessToken(token);
      redirect("/dashboard");
    } catch {
      // Token is expired or invalid, don't redirect
      console.log("[Home] Token validation failed, showing login page");
    }
  }

  // Otherwise, show the original Login page design
  return <Login />;
}
