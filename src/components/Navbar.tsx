/* eslint-disable @next/next/no-img-element */
"use client";
import { Search, LogOut } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";
import DarkModeToggle from "./DarkModeToggle";
import ConfirmModal from "./ConfirmModal";
import Toast from "./Toast";
import HamburgerMenu from "./HamburgerMenu";
import { useLogout } from "../hooks/useLogout";
import { useNotifications } from "../hooks/useNotifications";
import { useResponsive } from "../utils/responsive";

interface NavbarProps {
  userName?: string;
  userAvatar?: string;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export default function Navbar({
  userName = "Ahmed Hassan",
  userAvatar,
  onMenuToggle,
  isMenuOpen = false,
}: NavbarProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { logout, isLoading } = useLogout();
  const router = useRouter();
  const { isMobile } = useResponsive();

  // Get real notification count from API
  const { stats, notifications, loading } = useNotifications({
    realTime: true,
    autoConnect: true,
  });

  // Calculate unread count with fallbacks
  const unreadCount = useMemo(() => {
    // Don't show count while loading
    if (loading) {
      return 0;
    }

    // Priority 1: Use stats.unread if available (from API)
    if (stats?.unread !== undefined && typeof stats.unread === "number") {
      return stats.unread;
    }

    // Priority 2: Calculate from notifications array
    if (notifications && Array.isArray(notifications)) {
      const count = notifications.filter((n) => !n.isRead).length;
      return count;
    }

    // Default: return 0 (no notifications)
    return 0;
  }, [stats, notifications, loading]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    const success = await logout();
    if (success) {
      setShowToast(true);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleProfileClick = () => {
    router.push("/profile");
  };

  return (
    <>
      <nav
        className="bg-white dark:bg-cardDark border-b border-gray-200 dark:border-gray-700 px-4 sm:px-8 py-4 transition-colors duration-200"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          {isMobile && onMenuToggle && (
            <HamburgerMenu
              isOpen={isMenuOpen}
              onClick={onMenuToggle}
              className="mr-4"
            />
          )}

          {/* Search bar - hidden on mobile, visible on tablet+ */}
          <div className={`flex-1 max-w-xl ${isMobile ? "hidden" : "block"}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="search"
                id="main-search"
                name="search"
                placeholder="Search courses, professors, exams..."
                aria-label="Search courses, professors, exams"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-darkBg border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-textDark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search icon for mobile */}
            {isMobile && (
              <button
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Search"
                title="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            <DarkModeToggle />
            <NotificationBell unreadCount={unreadCount} userType="student" />

            <button
              onClick={handleLogoutClick}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleProfileClick}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-full transition-all duration-200 hover:scale-105 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={`Go to ${userName}'s profile`}
                title="View Profile"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200 cursor-pointer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 cursor-pointer">
                    {userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        isLoading={isLoading}
      />

      {showToast && (
        <Toast
          message="Logged out successfully"
          type="success"
          duration={2000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
