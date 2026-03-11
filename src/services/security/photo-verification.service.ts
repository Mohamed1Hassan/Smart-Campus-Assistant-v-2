import { PhotoVerificationConfig, PhotoVerificationResult } from "./types";

/**
 * Photo Verification Service
 * Handles photo capture, validation, and metadata verification
 */
export class PhotoVerificationService {
  private config: PhotoVerificationConfig;

  constructor(config: PhotoVerificationConfig) {
    this.config = config;
  }

  /**
   * Capture photo from camera
   */
  public async capturePhoto(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
  ): Promise<string> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      videoElement.srcObject = stream;

      return new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();

          // Wait a moment for the video to stabilize
          setTimeout(() => {
            const context = canvasElement.getContext("2d");
            if (!context) {
              reject(new Error("Canvas context not available"));
              return;
            }

            // Set canvas dimensions to match video
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;

            // Draw video frame to canvas
            context.drawImage(videoElement, 0, 0);

            // Convert to data URL
            const photoData = canvasElement.toDataURL("image/jpeg", 0.8);

            // Stop the stream
            stream.getTracks().forEach((track) => track.stop());

            resolve(photoData);
          }, 1000);
        };

        videoElement.onerror = (error) => {
          reject(new Error(`Video loading failed: ${error}`));
        };
      });
    } catch (error) {
      throw new Error(`Camera access failed: ${error}`);
    }
  }

  /**
   * Validate photo data
   */
  public async validatePhoto(
    photoData: string,
  ): Promise<PhotoVerificationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check if photo data is valid
    if (!photoData || !photoData.startsWith("data:image/")) {
      errors.push("Invalid photo data format");
      return {
        isValid: false,
        quality: 0,
        hasFace: false,
        dimensions: { width: 0, height: 0 },
        fileSize: 0,
        format: "unknown",
        metadata: {},
        warnings,
        errors,
      };
    }

    // Extract photo information
    const photoInfo = await this.extractPhotoInfo(photoData);

    // Validate file size
    if (photoInfo.fileSize > this.config.maxFileSize) {
      errors.push(
        `Photo too large: ${photoInfo.fileSize} bytes (max: ${this.config.maxFileSize} bytes)`,
      );
    }

    // Validate dimensions
    if (
      photoInfo.dimensions.width < this.config.minDimensions.width ||
      photoInfo.dimensions.height < this.config.minDimensions.height
    ) {
      errors.push(
        `Photo too small: ${photoInfo.dimensions.width}x${photoInfo.dimensions.height} (min: ${this.config.minDimensions.width}x${this.config.minDimensions.height})`,
      );
    }

    if (
      photoInfo.dimensions.width > this.config.maxDimensions.width ||
      photoInfo.dimensions.height > this.config.maxDimensions.height
    ) {
      warnings.push(
        `Photo very large: ${photoInfo.dimensions.width}x${photoInfo.dimensions.height} (max: ${this.config.maxDimensions.width}x${this.config.maxDimensions.height})`,
      );
    }

    // Validate format
    if (!this.config.allowedFormats.includes(photoInfo.format)) {
      errors.push(
        `Unsupported format: ${photoInfo.format} (allowed: ${this.config.allowedFormats.join(", ")})`,
      );
    }

    // Assess photo quality
    const quality = this.assessPhotoQuality(photoData, photoInfo);
    if (quality < this.config.minQuality) {
      errors.push(
        `Photo quality too low: ${(quality * 100).toFixed(1)}% (min: ${(this.config.minQuality * 100).toFixed(1)}%)`,
      );
    } else if (quality < this.config.minQuality + 0.1) {
      warnings.push(`Photo quality borderline: ${(quality * 100).toFixed(1)}%`);
    }

    // Check for face detection if required
    let hasFace = false;
    if (this.config.requireFaceDetection) {
      hasFace = this.detectFace(photoData);
      if (!hasFace) {
        errors.push("No face detected in photo");
      }
    } else {
      hasFace = this.detectFace(photoData);
      if (!hasFace) {
        warnings.push("No face detected in photo (not required)");
      }
    }

    // Check for photo manipulation
    const manipulationScore = this.detectManipulation(photoData);
    if (manipulationScore > 0.7) {
      errors.push(
        `Photo manipulation detected: ${(manipulationScore * 100).toFixed(1)}% confidence`,
      );
    } else if (manipulationScore > 0.4) {
      warnings.push(
        `Possible photo manipulation: ${(manipulationScore * 100).toFixed(1)}% confidence`,
      );
    }

    // Extract metadata
    const metadata = this.extractMetadata(photoData);

    return {
      isValid: errors.length === 0,
      quality,
      hasFace,
      dimensions: photoInfo.dimensions,
      fileSize: photoInfo.fileSize,
      format: photoInfo.format,
      metadata,
      warnings,
      errors,
    };
  }

  /**
   * Extract photo information
   */
  private extractPhotoInfo(photoData: string): Promise<{
    fileSize: number;
    dimensions: { width: number; height: number };
    format: string;
  }> {
    // Calculate file size (approximate)
    const fileSize = Math.round((photoData.length * 3) / 4);

    // Extract format
    const format = photoData.split(";")[0].split("/")[1];

    // Get dimensions by creating an image
    return new Promise<{
      fileSize: number;
      dimensions: { width: number; height: number };
      format: string;
    }>((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          fileSize,
          dimensions: { width: img.width, height: img.height },
          format,
        });
      };
      img.onerror = () => {
        resolve({
          fileSize,
          dimensions: { width: 0, height: 0 },
          format,
        });
      };
      img.src = photoData;
    });
  }

  /**
   * Assess photo quality
   */
  private assessPhotoQuality(
    photoData: string,
    photoInfo: {
      dimensions: { width: number; height: number };
      fileSize: number;
      format: string;
    },
  ): number {
    let quality = 1.0;

    // Check image dimensions (larger is generally better)
    const aspectRatio =
      photoInfo.dimensions.width / photoInfo.dimensions.height;
    if (aspectRatio < 0.5 || aspectRatio > 2.0) {
      quality -= 0.2; // Poor aspect ratio
    }

    // Check file size (larger files are generally higher quality)
    const expectedSize =
      photoInfo.dimensions.width * photoInfo.dimensions.height * 0.1; // Rough estimate
    if (photoInfo.fileSize < expectedSize * 0.5) {
      quality -= 0.3; // File seems compressed
    }

    // Check for common quality issues
    if (photoInfo.dimensions.width < 640 || photoInfo.dimensions.height < 480) {
      quality -= 0.4; // Low resolution
    }

    // Check for blur (simplified - in real implementation you'd use image analysis)
    const blurScore = this.detectBlur();
    quality -= blurScore * 0.5;

    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Detect face in photo
   */
  private detectFace(photoData: string): boolean {
    // This is a simplified implementation
    // In a real system, you would use a proper face detection library like face-api.js
    try {
      // Basic face detection simulation
      // In reality, you would analyze the image for face patterns
      const img = new Image();
      img.src = photoData;

      // For now, assume face is present if image is valid
      // In production, you would use actual face detection algorithms
      return img.width > 0 && img.height > 0;
    } catch (error) {
      console.warn("Face detection failed:", error);
      return false;
    }
  }

  /**
   * Detect photo manipulation
   */
  private detectManipulation(photoData: string): number {
    // This is a simplified implementation
    // In a real system, you would use proper image forensics techniques
    let manipulationScore = 0;

    try {
      // Check for common manipulation indicators
      if (photoData.includes("edited") || photoData.includes("modified")) {
        manipulationScore += 0.3;
      }

      // Check for screenshot indicators
      if (photoData.includes("screenshot") || photoData.includes("screen")) {
        manipulationScore += 0.5;
      }

      // Check for repeated patterns (simplified)
      const base64Data = photoData.split(",")[1];
      if (base64Data) {
        // Look for repeated patterns that might indicate copy-paste
        const patternCount = this.countRepeatedPatterns(base64Data);
        if (patternCount > 10) {
          manipulationScore += 0.2;
        }
      }

      // Check for metadata inconsistencies
      const metadata = this.extractMetadata(photoData);
      if (metadata.isEdited) {
        manipulationScore += 0.4;
      }
    } catch (error) {
      console.warn("Manipulation detection failed:", error);
    }

    return Math.min(1, manipulationScore);
  }

  /**
   * Detect blur in photo
   */
  private detectBlur(): number {
    // This is a simplified implementation
    // In a real system, you would use proper blur detection algorithms
    try {
      // Basic blur detection simulation
      // In reality, you would analyze the image for blur patterns
      return Math.random() * 0.3; // Simulate blur detection
    } catch (error) {
      console.warn("Blur detection failed:", error);
      return 0;
    }
  }

  /**
   * Count repeated patterns in base64 data
   */
  private countRepeatedPatterns(base64Data: string): number {
    const patterns = new Map<string, number>();
    const patternLength = 10;

    for (let i = 0; i < base64Data.length - patternLength; i++) {
      const pattern = base64Data.substring(i, i + patternLength);
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }

    let repeatedCount = 0;
    for (const count of patterns.values()) {
      if (count > 1) {
        repeatedCount += count - 1;
      }
    }

    return repeatedCount;
  }

  /**
   * Extract metadata from photo
   */
  private extractMetadata(photoData: string): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    try {
      // Extract basic metadata
      metadata.format = photoData.split(";")[0].split("/")[1];
      metadata.timestamp = Date.now();
      metadata.source = "camera";

      // Check for common metadata indicators
      if (photoData.includes("data:image/jpeg")) {
        metadata.isJPEG = true;
      }
      if (photoData.includes("data:image/png")) {
        metadata.isPNG = true;
      }

      // Simulate metadata extraction
      metadata.isEdited =
        photoData.includes("edited") || photoData.includes("modified");
      metadata.isScreenshot =
        photoData.includes("screenshot") || photoData.includes("screen");
      metadata.quality = this.assessPhotoQuality(photoData, {
        dimensions: { width: 0, height: 0 },
        fileSize: 0,
        format: "unknown",
      });
    } catch (error) {
      console.warn("Metadata extraction failed:", error);
    }

    return metadata;
  }

  /**
   * Compress photo if needed
   */
  public async compressPhoto(
    photoData: string,
    maxSize: number = 1024 * 1024, // 1MB
    quality: number = 0.8,
  ): Promise<string> {
    try {
      const img = new Image();
      return new Promise<string>((resolve) => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            resolve(photoData);
            return;
          }

          // Calculate new dimensions to fit within max size
          let { width, height } = img;

          if (width * height > maxSize) {
            const scale = Math.sqrt(maxSize / (width * height));
            width = Math.floor(width * scale);
            height = Math.floor(height * scale);
          }

          canvas.width = width;
          canvas.height = height;

          ctx.drawImage(img, 0, 0, width, height);

          const compressedData = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedData);
        };

        img.onerror = () => resolve(photoData);
        img.src = photoData;
      });
    } catch (error) {
      console.warn("Photo compression failed:", error);
      return photoData;
    }
  }

  /**
   * Generate photo hash for duplicate detection
   */
  public generatePhotoHash(photoData: string): string {
    try {
      // Simple hash generation for duplicate detection
      let hash = 0;
      const data = photoData.substring(0, 1000); // Use first 1000 characters

      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      return Math.abs(hash).toString(36);
    } catch (error) {
      console.warn("Photo hash generation failed:", error);
      return "";
    }
  }

  /**
   * Check for duplicate photos
   */
  public isDuplicatePhoto(
    photoData: string,
    existingHashes: string[],
  ): boolean {
    const currentHash = this.generatePhotoHash(photoData);
    return existingHashes.includes(currentHash);
  }

  /**
   * Log photo verification
   */
  private logPhotoVerification(
    result: PhotoVerificationResult,
    context: string,
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      context,
      verification: {
        isValid: result.isValid,
        quality: result.quality,
        hasFace: result.hasFace,
        dimensions: result.dimensions,
        fileSize: result.fileSize,
        format: result.format,
        warnings: result.warnings,
        errors: result.errors,
      },
    };

    if (result.errors.length > 0) {
      console.error("Photo verification failed:", logData);
    } else if (result.warnings.length > 0) {
      console.warn("Photo verification warnings:", logData);
    } else {
      console.log("Photo verification successful:", logData);
    }
  }

  /**
   * Create photo verification summary
   */
  public createPhotoVerificationSummary(results: PhotoVerificationResult[]): {
    totalPhotos: number;
    validPhotos: number;
    invalidPhotos: number;
    averageQuality: number;
    faceDetectionRate: number;
    manipulationDetected: number;
  } {
    const totalPhotos = results.length;
    const validPhotos = results.filter((r) => r.isValid).length;
    const invalidPhotos = totalPhotos - validPhotos;

    const averageQuality =
      results.reduce((sum, r) => sum + r.quality, 0) / totalPhotos;

    const faceDetectionRate =
      results.filter((r) => r.hasFace).length / totalPhotos;
    const manipulationDetected = results.filter(
      (r) =>
        r.warnings.some((w) => w.includes("manipulation")) ||
        r.errors.some((e) => e.includes("manipulation")),
    ).length;

    return {
      totalPhotos,
      validPhotos,
      invalidPhotos,
      averageQuality,
      faceDetectionRate,
      manipulationDetected,
    };
  }
}
