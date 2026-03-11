import { NextRequest, NextResponse } from "next/server";
import { SecurityService } from "@/services/security.service";
import { JWTUtils } from "@/utils/jwt";
import { AlertSeverity } from "@prisma/client";
import { handleApiError } from "@/utils/apiResponse";

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
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === "TOKEN_EXPIRED") {
        return NextResponse.json(
          { success: false, message: "Token expired", code: "TOKEN_EXPIRED" },
          { status: 401 },
        );
      }
      throw error;
    }

    if (payload.role.toLowerCase() !== "admin") {
      return NextResponse.json(
        { success: false, message: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const severity = searchParams.get("severity") as AlertSeverity | undefined;
    const isResolved =
      searchParams.get("isResolved") === "true"
        ? true
        : searchParams.get("isResolved") === "false"
          ? false
          : undefined;

    const [alertsResult, summary] = await Promise.all([
      SecurityService.searchFraudAlerts({
        page,
        limit,
        search,
        severity,
        isResolved,
      }),
      SecurityService.getSecuritySummary(),
    ]);

    return NextResponse.json({
      success: true,
      data: alertsResult.alerts,
      pagination: alertsResult.pagination,
      summary,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token)
      return NextResponse.json(
        { success: false, message: "Auth required" },
        { status: 401 },
      );

    const payload = JWTUtils.verifyAccessToken(token);
    if (payload.role.toLowerCase() !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json(
        { success: false, message: "Alert ID is required" },
        { status: 400 },
      );
    }

    await SecurityService.resolveAlert(
      parseInt(alertId),
      parseInt(payload.userId),
    );

    return NextResponse.json({
      success: true,
      message: "Alert resolved successfully",
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
