"use client";
import React, { useEffect, useState } from "react";
import { CourseMaterial } from "../../types/material";
import { MaterialService } from "../../services/materialService";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  FileText,
  Link as LinkIcon,
  Download,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useToast } from "./ToastProvider";

interface MaterialsListProps {
  courseId: number;
  userRole: "STUDENT" | "PROFESSOR" | "ADMIN";
}

export const MaterialsList: React.FC<MaterialsListProps> = ({
  courseId,
  userRole,
}) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const { success: showSuccess, error: showError } = useToast();

  const fetchMaterials = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await MaterialService.getCourseMaterials(courseId);
      setMaterials(data || []);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
      setMaterials([]);
      showError("Failed to load course materials");
    } finally {
      setLoading(false);
    }
  }, [courseId, showError]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this material?"))
      return;

    try {
      await MaterialService.deleteMaterial(id);
      showSuccess("Material deleted successfully");
      fetchMaterials();
    } catch (error) {
      console.error("Failed to delete material:", error);
      showError("Failed to delete material");
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, "_blank");
  };

  if (loading) {
    return <div className="p-4 text-center">Loading materials...</div>;
  }

  if (!materials || materials.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
        <p>No materials available for this course yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {materials.map((material) => (
        <Card key={material.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`p-2 rounded-lg ${material.type === "FILE" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
              >
                {material.type === "FILE" ? (
                  <FileText size={24} />
                ) : (
                  <LinkIcon size={24} />
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{material.title}</h4>
                {material.description && (
                  <p className="text-sm text-gray-500">
                    {material.description}
                  </p>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(material.createdAt).toLocaleDateString()}
                  {material.fileSize &&
                    ` • ${(material.fileSize / 1024 / 1024).toFixed(2)} MB`}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {material.type === "FILE" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(material.url)}
                >
                  <Download size={16} className="mr-2" />
                  Download
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(material.url, "_blank")}
                >
                  <ExternalLink size={16} className="mr-2" />
                  Open Link
                </Button>
              )}

              {(userRole === "PROFESSOR" || userRole === "ADMIN") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(material.id)}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
