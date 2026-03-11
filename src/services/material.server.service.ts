import prisma from "../lib/db";
import { CourseMaterial, Course } from "@prisma/client";

export interface UploadMaterialData {
  courseId: number;
  title: string;
  description?: string;
  type: "FILE" | "LINK";
  url: string;
  fileSize?: number;
}

export class MaterialServerService {
  /**
   * Get materials for a course
   */
  static async getCourseMaterials(courseId: number): Promise<CourseMaterial[]> {
    return await prisma.courseMaterial.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create/Register a new material
   */
  static async createMaterial(
    data: UploadMaterialData,
  ): Promise<CourseMaterial> {
    return await prisma.courseMaterial.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        url: data.url,
        fileSize: data.fileSize,
        courseId: data.courseId,
      },
    });
  }

  /**
   * Delete a material
   */
  static async deleteMaterial(id: number): Promise<CourseMaterial> {
    return await prisma.courseMaterial.delete({
      where: { id },
    });
  }

  /**
   * Get material by ID with course relation
   */
  static async getMaterialById(
    id: number,
  ): Promise<(CourseMaterial & { course: Course }) | null> {
    return (await prisma.courseMaterial.findUnique({
      where: { id },
      include: { course: true },
    })) as (CourseMaterial & { course: Course }) | null;
  }
}

export default MaterialServerService;
