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
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "./common/Logo";

interface SidebarProps {
  className?: string;
}

const menuItems = [
  { icon: Home, Tag: "Dashboard", path: "/student-dashboard" },
  { icon: Calendar, Tag: "My Schedule", path: "/schedule" },
  { icon: UserCheck, Tag: "Attendance", path: "/attendance" },
  { icon: Bot, Tag: "AI Assistant", path: "/student-ai-assistant" },
  { icon: User, Tag: "Profile", path: "/profile" },
];

const bottomMenuItems = [
  { icon: BookOpen, Tag: "Reshbr.", path: "/reshbr" },
  { icon: Radio, Tag: "OVVP", path: "/ovvp" },
];

export default function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();

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
              Assistant
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
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
      </div>
    </aside>
  );
}
