"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, CheckCircle, AlertCircle } from "lucide-react";

interface Course {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  maxStudents: number;
  scheduleTime?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onUploadComplete: (course: Course, files: File[]) => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
}

export default function UploadModal({
  isOpen,
  onClose,
  course,
  onUploadComplete,
}: UploadModalProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newUploadFiles: UploadFile[] = files.map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }));

    setUploadFiles((prev) => [...prev, ...newUploadFiles]);

    // Start mock upload process
    simulateUpload(newUploadFiles);
  };

  const simulateUpload = (files: UploadFile[]) => {
    setIsUploading(true);

    files.forEach((uploadFile) => {
      const interval = setInterval(() => {
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.file === uploadFile.file
              ? {
                  ...f,
                  progress: Math.min(f.progress + Math.random() * 20, 100),
                }
              : f,
          ),
        );
      }, 200);

      // Complete upload after random time
      setTimeout(
        () => {
          clearInterval(interval);
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.file === uploadFile.file
                ? { ...f, progress: 100, status: "completed" as const }
                : f,
            ),
          );
        },
        2000 + Math.random() * 3000,
      );
    });

    // Check if all uploads are complete
    setTimeout(() => {
      setIsUploading(false);
      if (course) {
        onUploadComplete(
          course,
          files.map((f) => f.file),
        );
      }
    }, 5000);
  };

  const removeFile = (fileToRemove: File) => {
    setUploadFiles((prev) => prev.filter((f) => f.file !== fileToRemove));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "ppt":
      case "pptx":
        return "📊";
      case "xls":
      case "xlsx":
        return "📈";
      default:
        return "📁";
    }
  };

  const handleClose = () => {
    setUploadFiles([]);
    setIsUploading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && course && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white dark:bg-cardDark rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-textDark">
                    Upload Materials
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-mutedDark">
                    {course.name} ({course.code})
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* File Upload Area */}
              <div className="mb-6">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-textDark mb-2">
                    Drop files here or click to browse
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-mutedDark mb-4">
                    Supports PDF, DOC, PPT, XLS files up to 10MB each
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Choose Files
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Upload Progress */}
              {uploadFiles.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-textDark">
                    Upload Progress
                  </h4>
                  {uploadFiles.map((uploadFile, index) => (
                    <motion.div
                      key={`${uploadFile.file.name}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {getFileIcon(uploadFile.file.name)}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-textDark">
                              {uploadFile.file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-mutedDark">
                              {formatFileSize(uploadFile.file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {uploadFile.status === "completed" && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {uploadFile.status === "error" && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          <button
                            onClick={() => removeFile(uploadFile.file)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          className={`h-2 rounded-full ${
                            uploadFile.status === "completed"
                              ? "bg-green-500"
                              : uploadFile.status === "error"
                                ? "bg-red-500"
                                : "bg-blue-500"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadFile.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-mutedDark mt-1">
                        {uploadFile.progress.toFixed(0)}% uploaded
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  {isUploading ? "Uploading..." : "Close"}
                </button>
                {!isUploading && uploadFiles.length > 0 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Add More Files
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
