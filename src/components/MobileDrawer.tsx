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
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    open: {
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
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
              className="fixed inset-0 bg-black/40 z-50"
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
              className="fixed inset-y-0 left-0 w-[280px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-r border-white/40 dark:border-gray-800/40 shadow-2xl z-50 flex flex-col focus:outline-none overflow-hidden"
              style={{ willChange: "transform" }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              tabIndex={-1}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/20 dark:border-gray-800/50 flex items-center justify-between bg-white/20 dark:bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative flex items-center justify-center bg-white/50 dark:bg-white/10 rounded-xl border border-white/60 dark:border-white/10 shadow-sm">
                    <Image
                      src={logo}
                      alt="Logo"
                      className="w-full h-full object-contain p-1.5"
                      priority
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none tracking-tight">
                      Smart Campus
                    </h1>
                    <p className="text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold mt-1 opacity-80">
                      Assistant
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800 transition-colors"
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
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.path ||
                      (item.hasSubmenu &&
                        item.submenu?.some(
                          (subItem) => pathname === subItem.path,
                        ));
                    const isSubmenuOpen = openSubmenu === item.path;

                    return (
                      <li
                        key={item.path}
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
                                className="flex items-center gap-3 px-4 py-3.5 flex-1 font-semibold text-sm"
                              >
                                <Icon
                                  className={`w-5 h-5 transition-colors duration-300 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`}
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
                                  className="bg-black/5 dark:bg-white/5 backdrop-blur-sm border-y border-white/10"
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
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-sm font-semibold relative overflow-hidden group/item ${
                              isActive
                                ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                                : "text-gray-600 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                            }`}
                          >
                            <div className={`absolute inset-0 bg-white/10 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 ${isActive ? "hidden" : ""}`} />
                            <Icon
                              className={`w-5 h-5 relative z-10 transition-transform duration-300 group-hover/item:scale-110 ${isActive ? "text-white" : "text-gray-500 dark:text-gray-400"}`}
                            />
                            <span className="relative z-10">{item.Tag}</span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Bottom Menu (Logout) */}
              <div className="p-4 border-t border-white/20 dark:border-gray-800/50 bg-white/10 dark:bg-white/5 backdrop-blur-md">
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-red-500 hover:text-white shadow-sm hover:shadow-red-500/20 group/logout"
                >
                  <LogOut className="w-5 h-5 transition-transform group-hover/logout:-translate-x-1" />
                  Logout
                </button>
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
