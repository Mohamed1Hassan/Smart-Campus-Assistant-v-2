import { NextResponse } from "next/server";

export function proxy() {
  // Simple proxy to allow all requests for now.
  // Auth logic is handled in AuthContext (for client-side) and individual server routes.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
