import { NextResponse } from "next/server";
import { MetricsService } from "@/services/metrics.server.service";
import { JWTUtils } from "@/utils/jwt";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const payload = JWTUtils.verifyAccessToken(token);
    if (payload.role.toLowerCase() !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    const metrics = await MetricsService.getSystemMetrics();
    return NextResponse.json(metrics);
  } catch (error: unknown) {
    console.error("System Metrics API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
