"use client";

import React from "react";
import { CheckCircle, XCircle, QrCode, MapPin, Smartphone, Camera, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface SecurityVerification {
  step: number;
  totalSteps: number;
  currentStep: string;
  isCompleted: boolean;
  isRequired: boolean;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "SKIPPED";
  data?: Record<string, unknown>;
  error?: string;
}

interface VerificationStepsProps {
  steps: SecurityVerification[];
}

const getStepIcon = (step: string) => {
  switch (step) {
    case "QR_CODE_SCAN":
      return <QrCode className="h-5 w-5" />;
    case "LOCATION_VERIFICATION":
      return <MapPin className="h-5 w-5" />;
    case "DEVICE_VERIFICATION":
      return <Smartphone className="h-5 w-5" />;
    case "PHOTO_CAPTURE":
      return <Camera className="h-5 w-5" />;
    case "FINAL_CONFIRMATION":
      return <CheckCircle className="h-5 w-5" />;
    default:
      return <Shield className="h-5 w-5" />;
  }
};

const VerificationSteps = ({ steps }: VerificationStepsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden"
    >
      <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Verification
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Security checks
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="relative flex gap-4">
              {/* Connector Line */}
              {index !== steps.length - 1 && (
                <div
                  className={`absolute left-[19px] top-10 bottom-[-24px] w-0.5 ${
                    step.status === "COMPLETED"
                      ? "bg-emerald-200 dark:bg-emerald-900"
                      : "bg-gray-100 dark:bg-gray-700"
                  }`}
                />
              )}

              {/* Status Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10 transition-all duration-300 shadow-sm ${
                  step.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 ring-4 ring-emerald-50 dark:ring-emerald-900/10"
                    : step.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-4 ring-blue-50 dark:ring-blue-900/10"
                      : step.status === "FAILED"
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 ring-4 ring-red-50 dark:ring-red-900/10"
                        : step.status === "SKIPPED"
                          ? "bg-gray-100 text-gray-400 dark:bg-gray-700/50 dark:text-gray-500 line-through opacity-60"
                          : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                }`}
              >
                {step.status === "COMPLETED" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : step.status === "FAILED" ? (
                  <XCircle className="w-5 h-5" />
                ) : (
                  getStepIcon(step.currentStep)
                )}
              </div>

              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <h3
                    className={`font-bold text-sm sm:text-base ${
                      step.status === "COMPLETED"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : step.status === "IN_PROGRESS"
                          ? "text-blue-700 dark:text-blue-400"
                          : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {step.currentStep.replace(/_/g, " ")}
                  </h3>
                  <Badge
                    variant={
                      step.status === "COMPLETED"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      step.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                        : ""
                    }
                  >
                    {step.status}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {step.isRequired ? "Required" : "Optional"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(VerificationSteps);
