"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Home,
  Calendar,
  UserCheck,
  Bot,
  User,
  BookOpen,
  ChevronDown,
  Plus,
  Users,
  BarChart3,
  Settings,
  QrCode,
  History,
  LogOut,
  GraduationCap,
  FileText,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import logo from "@/assets/logo-new.png";
import { useLogout } from "../hooks/useLogout";
import ConfirmModal from "./ConfirmModal";
import Toast from "./Toast";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: "student" | "professor" | "admin";
}

const studentMenuItems = [
  { icon: Home, Tag: "Dashboard", path: "/dashboard/student" },
  { icon: BookOpen, Tag: "My Courses", path: "/dashboard/student/courses" },
  { icon: Calendar, Tag: "My Schedule", path: "/dashboard/student/schedule" },
  {
    icon: UserCheck,
    Tag: "Attendance",
    path: "/dashboard/student/attendance",
    hasSubmenu: true,
    submenu: [
      {
        icon: QrCode,
        Tag: "Mark Attendance",
        path: "/dashboard/student/attendance",
      },
      {
        icon: History,
        Tag: "Attendance History",
        path: "/dashboard/student/attendance?view=history",
      },
    ],
  },
  { icon: Bot, Tag: "AI Assistant", path: "/dashboard/student/ai-assistant" },
  { icon: GraduationCap, Tag: "Grades", path: "/dashboard/student/grades" },
  { icon: FileText, Tag: "Exams", path: "/dashboard/student/exams" },
  { icon: User, Tag: "Profile", path: "/dashboard/student/profile" },
];

const professorMenuItems = [
  { icon: Home, Tag: "Dashboard", path: "/dashboard/professor" },
  { icon: BookOpen, Tag: "My Courses", path: "/dashboard/professor/courses" },
  {
    icon: UserCheck,
    Tag: "Attendance Management",
    path: "/dashboard/professor/attendance",
    hasSubmenu: true,
    submenu: [
      {
        icon: Plus,
        Tag: "Create Session",
        path: "/dashboard/professor/attendance/create",
      },
      {
        icon: Users,
        Tag: "Active Sessions",
        path: "/dashboard/professor/attendance/sessions",
      },
      {
        icon: BarChart3,
        Tag: "Reports",
        path: "/dashboard/professor/attendance/reports",
      },
      {
        icon: Settings,
        Tag: "Settings",
        path: "/dashboard/professor/attendance/settings",
      },
    ],
  },
  { icon: Bot, Tag: "AI Assistant", path: "/dashboard/professor/chatbot" },
  { icon: GraduationCap, Tag: "Grades", path: "/dashboard/professor/grades" },
  { icon: FileText, Tag: "Exams", path: "/dashboard/professor/exams" },
  { icon: User, Tag: "Profile", path: "/dashboard/professor/profile" },
];

export default function MobileDrawer({
  isOpen,
  onClose,
  userType = "student",
}: MobileDrawerProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { logout } = useLogout();

  const menuItems =
    userType === "student" ? studentMenuItems : professorMenuItems;

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        drawerRef.current?.focus();
      }, 100);
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleMenuItemClick = () => {
    onClose();
  };

  const handleSubmenuToggle = (itemPath: string) => {
    setOpenSubmenu(openSubmenu === itemPath ? null : itemPath);
  };

  const handleSubmenuItemClick = () => {
    onClose();
    setOpenSubmenu(null);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    const success = await logout();
    if (success) {
      setShowToast(true);
      setShowLogoutModal(false);
      onClose();
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const drawerVariants: Variants = {
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const backdropVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 },
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              onClick={handleBackdropClick}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              ref={drawerRef}
              variants={drawerVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed inset-y-0 left-0 w-[280px] bg-white/90 dark:bg-cardDark/90 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/50 shadow-2xl z-50 flex flex-col focus:outline-none"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              tabIndex={-1}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-800/50 flex items-center justify-between bg-white/50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative flex items-center justify-center">
                    <Image
                      src={logo}
                      alt="Logo"
                      className="w-full h-full object-contain"
                      priority
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none tracking-tight">
                      Smart Campus
                    </h1>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                      Assistant
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav
                className="flex-1 px-4 py-6 overflow-y-auto scrollbar-hide"
                aria-label="Main navigation"
              >
                <ul className="space-y-1.5 list-none">
                  {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.path ||
                      (item.hasSubmenu &&
                        item.submenu?.some(
                          (subItem) => pathname === subItem.path,
                        ));
                    const isSubmenuOpen = openSubmenu === item.path;

                    return (
                      <motion.li
                        key={item.path}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="list-none"
                      >
                        {item.hasSubmenu ? (
                          <div className="overflow-hidden rounded-xl">
                            <div
                              className={`flex items-center transition-all duration-200 ${
                                isActive
                                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              }`}
                            >
                              <Link
                                href={item.path}
                                onClick={handleMenuItemClick}
                                className="flex items-center gap-3 px-4 py-3.5 flex-1 font-medium text-sm"
                              >
                                <Icon
                                  className={`w-5 h-5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-500"}`}
                                />
                                {item.Tag}
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSubmenuToggle(item.path);
                                }}
                                className="px-4 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                              >
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform duration-300 ${isSubmenuOpen ? "rotate-180" : ""}`}
                                />
                              </button>
                            </div>

                            {/* Submenu */}
                            <AnimatePresence>
                              {isSubmenuOpen && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="bg-gray-50/50 dark:bg-gray-800/20"
                                >
                                  {item.submenu?.map((subItem, subIndex) => {
                                    const SubIcon = subItem.icon;
                                    const isSubActive =
                                      pathname === subItem.path;

                                    return (
                                      <Link
                                        key={`${item.path}-${subItem.Tag}-${subIndex}`}
                                        href={subItem.path}
                                        onClick={handleSubmenuItemClick}
                                        className={`flex items-center gap-3 px-4 py-3 pl-12 text-sm font-medium transition-colors ${
                                          isSubActive
                                            ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10"
                                            : "text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                                        }`}
                                      >
                                        <SubIcon className="w-4 h-4" />
                                        {subItem.Tag}
                                      </Link>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <Link
                            href={item.path}
                            onClick={handleMenuItemClick}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                              isActive
                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500 dark:text-gray-500"}`}
                            />
                            {item.Tag}
                          </Link>
                        )}
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              {/* Bottom Menu (Logout) */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/20">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: menuItems.length * 0.05 }}
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onCancel={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
      />

      {showToast && (
        <Toast
          message="Logged out successfully"
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
