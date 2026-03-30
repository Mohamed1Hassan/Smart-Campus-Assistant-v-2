import React from "react";
import { Clock, MapPin, CheckCircle, Camera, Smartphone, Shield } from "lucide-react";

interface AttendanceLivePreviewProps {
  formData: any;
  selectedCourse: any;
}

const AttendanceLivePreview: React.FC<AttendanceLivePreviewProps> = ({
  formData,
  selectedCourse,
}) => {
  return (
    <div className="bg-white dark:bg-cardDark rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden relative">
      {/* Phone Frame / Card Preview */}
      <div className="h-40 bg-gradient-to-br from-purple-600 to-indigo-600 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
        <div className="relative z-10">
          <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-medium mb-3">
            {selectedCourse?.courseCode || "CS-101"}
          </span>
          <h2 className="text-xl font-bold leading-tight mb-1">
            {formData.title || "Session Title"}
          </h2>
          <p className="text-purple-100 text-sm truncate">
            {selectedCourse?.courseName || "Select a course"}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Time</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formData.startTime
                ? new Date(formData.startTime).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Not set"}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {formData.duration} hours duration
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Location</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formData.location.name || "No location set"}
            </p>
            {formData.security.isLocationRequired && (
              <p className="text-xs text-green-700 dark:text-green-500 mt-0.5 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Geofencing Active
              </p>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">
            Security Features
          </p>
          <div className="flex gap-2 flex-wrap">
            {formData.security.isPhotoRequired && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                <Camera className="w-3 h-3" /> Photo
              </span>
            )}
            {formData.security.isDeviceCheckRequired && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> Device
              </span>
            )}
            {formData.security.fraudDetectionEnabled && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                <Shield className="w-3 h-3" /> AI Fraud
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceLivePreview;
