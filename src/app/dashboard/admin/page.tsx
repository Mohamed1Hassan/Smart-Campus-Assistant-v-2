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
  Settings,
  BookOpen,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "courses" | "experience" | "security" | "settings"
  >("overview");

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Area */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
              Admin Control Center
            </h1>
            <p className="text-gray-500">
              Supervise and configure the Smart Campus ecosystem.
            </p>
          </div>
          <div className="flex gap-2 p-1.5 bg-gray-50 rounded-xl border border-gray-100 overflow-x-auto max-w-full">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as
                      | "overview"
                      | "users"
                      | "courses"
                      | "security"
                      | "settings",
                  )
                }
                icon={tab.icon}
                label={tab.label}
              />
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
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
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
        active
          ? "bg-white text-blue-600 shadow-sm border border-gray-200/50"
          : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50 transparent border border-transparent"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
