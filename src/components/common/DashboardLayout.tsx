"use client";
import { ReactNode, useState } from "react";
import UnifiedNavbar from "./UnifiedNavbar";
import MobileDrawer from "../MobileDrawer";

interface DashboardLayoutProps {
  children: ReactNode;
  userName?: string;
  userAvatar?: string;
  userType?: "student" | "professor" | "admin";
  title?: string;
  subtitle?: string;
}

export default function DashboardLayout({
  children,
  userName = "Ahmed Hassan",
  userAvatar,
  userType = "student",
  title,
  subtitle,
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-gray-50 dark:bg-darkBg relative w-full"
      role="application"
    >
      <div className="flex-1 flex flex-col min-w-0">
        <UnifiedNavbar
          userName={userName}
          userAvatar={userAvatar}
          userType={userType}
          onMenuToggle={handleMobileMenuToggle}
          isMenuOpen={isMobileMenuOpen}
        />

        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200"
          tabIndex={-1}
        >
          <div className="w-full max-w-7xl mx-auto">
            {(title || subtitle) && (
              <div className="mb-8">
                {title && (
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
        userType={userType}
      />
    </div>
  );
}
