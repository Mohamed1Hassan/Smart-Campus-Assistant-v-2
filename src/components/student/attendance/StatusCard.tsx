"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity, MapPin, Smartphone, Camera, Shield } from "lucide-react";

interface StatusCardProps {
  locationData: any;
  deviceFingerprint: any;
  photoData: any;
  securityScore: number;
}

const StatusCard = ({
  locationData,
  deviceFingerprint,
  photoData,
  securityScore,
}: StatusCardProps) => {
  const statusItems = [
    {
      label: "Location",
      value: locationData ? `${locationData.accuracy}m` : "N/A",
      icon: MapPin,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Device",
      value: deviceFingerprint ? "Verified" : "Pending",
      icon: Smartphone,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      label: "Photo",
      value: photoData ? "Captured" : "Pending",
      icon: Camera,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: "Score",
      value: `${securityScore}%`,
      icon: Shield,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden"
    >
      <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          Live Status
        </h2>
      </div>
      <div className="p-4 space-y-2">
        {statusItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default React.memo(StatusCard);
