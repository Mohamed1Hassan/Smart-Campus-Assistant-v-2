"use client";
import React, { useState } from "react";
import ResponsiveModal from "../common/ResponsiveModal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { MaterialService } from "../../services/materialService";
import { toast } from "react-hot-toast";
import { Upload, Link as LinkIcon, FileText, Loader2 } from "lucide-react";

interface MaterialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  onSuccess: () => void;
}

export default function MaterialUploadModal({
  isOpen,
  onClose,
  courseId,
  onSuccess,
}: MaterialUploadModalProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [loading, setLoading] = useState(false);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");

  // Link state
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      // Auto-fill title if empty
      if (!uploadTitle) {
        setUploadTitle(selectedFile.name.replace(".pdf", ""));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !uploadTitle) return;

    try {
      setLoading(true);
      await MaterialService.uploadMaterial({
        courseId,
        title: uploadTitle,
        description: uploadDescription,
        file,
      });
      toast.success("Material uploaded successfully");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload material");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl || !linkTitle) return;

    try {
      setLoading(true);
      await MaterialService.addLink({
        courseId,
        title: linkTitle,
        description: linkDescription,
        url: linkUrl,
      });
      toast.success("Link added successfully");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Add link failed:", error);
      toast.error("Failed to add link");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setUploadTitle("");
    setUploadDescription("");
    setLinkUrl("");
    setLinkTitle("");
    setLinkDescription("");
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Course Material"
      size="md"
    >
      <Tabs
        defaultValue="upload"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload PDF
          </TabsTrigger>
          <TabsTrigger value="link" className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Add Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">PDF File</Label>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  id="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                {file ? (
                  <div className="flex flex-col items-center text-blue-600">
                    <FileText className="w-8 h-8 mb-2" />
                    <span className="font-medium text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="font-medium text-sm">
                      Click to upload PDF
                    </span>
                    <span className="text-xs mt-1">Max 10MB</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uploadTitle">Title</Label>
              <Input
                id="uploadTitle"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g., Lecture 1 Slides"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uploadDescription">Description (Optional)</Label>
              <Input
                id="uploadDescription"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Brief description of the file"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !file}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="link">
          <form onSubmit={handleAddLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkTitle">Title</Label>
              <Input
                id="linkTitle"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="e.g., Course Syllabus"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkDescription">Description (Optional)</Label>
              <Input
                id="linkDescription"
                value={linkDescription}
                onChange={(e) => setLinkDescription(e.target.value)}
                placeholder="Brief description of the link"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Link"
                )}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </ResponsiveModal>
  );
}
