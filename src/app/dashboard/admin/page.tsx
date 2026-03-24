"use client";
import React, { useState } from "react";
import DashboardLayout from "@/components/common/DashboardLayout";
import AdminSemesterManager from "@/components/common/AdminSemesterManager";
import AdminOverview from "@/components/admin/AdminOverview";
import UserManagementDashboard from "@/components/admin/UserManagementDashboard";
import FraudAlertsDashboard from "@/components/admin/FraudAlertsDashboard";
import CourseManagementDashboard from "@/components/admin/CourseManagementDashboard";
import AdminStudentPreview from "@/components/admin/AdminStudentPreview";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShieldAlert,
  Users,
  LayoutDashboard,
  LayoutGrid,
  Settings,
  BookOpen,
  UserCheck,
  Monitor,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLogout } from "@/hooks/useLogout";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "courses" | "experience" | "security" | "settings"
  >("overview");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { logout, isLoading: isLogoutLoading } = useLogout();

  // Protect Admin Dashboard from direct access without secret keyword
  React.useEffect(() => {
    if (isLoading) return;

    // 1. Check if user is actually an admin
    if (user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    // 2. Check for the unlock cookie or localStorage (backup)
    const cookieUnlocked = document.cookie
      .split("; ")
      .find((row) => row.startsWith("isAdminUnlocked="));
    
    const storageUnlocked = localStorage.getItem("isAdminUnlocked") === "true";

    if (!cookieUnlocked && !storageUnlocked) {
      console.log("[AdminDashboard] Access restricted: Secret keyword not provided");
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleLogoutClick = () => setShowLogoutModal(true);

  const handleLogoutConfirm = async () => {
    // Clear admin-specific unlock state
    localStorage.removeItem("isAdminUnlocked");
    document.cookie = "isAdminUnlocked=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    const success = await logout();
    if (success) {
      setShowToast(true);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => setShowLogoutModal(false);

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { id: "courses", label: "Courses", icon: <BookOpen className="w-4 h-4" /> },
    {
      id: "experience",
      label: "Student Experience",
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: "security",
      label: "Security",
      icon: <ShieldAlert className="w-4 h-4" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <AdminOverview
            onTabChange={(
              tab: "users" | "courses" | "experience" | "security" | "settings",
            ) => setActiveTab(tab)}
          />
        );
      case "users":
        return <UserManagementDashboard />;
      case "courses":
        return <CourseManagementDashboard />;
      case "experience":
        return <AdminStudentPreview />;
      case "security":
        return <FraudAlertsDashboard />;
      case "settings":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                System Configuration
              </h2>
              <p className="text-gray-500 mb-6">
                Manage core university settings and academic terms.
              </p>
              <AdminSemesterManager />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      userType="admin"
      userName={user ? `${user.firstName} ${user.lastName}` : "Administrator"}
    >
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Premium Admin Header */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative bg-white/80 backdrop-blur-md rounded-[3rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/60 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 tracking-tight uppercase">
                  Admin <span className="text-blue-600/80">Control</span> Center
                </h1>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100/50">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Central Authority
                  </span>
                  <p className="text-sm text-gray-500 font-medium tracking-wide">
                    Supervising the Smart Campus ecosystem
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-gray-50/50 p-2 rounded-[2.5rem] border border-gray-100/50 backdrop-blur-sm">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  active={activeTab === tab.id}
                  onClick={() =>
                    setActiveTab(tab.id as any)
                  }
                  icon={tab.icon}
                  label={tab.label}
                />
              ))}
              <div className="w-px h-8 bg-gray-200/50 mx-2 hidden sm:block"></div>
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-3 px-8 py-4 bg-red-500 text-white font-black rounded-[1.5rem] transition-all shadow-xl shadow-red-500/20 hover:bg-red-600 hover:scale-105 active:scale-95 text-[10px] uppercase tracking-widest"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -30 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <ConfirmModal
        isOpen={showLogoutModal}
        onCancel={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out of the Admin Control Center?"
        confirmText="Logout"
        cancelText="Cancel"
        isLoading={isLogoutLoading}
      />

      {showToast && (
        <Toast
          message="Logged out successfully"
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </DashboardLayout>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
        active
          ? "bg-white text-blue-600 shadow-[0_10px_25px_rgba(0,0,0,0.08)] border border-gray-100 scale-105 z-10"
          : "text-gray-400 hover:text-gray-900 hover:bg-white/50 border border-transparent"
      }`}
    >
      <span className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
