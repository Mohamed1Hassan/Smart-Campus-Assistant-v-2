"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { QrCode, RefreshCw, Camera, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScannerSectionProps {
  isScanning: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onStartScan: () => void;
  onStopScan: () => void;
  permissions: { camera: string };
  courseName?: string;
}

const ScannerSection = ({
  isScanning,
  videoRef,
  canvasRef,
  onStartScan,
  onStopScan,
  permissions,
  courseName,
}: ScannerSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden"
    >
      <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-white/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
            <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              QR Scanner
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Verify attendance for {courseName || "Current Session"}
            </p>
          </div>
        </div>
        {isScanning && (
          <span className="flex items-center gap-2 text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Scanning...
          </span>
        )}
      </div>

      <div className="p-6 sm:p-8">
        <div className="relative max-w-xs sm:max-w-sm mx-auto aspect-square bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-700 ring-1 ring-gray-200 dark:ring-gray-800">
          {isScanning ? (
            <>
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-white/30 rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent animate-scan"></div>
                </div>
              </div>
              <div className="absolute bottom-6 left-0 right-0 text-center px-4 pointer-events-none">
                <p className="text-white/90 text-sm font-medium bg-black/50 backdrop-blur-sm py-2 px-4 rounded-full inline-block">
                  Align QR code within frame
                </p>
              </div>
              <button
                onClick={onStopScan}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-6 text-center bg-gray-50 dark:bg-gray-800/50">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <QrCode className="w-10 h-10 opacity-50" />
              </div>
              <p className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                {permissions.camera === "denied"
                  ? "Camera access is blocked"
                  : "Camera is currently off"}
              </p>
              {permissions.camera === "denied" && (
                <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl max-w-xs border border-red-100 dark:border-red-900/30">
                  <p className="font-bold mb-1">To enable camera:</p>
                  <ol className="list-decimal text-left pl-4 space-y-1">
                    <li>
                      Tap the{" "}
                      <span className="font-bold">lock icon 🔒</span>{" "}
                      in address bar
                    </li>
                    <li>
                      Set Camera to{" "}
                      <span className="font-bold">Allow</span>
                    </li>
                    <li>Refresh page</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            onClick={onStartScan}
            disabled={isScanning}
            className={`
              px-8 py-6 rounded-2xl text-base sm:text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95 w-full sm:w-auto
              ${
                permissions.camera === "denied"
                  ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/25"
              }
            `}
          >
            {isScanning ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Scanning...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                {permissions.camera === "denied"
                  ? "Retry Access"
                  : "Start Scanner"}
              </span>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(ScannerSection);
