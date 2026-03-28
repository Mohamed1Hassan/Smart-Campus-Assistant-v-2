import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Calendar,
  BookOpen,
  Home,
  CalendarCheck,
  Bot,
  UserCheck,
  User,
  ChevronDown,
  Plus,
  Users,
  Menu,
  History,
  GraduationCap,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import DarkModeToggle from "../DarkModeToggle";
import NotificationBell from "../NotificationBell";
import ConfirmModal from "../ConfirmModal";
import Toast from "../Toast";
import { useLogout } from "../../hooks/useLogout";
import { useNotifications } from "../../hooks/useNotifications";
import { useResponsive } from "../../utils/responsive";
import { Logo } from "./Logo";

interface UnifiedNavbarProps {
  userName?: string;
  userAvatar?: string;
  userType?: "student" | "professor" | "admin";
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

const studentNavItems = [
  { icon: Home, Tag: "Dashboard", path: "/dashboard/student" },
  { icon: BookOpen, Tag: "My Courses", path: "/dashboard/student/courses" },
  { icon: Calendar, Tag: "Schedule", path: "/dashboard/student/schedule" },
  {
    icon: UserCheck,
    Tag: "Attendance",
    path: "/dashboard/student/attendance",
    hasSubmenu: true,
    submenu: [
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

const professorNavItems = [
  { icon: Home, Tag: "Dashboard", path: "/dashboard/professor" },
  { icon: BookOpen, Tag: "My Courses", path: "/dashboard/professor/courses" },
  {
    icon: CalendarCheck,
    Tag: "Attendance",
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

export default function UnifiedNavbar({
  userName = "Ahmed Hassan",
  userAvatar,
  userType = "student",
  onMenuToggle,
}: UnifiedNavbarProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { logout } = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useResponsive();

  const { stats, notifications, loading, error } = useNotifications({
    realTime: true,
    autoConnect: true,
  });

  const unreadCount = useMemo(() => {
    if (loading) return 0;
    if (error) return 0;
    if (
      stats?.unread !== undefined &&
      typeof stats.unread === "number" &&
      stats.unread >= 0
    ) {
      return stats.unread;
    }
    if (
      notifications &&
      Array.isArray(notifications) &&
      notifications.length > 0
    ) {
      return notifications.filter((n) => !n.isRead).length;
    }
    return 0;
  }, [stats, notifications, loading, error]);

  const handleLogoutClick = () => setShowLogoutModal(true);

  const handleLogoutConfirm = async () => {
    const success = await logout();
    if (success) {
      setShowToast(true);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => setShowLogoutModal(false);

  const handleProfileClick = () => {
    const targetPath =
      userType === "student"
        ? "/dashboard/student/profile"
        : "/dashboard/professor/profile";
    router.push(targetPath);
  };

  const handleSubmenuToggle = (itemPath: string) => {
    setOpenSubmenu(openSubmenu === itemPath ? null : itemPath);
  };

  const handleSubmenuItemClick = (itemPath: string) => {
    router.push(itemPath);
    setOpenSubmenu(null);
  };

  const navItems = userType === "student" ? studentNavItems : professorNavItems;
  const dashboardTitle =
    userType === "student"
      ? "Student Dashboard"
      : userType === "admin"
        ? "Admin Dashboard"
        : "Professor Dashboard";

  if (pathname === "/dashboard/admin") return null;

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border-b border-white/50 dark:border-gray-800/50 shadow-xl px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-300"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          {/* Left Section: Logo & Mobile Menu */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isMobile && onMenuToggle && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onMenuToggle}
                className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle Menu"
              >
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              </motion.button>
            )}

            <Link
              href={
                userType === "student"
                  ? "/dashboard/student"
                  : "/dashboard/professor"
              }
              className="flex items-center gap-2 sm:gap-3 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-lg shadow-indigo-500/10 shrink-0 relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Logo className="w-8 h-8 sm:w-9 sm:h-9 relative z-10" />
              </div>
              <div className={`hidden sm:block ${isMobile ? "hidden" : ""}`}>
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-none tracking-tight">
                  Smart Campus
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                  {dashboardTitle}
                </p>
              </div>
            </Link>
          </div>

          {/* Center Section: Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <ul className="flex items-center gap-1.5 bg-gray-100/30 dark:bg-gray-800/30 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 dark:border-gray-700/40 shadow-inner">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.path ||
                  (item.hasSubmenu &&
                    item.submenu?.some((subItem) => pathname === subItem.path));
                const isSubmenuOpen = openSubmenu === item.path;

                return (
                  <li key={item.path} className="relative">
                    <div className="relative">
                      <div
                        className={`flex items-center rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-white/80 dark:bg-gray-700/80 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/40 dark:hover:bg-gray-700/40"
                        }`}
                      >
                        <button
                          onClick={() => router.push(item.path)}
                          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${item.hasSubmenu ? "rounded-l-lg" : "rounded-lg"} hover:bg-black/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.Tag}
                        </button>
                        {item.hasSubmenu && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSubmenuToggle(item.path);
                            }}
                            className="px-2 py-2 rounded-r-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-l border-gray-200/50 dark:border-gray-600/50"
                            aria-label={`Toggle ${item.Tag} Submenu`}
                            aria-expanded={isSubmenuOpen}
                          >
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${isSubmenuOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Submenu */}
                      <AnimatePresence>
                        {item.hasSubmenu && isSubmenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-cardDark border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden p-1"
                          >
                            {item.submenu?.map((subItem, idx) => {
                              const SubIcon = subItem.icon;
                              return (
                                <button
                                  key={idx}
                                  onClick={() =>
                                    handleSubmenuItemClick(subItem.path)
                                  }
                                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                                >
                                  <SubIcon className="w-4 h-4" />
                                  {subItem.Tag}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1">
              <DarkModeToggle />
              <NotificationBell
                unreadCount={unreadCount}
                userType={userType as "student" | "professor" | "admin"}
              />
            </div>

            <div className="relative group ml-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleProfileClick}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 p-[2px] transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
              >
                <div className="w-full h-full bg-white dark:bg-gray-950 rounded-[14px] overflow-hidden relative group">
                  <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt={userName}
                      className="w-full h-full object-cover relative z-10"
                      width={40}
                      height={40}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-transparent text-indigo-600 dark:text-indigo-400 font-bold text-sm relative z-10">
                      {userName.charAt(0)}
                    </div>
                  )}
                </div>
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleLogoutClick}
              className="hidden sm:flex p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.nav>

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
