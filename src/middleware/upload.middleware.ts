import multer from "multer";
import path from "path";
import fs from "fs";
import type { Request, Response, NextFunction } from "express";

/**
 * Upload middleware for handling file uploads
 * Supports avatar uploads with image processing and storage
 */

// Ensure uploads directory exists (Only in development/local environments)
const uploadsDir = path.join(process.cwd(), "uploads", "avatars");

// In Vercel and other serverless environments, the filesystem is read-only.
// We should only attempt to create this directory if we are not in a serverless environment
// or if we catch and ignore the expected ENOENT/EROFS errors.
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (error) {
  console.warn("Could not create uploads directory (expected in Vercel):", error);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `avatar-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  },
});

// File filter function
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Check file type
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
      ),
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter as multer.Options["fileFilter"],
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file at a time
  },
});

// Avatar upload middleware
export const uploadAvatar = upload.single("avatar");

// Error handling middleware for multer
export const handleUploadError = (
  error: Error | multer.MulterError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          success: false,
          message: "File size too large. Maximum size is 5MB",
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          success: false,
          message: "Too many files. Only one file is allowed",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          success: false,
          message: "Unexpected file field",
        });
      default:
        return res.status(400).json({
          success: false,
          message: "File upload error: " + error.message,
        });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "File upload failed",
    });
  }
  next();
};

// Image processing utility
export const processImage = async (filePath: string): Promise<string> => {
  try {
    // For now, we'll just return the file path
    // In a production environment, you might want to:
    // - Resize the image
    // - Convert to different formats
    // - Compress the image
    // - Generate thumbnails

    return filePath;
  } catch (error) {
    throw new Error(`Image processing failed: ${error}`);
  }
};

// Delete file utility
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (error) => {
      if (error) {
        reject(new Error(`Failed to delete file: ${error.message}`));
      } else {
        resolve();
      }
    });
  });
};

// Get file URL utility
export const getFileUrl = (filename: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  return `${baseUrl}/uploads/avatars/${filename}`;
};

// Validate file exists
export const fileExists = (filePath: string): boolean => {
  return fs.existsSync(filePath);
};

// Get file info
export const getFileInfo = (filePath: string) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
    };
  } catch {
    return null;
  }
};

// Clean up old files (utility for maintenance)
export const cleanupOldFiles = async (
  maxAgeInDays: number = 30,
): Promise<void> => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const now = Date.now();
    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old file: ${file}`);
      }
    }
  } catch (error) {
    console.error("Error cleaning up old files:", error);
  }
};

// Export upload middleware
export const uploadMiddleware = {
  uploadAvatar,
  handleUploadError,
  processImage,
  deleteFile,
  getFileUrl,
  fileExists,
  getFileInfo,
  cleanupOldFiles,
};

export default uploadMiddleware;
