"use client";
import React from "react";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
  "aria-label"?: string;
}

export default function HamburgerMenu({
  isOpen,
  onClick,
  className = "",
  "aria-label": ariaLabel = "Toggle menu",
}: HamburgerMenuProps) {
  const iconVariants = {
    closed: {
      rotate: 0,
      scale: 1,
    },
    open: {
      rotate: 180,
      scale: 1,
    },
  };

  const pathVariants = {
    closed: {
      opacity: 1,
      pathLength: 1,
    },
    open: {
      opacity: 0,
      pathLength: 0,
    },
  };

  return (
    <motion.button
      onClick={onClick}
      className={`p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[44px] min-w-[44px] flex items-center justify-center ${className}`}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      variants={iconVariants}
      animate={isOpen ? "open" : "closed"}
      transition={{ duration: 0.2 }}
    >
      <div className="relative w-6 h-6">
        {/* Menu icon */}
        <motion.div
          variants={pathVariants}
          animate={isOpen ? "open" : "closed"}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
        >
          <Menu className="w-6 h-6" strokeWidth={2} />
        </motion.div>

        {/* Close icon */}
        <motion.div
          variants={pathVariants}
          animate={isOpen ? "closed" : "open"}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
        >
          <X className="w-6 h-6" strokeWidth={2} />
        </motion.div>
      </div>
    </motion.button>
  );
}
