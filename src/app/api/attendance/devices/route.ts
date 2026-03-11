import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { JWTUtils } from "@/utils/jwt";
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
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const studentId = parseInt(payload.userId);

    const devices = await prisma.deviceFingerprint.findMany({
      where: { studentId },
      orderBy: { lastUsed: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: { devices },
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/attendance/devices");
  }
}

export async function POST(req: NextRequest) {
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

    const studentId = parseInt(payload.userId);
    const body = await req.json();
    const { deviceFingerprint, deviceInfo } = body;

    if (!deviceFingerprint) {
      return NextResponse.json(
        { success: false, message: "Device fingerprint is required" },
        { status: 400 },
      );
    }

    // atomic upsert to avoid race conditions and unique constraint errors
    const device = await prisma.deviceFingerprint.upsert({
      where: { fingerprint: deviceFingerprint },
      update: {
        lastUsed: new Date(),
        deviceInfo: deviceInfo || {},
        studentId: studentId, // Ensure it's linked to the current user
      },
      create: {
        studentId,
        fingerprint: deviceFingerprint,
        deviceInfo: deviceInfo || {},
        lastUsed: new Date(),
        isActive: true,
      },
    });

    const isNewDevice =
      device.createdAt.getTime() === device.lastUsed.getTime();

    return NextResponse.json({
      success: true,
      message: isNewDevice
        ? "Device registered successfully"
        : "Device updated successfully",
      data: { ...device, isNewDevice },
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/attendance/devices");
  }
}
