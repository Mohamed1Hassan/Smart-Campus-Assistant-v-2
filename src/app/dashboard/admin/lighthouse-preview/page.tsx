"use client";

import React, { useState, useEffect } from "react";
import AdminOverview from "@/components/admin/AdminOverview";
import UserManagementDashboard from "@/components/admin/UserManagementDashboard";
import FraudAlertsDashboard from "@/components/admin/FraudAlertsDashboard";
import CourseManagementDashboard from "@/components/admin/CourseManagementDashboard";
import AdminStudentPreview from "@/components/admin/AdminStudentPreview";
import DashboardLayout from "@/components/common/DashboardLayout";
import { TokenManager } from "@/services/api";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCheck,
  ShieldAlert,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * LIGHTHOUSE PREVIEW PAGE
 * 
 * This page is used for performance auditing (Lighthouse).
 * It bypasses the strict Admin authentication and "secret" keyword checks.
 * IMPORTANT: This should be protected in production or removed from the build.
 */
export default function LighthousePreview() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "courses" | "experience" | "security" | "settings"
  >("overview");

  // Bypass Auth by mocking the user for audit if requested
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const params = new URLSearchParams(window.location.search);
    const shouldForceMock = params.get('mock') === 'true';

    // If we're not in development, don't allow mock auth
    if (!isDevelopment) return;

    const existingUser = TokenManager.getUserData();
    const existingToken = TokenManager.getAccessToken();
    const isMockBeingUsed = existingToken === "mock-access-token";
    const isRealAdmin = existingUser?.role === "admin" && !isMockBeingUsed;

    // Apply mock only if forced or if no real session exists
    if (shouldForceMock || !isRealAdmin) {
      if (!isMockBeingUsed) {
        console.log("[LighthousePreview] Applying mock admin session for audit...");
        const mockAdmin = {
          id: 999,
          universityId: "ADMIN-LH",
          email: "lighthouse@thebes.edu",
          firstName: "Audit",
          lastName: "Mode",
          role: "admin",
          firstName_ar: "وضع",
          lastName_ar: "الاختبار",
        };
        TokenManager.setUserData(mockAdmin as any);
        TokenManager.setTokens("mock-access-token", "mock-refresh-token", 3600);
      }
      
      document.cookie = "isAdminUnlocked=true; path=/";
      localStorage.setItem("isAdminUnlocked", "true");
    }
  }, []);

  const handleClearMock = () => {
    TokenManager.clearTokens();
    localStorage.removeItem("isAdminUnlocked");
    document.cookie = "isAdminUnlocked=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/";
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { id: "courses", label: "Courses", icon: <BookOpen className="w-4 h-4" /> },
    { id: "experience", label: "Student Experience", icon: <UserCheck className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <ShieldAlert className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <AdminOverview onTabChange={(tab: any) => setActiveTab(tab)} />;
      case "users": return <UserManagementDashboard />;
      case "courses": return <CourseManagementDashboard />;
      case "experience": return <AdminStudentPreview />;
      case "security": return <FraudAlertsDashboard />;
      case "settings": return <div className="p-10 bg-white rounded-3xl border border-gray-100">Settings Mock Content</div>;
      default: return null;
    }
  };

  return (
    <DashboardLayout userType="admin" userName="Audit Mode">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="relative bg-white/80 backdrop-blur-md rounded-[3rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/60 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/30">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 tracking-tight uppercase">
                Audit <span className="text-blue-600/80">Sandbox</span>
              </h1>
              <p className="text-sm text-gray-500 font-medium tracking-wide">
                Lighthouse Performance Testing Ground
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-gray-50/50 p-2 rounded-[2.5rem] border border-gray-100/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-6 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-lg scale-105 border border-gray-100"
                    : "text-gray-400 hover:text-gray-900"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
            <div className="w-px h-8 bg-gray-200/50 mx-2 hidden sm:block"></div>
            <button
              onClick={handleClearMock}
              className="flex items-center gap-3 px-8 py-4 bg-orange-500 text-white font-black rounded-[1.5rem] transition-all shadow-xl shadow-orange-500/20 hover:bg-orange-600 hover:scale-105 active:scale-95 text-[10px] uppercase tracking-widest"
              title="Clear Mock Session and Logout"
            >
              <span>Exit Audit Mode</span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
