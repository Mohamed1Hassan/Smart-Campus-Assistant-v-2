export interface CourseMaterial {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  type: "FILE" | "LINK";
  url: string;
  fileSize?: number;
  createdAt: string;
}

export interface UploadMaterialRequest {
  courseId: number;
  title: string;
  description?: string;
  file: File;
}

export interface AddLinkRequest {
  courseId: number;
  title: string;
  description?: string;
  url: string;
}
