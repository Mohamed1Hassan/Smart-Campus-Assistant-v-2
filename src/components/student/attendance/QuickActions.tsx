"use client";

import React from "react";
import { motion } from "framer-motion";
import { Settings, History, HelpCircle, ChevronRight } from "lucide-react";

interface QuickActionsProps {
  onShowSettings: () => void;
  onShowHistory: () => void;
  onShowHelp: () => void;
}

const QuickActions = ({
  onShowSettings,
  onShowHistory,
  onShowHelp,
}: QuickActionsProps) => {
  const actions = [
    {
      icon: Settings,
      label: "Settings",
      onClick: onShowSettings,
    },
    {
      icon: History,
      label: "History",
      onClick: onShowHistory,
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      onClick: onShowHelp,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden"
    >
      <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          Quick Actions
        </h2>
      </div>
      <div className="p-4 space-y-3">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <action.icon className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600" />
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                {action.label}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default React.memo(QuickActions);
