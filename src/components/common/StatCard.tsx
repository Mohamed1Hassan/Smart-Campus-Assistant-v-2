"use client";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import {
  cardElevated,
  itemFadeIn,
  prefersReducedMotion,
  TRANSITION_FAST,
} from "../../utils/animations";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  delay?: number;
  onClick?: () => void;
  tooltip?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  delay = 0,
  onClick,
  tooltip,
}: StatCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  const shouldAnimate = !prefersReducedMotion() && onClick;

  return (
    <motion.div
      variants={shouldAnimate ? cardElevated : itemFadeIn}
      initial={shouldAnimate ? "rest" : "hidden"}
      animate={shouldAnimate ? "rest" : "visible"}
      transition={{
        ...TRANSITION_FAST,
        delay: prefersReducedMotion() ? 0 : delay,
      }}
      whileHover={shouldAnimate ? "hover" : undefined}
      whileTap={shouldAnimate ? "tap" : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${
        onClick
          ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-500"
          : ""
      }`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={
        onClick
          ? `${title}: ${value}. ${tooltip || "Click to view details"}`
          : undefined
      }
      title={tooltip}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-mutedDark mb-2">
            {title}
          </h3>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-textDark">
              {value}
            </span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
