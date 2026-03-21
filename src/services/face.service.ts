import * as faceapi from "face-api.js";
import { Canvas, Image, ImageData, loadImage } from "canvas";
import path from "path";
import fs from "fs";

export class FaceService {
  private static modelsLoaded = false;
  private static envPatched = false;
  private static readonly MODELS_PATH = path.join(
    process.cwd(),
    "public",
    "models",
  );
  private static readonly MATCH_THRESHOLD = 0.6;

  /**
   * Ensure face-api matches the Node.js environment
   */
  private static ensureEnvironmentPatched() {
    if (this.envPatched) return;

    try {
      // Only patch on server-side
      if (typeof window === "undefined") {
        // @ts-expect-error face-api environment needs patching for Node.js canvas compatibility
        faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
        console.log("[FaceService] Environment patched for Node.js");
      }
      this.envPatched = true;
    } catch (error) {
      console.error("[FaceService] Failed to patch environment:", error);
      // Don't throw, might still work in some contexts or mock mode
    }
  }

  /**
   * Initialize and load models
   */
  static async initialize() {
    if (this.modelsLoaded) return;

    // Patch environment before loading models
    this.ensureEnvironmentPatched();

    try {
      // Ensure directory exists
      if (!fs.existsSync(this.MODELS_PATH)) {
        fs.mkdirSync(this.MODELS_PATH, { recursive: true });
        console.log(
          `[FaceService] Created models directory at: ${this.MODELS_PATH}`,
        );
      }

      const requiredModels = [
        "ssd_mobilenetv1_model-weights_manifest.json",
        "face_landmark_68_model-weights_manifest.json",
        "face_recognition_model-weights_manifest.json",
      ];

      const missingModels = requiredModels.filter(
        (m) => !fs.existsSync(path.join(this.MODELS_PATH, m)),
      );

      if (missingModels.length > 0) {
        const errorMsg = `[FaceService] Missing models in ${this.MODELS_PATH}: ${missingModels.join(", ")}. Face verification will be disabled until models are downloaded.`;
        console.warn(errorMsg);

        // If in development and we want to allow testing without models
        if (
          process.env.NODE_ENV === "development" ||
          process.env.NEXT_PUBLIC_MOCK_FACE_ID === "true"
        ) {
          console.log("[FaceService] Running in MOCK_MODE for development");
          return;
        }
        throw new Error(errorMsg);
      }

      await faceapi.nets.ssdMobilenetv1.loadFromDisk(this.MODELS_PATH);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(this.MODELS_PATH);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(this.MODELS_PATH);

      this.modelsLoaded = true;
      console.log("[FaceService] Models loaded successfully");
    } catch (error) {
      const err = error as Error;
      console.error("[FaceService] Initialization failed:", err.message);
    }
  }

  /**
   * Get face descriptor from an image buffer or base64 string
   */
  static async getFaceDescriptor(
    imageInput: Buffer | string,
  ): Promise<Float32Array | null> {
    await this.initialize();

    // Fallback for development if models are missing
    if (
      !this.modelsLoaded &&
      (process.env.NODE_ENV === "development" ||
        process.env.NEXT_PUBLIC_MOCK_FACE_ID === "true")
    ) {
      // Return a random descriptor (128 floats)
      return new Float32Array(128).map(() => Math.random());
    }

    if (!this.modelsLoaded) return null;

    try {
      let image: Image;
      if (Buffer.isBuffer(imageInput)) {
        image = await loadImage(imageInput);
      } else if (typeof imageInput === "string") {
        // Remove data URL prefix if present
        const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        image = await loadImage(buffer);
      } else {
        throw new Error("Invalid image input");
      }

      const detections = await faceapi
        .detectSingleFace(image as unknown as HTMLCanvasElement)
        .withFaceLandmarks()
        .withFaceDescriptor();

      return detections ? detections.descriptor : null;
    } catch (error) {
      console.error("[FaceService] Error getting face descriptor:", error);
      return null;
    }
  }

  /**
   * Verify a face against a stored descriptor
   * @param imageInput The new image (Selfie)
   * @param storedDescriptor The stored descriptor (from Registration)
   */
  static async verifyFace(
    imageInput: Buffer | string,
    storedDescriptor: number[] | Record<string, number>,
  ): Promise<{ isMatch: boolean; score: number }> {
    if (!storedDescriptor) {
      throw new Error("No stored face descriptor found for user");
    }

    // Handle initialization check
    await this.initialize();

    const newDescriptor = await this.getFaceDescriptor(imageInput);

    if (!newDescriptor) {
      throw new Error("No face detected in the provided image");
    }

    // Mock verification logic for development
    if (
      !this.modelsLoaded &&
      (process.env.NODE_ENV === "development" ||
        process.env.NEXT_PUBLIC_MOCK_FACE_ID === "true")
    ) {
      return {
        isMatch: true,
        score: 0.1,
      };
    }

    // Convert stored JSON/Array back to Float32Array
    const storedValues = Array.isArray(storedDescriptor)
      ? storedDescriptor
      : Object.values(storedDescriptor);
    const storedFloat32 = new Float32Array(storedValues);

    const distance = faceapi.euclideanDistance(newDescriptor, storedFloat32);

    // Distance 0 means exact match, higher means different.
    // Usually < 0.6 is a match.
    return {
      isMatch: distance < this.MATCH_THRESHOLD,
      score: distance, // Lower is better
    };
  }
}

export const getFaceService = () => FaceService;
export default FaceService;
