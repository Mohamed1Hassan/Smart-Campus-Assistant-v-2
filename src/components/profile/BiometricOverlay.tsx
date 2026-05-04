"use client";

import { motion } from "framer-motion";

interface BiometricOverlayProps {
  status:
    | "IDLE"
    | "LOADING_MODELS"
    | "READY"
    | "CAPTURING"
    | "PROCESSING"
    | "SUCCESS"
    | "ALREADY_REGISTERED"
    | "ERROR";
  scanStep?: "CENTER" | "LEFT" | "RIGHT" | "DONE";
}

export default function BiometricOverlay({ status, scanStep }: BiometricOverlayProps) {
  const isScanning = status === "CAPTURING" || status === "PROCESSING";
  const isSuccess = status === "SUCCESS" || status === "ALREADY_REGISTERED";
  const isError = status === "ERROR";

  const getColor = () => {
    if (isError) return "rgba(239, 68, 68, 0.8)"; // Red
    if (isSuccess) return "rgba(16, 185, 129, 0.8)"; // Emerald
    if (isScanning) return "rgba(99, 102, 241, 0.8)"; // Indigo
    return "rgba(255, 255, 255, 0.3)"; // Default
  };

  const color = getColor();

  const getStepInstruction = () => {
    if (status !== "CAPTURING") return null;
    switch (scanStep) {
      case "CENTER": return "Look straight at the camera";
      case "LEFT": return "Turn your head slightly Left";
      case "RIGHT": return "Turn your head slightly Right";
      case "DONE": return "Perfect! Analyzing features...";
      default: return "Align your face within the scanning ring";
    }
  };

  const instruction = getStepInstruction();

  // Progress calculation
  let progressAngle = 0;
  if (scanStep === "LEFT") progressAngle = 120;
  else if (scanStep === "RIGHT") progressAngle = 240;
  else if (scanStep === "DONE") progressAngle = 360;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden flex flex-col items-center justify-center">
      {/* Corner Brackets */}
      <div className="absolute inset-4 sm:inset-8">
        <motion.div
          animate={{
            borderColor: color,
            scale: isScanning ? [1, 1.02, 1] : 1,
          }}
          transition={{
            scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
          }}
          className="w-full h-full relative"
        >
          <div className="absolute top-0 left-0 w-8 h-8 sm:w-12 sm:h-12 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-500" style={{ borderColor: color }} />
          <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-500" style={{ borderColor: color }} />
          <div className="absolute bottom-0 left-0 w-8 h-8 sm:w-12 sm:h-12 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-500" style={{ borderColor: color }} />
          <div className="absolute bottom-0 right-0 w-8 h-8 sm:w-12 sm:h-12 border-b-4 border-r-4 rounded-br-xl transition-colors duration-500" style={{ borderColor: color }} />
        </motion.div>
      </div>

      {/* Central Target Ring */}
      <motion.div
        animate={{
          scale: isScanning ? [1, 1.05, 1] : isSuccess ? 1.1 : 1,
          opacity: isSuccess ? 0 : 1,
        }}
        transition={{ duration: 1.5, repeat: isScanning ? Infinity : 0 }}
        className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full border-2 border-dashed transition-colors duration-500 flex items-center justify-center mb-8"
        style={{ borderColor: color }}
      >
        {/* Continuous Rotation Rings */}
        <motion.div
          animate={{ rotate: isScanning ? 360 : 0 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-t-2 transition-colors duration-500 opacity-50"
          style={{ borderColor: color }}
        />
        <motion.div
          animate={{ rotate: isScanning ? -360 : 0 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border-b-2 transition-colors duration-500 opacity-50"
          style={{ borderColor: color }}
        />

        {/* Dynamic Progress Arc (simulated using conic gradient) */}
        {isScanning && progressAngle > 0 && (
          <div 
            className="absolute inset-[-4px] rounded-full opacity-60 transition-all duration-700"
            style={{
              background: `conic-gradient(${color} ${progressAngle}deg, transparent 0deg)`,
              WebkitMaskImage: "radial-gradient(transparent 68%, black 69%)",
              maskImage: "radial-gradient(transparent 68%, black 69%)"
            }}
          />
        )}

        {/* Scan Line */}
        {isScanning && (
          <motion.div
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{
              duration: 3,
              ease: "linear",
              repeat: Infinity,
            }}
            className="absolute left-0 right-0 h-1 rounded-full shadow-[0_0_15px_3px_rgba(99,102,241,0.5)]"
            style={{ backgroundColor: color }}
          />
        )}
      </motion.div>

      {/* Dynamic Instruction Text */}
      {instruction && (
        <motion.div
          key={instruction}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute bottom-10 px-6 py-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10"
        >
          <p className="text-white font-bold tracking-wide text-sm sm:text-base">
            {instruction}
          </p>
        </motion.div>
      )}

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Success Pulse */}
      {isSuccess && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.4, 0] }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}
