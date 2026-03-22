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
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-white/40 dark:border-gray-700/50 overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-transparent dark:from-gray-800/50">
        <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 flex items-center gap-2.5">
          <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
          Live Status
        </h2>
      </div>
      <div className="p-5 space-y-3">
        {statusItems.map((item, i) => (
          <div
            key={i}
            className="group flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-white dark:bg-gray-800/30 dark:hover:bg-gray-800 transition-all duration-300 hover:shadow-md border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${item.bg} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                {item.label}
              </span>
            </div>
            <span className="text-xs font-black text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 px-3 py-1.5 rounded-xl">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default React.memo(StatusCard);
