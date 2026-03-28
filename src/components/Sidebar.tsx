"use client";
import Link from "next/link";
import {
  Home,
  Calendar,
  UserCheck,
  Bot,
  User,
  BookOpen,
  Radio,
  LogOut,
  Layout
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "./common/Logo";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const role = user?.role?.toLowerCase() || "student";
  const dashboardPath = `/dashboard/${role}`;

  const menuItems = role === "professor" ? [
    { icon: Home, Tag: "Dashboard", path: dashboardPath },
    { icon: BookOpen, Tag: "My Courses", path: `${dashboardPath}/courses` },
    { icon: UserCheck, Tag: "Attendance", path: `${dashboardPath}/attendance` },
    { icon: Bot, Tag: "AI Assistant", path: `${dashboardPath}/chatbot` },
    { icon: User, Tag: "Profile", path: `${dashboardPath}/profile` },
  ] : [
    { icon: Home, Tag: "Dashboard", path: dashboardPath },
    { icon: Calendar, Tag: "My Schedule", path: `${dashboardPath}/schedule` },
    { icon: UserCheck, Tag: "Attendance", path: `${dashboardPath}/attendance` },
    { icon: Bot, Tag: "AI Assistant", path: `${dashboardPath}/ai-assistant` },
    { icon: User, Tag: "Profile", path: `${dashboardPath}/profile` },
  ];

  const bottomMenuItems = [
    { icon: Layout, Tag: "Admin Portal", path: "/dashboard/admin", hidden: role !== "admin" },
  ].filter(item => !item.hidden);

  return (
    <aside
      className={`w-64 bg-white dark:bg-cardDark border-r border-gray-200 dark:border-gray-700 flex flex-col ${className}`}
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <Logo className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-textDark leading-tight">
              Smart Campus
            </h1>
            <p className="text-sm text-gray-600 dark:text-mutedDark">
              {role.charAt(0).toUpperCase() + role.slice(1)} Portal
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path !== dashboardPath && pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                  : "text-gray-700 dark:text-textDark hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
              <span className="font-medium">{item.Tag}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-6 border-t border-gray-200 dark:border-gray-700 space-y-1">
        {bottomMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-textDark hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="font-medium">{item.Tag}</span>
            </Link>
          );
        })}
        
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200 mt-2"
        >
          <LogOut className="w-5 h-5" strokeWidth={2} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
