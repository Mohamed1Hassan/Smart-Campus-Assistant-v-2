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
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-white/40 dark:border-gray-700/50 overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-transparent dark:from-gray-800/50">
        <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" strokeWidth={2.5} />
          Quick Actions
        </h2>
      </div>
      <div className="p-5 space-y-3">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className="w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800 transition-all duration-300 group hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 group-hover:scale-110 group-hover:shadow-indigo-500/20 transition-all duration-300">
                <action.icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" strokeWidth={2} />
              </div>
              <span className="font-bold text-base text-gray-700 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                {action.label}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" strokeWidth={2.5} />
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default React.memo(QuickActions);
