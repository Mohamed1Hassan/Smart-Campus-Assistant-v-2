import api from "./api";
import {
  CourseMaterial,
  UploadMaterialRequest,
  AddLinkRequest,
} from "../types/material";

export const MaterialService = {
  /**
   * Get materials for a course
   */
  getCourseMaterials: async (courseId: number): Promise<CourseMaterial[]> => {
    const response = await api.get<CourseMaterial[]>(
      `/materials/course/${courseId}`,
    );
    return response.data ?? [];
  },

  /**
   * Upload a material file
   */
  uploadMaterial: async (
    data: UploadMaterialRequest,
  ): Promise<CourseMaterial> => {
    const formData = new FormData();
    formData.append("courseId", data.courseId.toString());
    formData.append("title", data.title);
    if (data.description) {
      formData.append("description", data.description);
    }
    formData.append("file", data.file);

    const response = await api.post<CourseMaterial>(
      "/materials/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    if (!response.data) {
      throw new Error(response.message || "Failed to upload material");
    }
    return response.data;
  },

  /**
   * Add a link material
   */
  addLink: async (data: AddLinkRequest): Promise<CourseMaterial> => {
    const response = await api.post<CourseMaterial>("/materials/link", data);
    if (!response.data) {
      throw new Error(response.message || "Failed to add link");
    }
    return response.data;
  },

  /**
   * Delete a material
   */
  deleteMaterial: async (id: number): Promise<void> => {
    await api.delete(`/materials/${id}`);
  },
};

export default MaterialService;
