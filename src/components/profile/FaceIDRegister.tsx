"use client";

import { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import {
  Camera,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "../common/ToastProvider";
import { registerFaceAction } from "@/actions/user.actions";

interface FaceIDRegisterProps {
  isRegistered?: boolean;
  onComplete?: () => void;
}

export default function FaceIDRegister({
  isRegistered = false,
  onComplete,
}: FaceIDRegisterProps) {
  const [status, setStatus] = useState<
    | "IDLE"
    | "LOADING_MODELS"
    | "READY"
    | "CAPTURING"
    | "PROCESSING"
    | "SUCCESS"
    | "ALREADY_REGISTERED"
    | "ERROR"
  >(isRegistered ? "ALREADY_REGISTERED" : "IDLE");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { success, error: toastError } = useToast();

  const MODELS_URL =
    "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

  const [stream, setStream] = useState<MediaStream | null>(null);

  // Initial sync with prop
  useEffect(() => {
    if (isRegistered && status === "IDLE") {
      setStatus("ALREADY_REGISTERED");
    }
  }, [isRegistered, status]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Attach stream when video element becomes available
  useEffect(() => {
    if (status === "CAPTURING" && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [status, stream]);

  const loadModels = async () => {
    try {
      setStatus("LOADING_MODELS");
      // We load from CDN to avoid needing local files for now
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL);
      setStatus("READY");
    } catch (err) {
      console.error("Model loading error:", err);
      setStatus("ERROR");
      setErrorMsg(
        "Failed to load face detection models. Please check your connection.",
      );
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      setStream(mediaStream);
      setStatus("CAPTURING");
    } catch (err) {
      console.error("Camera error:", err);
      setStatus("ERROR");
      setErrorMsg("Camera access denied. Please enable camera permissions.");
    }
  };

  const captureAndRegister = async () => {
    if (!videoRef.current) return;

    try {
      // Keep status as CAPTURING during local detection to keep video mounted
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toastError("No face detected. Please look directly at the camera.");
        return;
      }

      // Now transition to processing for the backend call
      setStatus("PROCESSING");

      // Send to backend
      const res = await registerFaceAction(Array.from(detection.descriptor));

      if (res.success) {
        setStatus("SUCCESS");
        success("FaceID registered successfully!");

        // Stop camera accurately using state
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }

        if (onComplete) onComplete();
      } else {
        setStatus("CAPTURING");
        throw new Error(res.error);
      }
    } catch (err: unknown) {
      console.error("Registration error:", err);
      setStatus("CAPTURING");
      const errorMessage =
        err instanceof Error ? err.message : "Face registration failed";
      toastError(errorMessage);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
        <Shield className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-gray-900 dark:text-white">
          FaceID Security
        </h3>
      </div>

      <div className="p-8 flex flex-col items-center">
        {status === "IDLE" && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto text-indigo-600">
              <Camera className="w-10 h-10" />
            </div>
            <div>
              <h4 className="font-bold text-lg">Setup FaceID</h4>
              <p className="text-gray-500 text-sm max-w-xs mx-auto mt-1">
                Secure your attendance sessions with biometric verification.
                Your face data is encrypted and stored securely.
              </p>
            </div>
            <button
              onClick={loadModels}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              Start Setup
            </button>
          </div>
        )}

        {(status === "LOADING_MODELS" || status === "PROCESSING") && (
          <div className="text-center py-10 space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
            <p className="text-gray-500 font-medium">
              {status === "LOADING_MODELS"
                ? "Downloading secure models..."
                : "Analyzing biometric data..."}
            </p>
          </div>
        )}

        {status === "ERROR" && (
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-red-600 font-medium">{errorMsg}</p>
            <button
              onClick={loadModels}
              className="text-indigo-600 font-bold hover:underline"
            >
              Try Again
            </button>
          </div>
        )}

        {(status === "READY" || status === "CAPTURING") && (
          <div className="space-y-6 w-full max-w-sm">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-4 border-gray-100 dark:border-gray-700">
              {status === "READY" ? (
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors"
                >
                  <Camera className="w-12 h-12" />
                  <span className="font-bold">Enable Camera</span>
                </button>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover mirror"
                />
              )}
              <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full w-[200px] h-[200px] m-auto pointer-events-none"></div>
            </div>

            {status === "CAPTURING" && (
              <div className="space-y-3">
                <p className="text-xs text-center text-gray-500">
                  Center your face within the frame and look straight ahead.
                </p>
                <button
                  onClick={captureAndRegister}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all"
                >
                  Register My Face
                </button>
              </div>
            )}
          </div>
        )}

        {status === "SUCCESS" && (
          <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle className="w-12 h-12" />
            </div>
            <div>
              <h4 className="font-bold text-xl">Verification Complete</h4>
              <p className="text-gray-500 text-sm mt-1">
                Your FaceID is now active and ready for use.
              </p>
            </div>
          </div>
        )}

        {status === "ALREADY_REGISTERED" && (
          <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <Shield className="w-12 h-12" />
            </div>
            <div>
              <h4 className="font-bold text-xl">FaceID Active</h4>
              <p className="text-gray-500 text-sm mt-1 mb-4">
                Your FaceID is securely registered and active.
              </p>
              <button
                onClick={() => setStatus("IDLE")}
                className="text-indigo-600 font-bold hover:underline text-sm transition-all"
              >
                Register Again
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
