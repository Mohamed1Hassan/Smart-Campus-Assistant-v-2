"use client";

import { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import {
  Camera,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  ScanFace,
  RefreshCw,
} from "lucide-react";
import { useToast } from "../common/ToastProvider";
import { registerFaceAction } from "@/actions/user.actions";
import { motion, AnimatePresence } from "framer-motion";
import BiometricOverlay from "./BiometricOverlay";

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

  const MODELS_URL = "/models";
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [forceReconfigure, setForceReconfigure] = useState(false);

  useEffect(() => {
    if (isRegistered && status === "IDLE" && !forceReconfigure) {
      setStatus("ALREADY_REGISTERED");
    }
  }, [isRegistered, status, forceReconfigure]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (status === "CAPTURING" && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [status, stream]);

  const loadModels = async () => {
    try {
      setStatus("LOADING_MODELS");
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL);
      setStatus("READY");
    } catch (err) {
      console.error("Model loading error:", err);
      setStatus("ERROR");
      setErrorMsg(
        "Failed to load biometric models. Please check your connection."
      );
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
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
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toastError("No face detected. Please align your face within the frame.");
        return;
      }

      setStatus("PROCESSING");

      const res = await registerFaceAction(Array.from(detection.descriptor));

      if (res.success) {
        setStatus("SUCCESS");
        success("FaceID registered successfully!");

        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }

        setTimeout(() => {
          if (onComplete) onComplete();
        }, 2000);
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } },
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-32 bg-indigo-500/20 dark:bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="p-6 border-b border-gray-100/50 dark:border-gray-700/50 flex items-center gap-3 relative z-10">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
          <ScanFace className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
            FaceID Setup
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Secure Biometric Authentication
          </p>
        </div>
      </div>

      <div className="p-8 flex flex-col items-center min-h-[400px] justify-center relative z-10">
        <AnimatePresence mode="wait">
          {status === "IDLE" && (
            <motion.div
              key="idle"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center space-y-6 w-full max-w-sm"
            >
              <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full animate-ping" />
                <div className="relative w-full h-full bg-gradient-to-tr from-indigo-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center border border-indigo-100 dark:border-gray-600 shadow-xl">
                  <Shield className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-2xl text-gray-900 dark:text-white">
                  Protect Your Account
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 leading-relaxed">
                  Enable FaceID for instant, secure access to your classes and exams. Your biometric data is encrypted end-to-end.
                </p>
              </div>
              <button
                onClick={loadModels}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] flex items-center justify-center gap-2"
              >
                <ScanFace className="w-5 h-5" />
                Start Setup
              </button>
            </motion.div>
          )}

          {(status === "LOADING_MODELS" || status === "PROCESSING") && (
            <motion.div
              key="loading"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center py-10 space-y-6"
            >
              <div className="relative w-24 h-24 mx-auto">
                <svg className="animate-spin w-full h-full text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-indigo-600/50 dark:text-indigo-400/50" />
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-semibold animate-pulse text-lg">
                {status === "LOADING_MODELS"
                  ? "Initializing Neural Engine..."
                  : "Analyzing Facial Topology..."}
              </p>
            </motion.div>
          )}

          {status === "ERROR" && (
            <motion.div
              key="error"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center space-y-6 w-full max-w-sm"
            >
              <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertCircle className="w-12 h-12" />
              </div>
              <div>
                <h4 className="font-bold text-xl text-gray-900 dark:text-white">Connection Failed</h4>
                <p className="text-red-600 dark:text-red-400 font-medium text-sm mt-2">{errorMsg}</p>
              </div>
              <button
                onClick={loadModels}
                className="w-full py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            </motion.div>
          )}

          {(status === "READY" || status === "CAPTURING") && (
            <motion.div
              key="camera"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6 w-full max-w-md flex flex-col items-center"
            >
              <div className="relative w-full aspect-[4/3] sm:aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                {status === "READY" ? (
                  <button
                    onClick={startCamera}
                    className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-4 text-white/50 hover:text-white hover:bg-white/5 transition-all group"
                  >
                    <div className="p-6 rounded-full bg-white/5 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-300">
                      <Camera className="w-10 h-10" />
                    </div>
                    <span className="font-semibold tracking-wide">Tap to Enable Camera</span>
                  </button>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover mirror"
                    />
                    {/* The new Premium Biometric Overlay */}
                    <BiometricOverlay status={status} />
                  </>
                )}
              </div>

              {status === "CAPTURING" && (
                <div className="space-y-4 w-full">
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 text-center">
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                      Align your face within the scanning ring
                    </p>
                  </div>
                  <button
                    onClick={captureAndRegister}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all flex items-center justify-center gap-2 text-lg"
                  >
                    <ScanFace className="w-6 h-6" />
                    Verify Identity
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {status === "SUCCESS" && (
            <motion.div
              key="success"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center py-8 space-y-6"
            >
              <div className="relative w-28 h-28 mx-auto">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="absolute inset-0 bg-emerald-100 dark:bg-emerald-500/20 rounded-full"
                />
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 bg-emerald-400/30 rounded-full"
                />
                <div className="relative w-full h-full flex items-center justify-center">
                  <CheckCircle className="w-14 h-14 text-emerald-500" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-2xl text-gray-900 dark:text-white">FaceID Active</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  Your biometric profile has been securely configured.
                </p>
              </div>
            </motion.div>
          )}

          {status === "ALREADY_REGISTERED" && (
            <motion.div
              key="already-registered"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center space-y-6 w-full max-w-sm"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/20 rounded-3xl rotate-3 flex items-center justify-center mx-auto shadow-inner border border-emerald-200 dark:border-emerald-700/50">
                <Shield className="w-10 h-10 text-emerald-600 dark:text-emerald-400 -rotate-3" />
              </div>
              <div>
                <h4 className="font-bold text-2xl text-gray-900 dark:text-white">Secured by FaceID</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 leading-relaxed">
                  Your identity is protected. You can use your face to seamlessly verify attendance and access secured areas.
                </p>
              </div>
              <button
                onClick={() => {
                  setForceReconfigure(true);
                  setStatus("IDLE");
                }}
                className="w-full py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-2xl font-bold transition-all mt-4"
              >
                Reconfigure FaceID
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
