"use client";
import React from "react";
import { Button } from "../../ui/button";

import {
  Plus,
  Settings,
  Download,
  RefreshCw,
  Bell,
  Shield,
  Users,
  MapPin,
  Clock,
  Camera,
  Smartphone,
  AlertTriangle,
  BarChart3,
  Send,
} from "lucide-react";

interface QuickActionsProps {
  onCreateSession: () => void;
  onExportData: (type: string) => void;
}

export function QuickActions({
  onCreateSession,
  onExportData,
}: QuickActionsProps) {
  const actions = [
    {
      id: "create-session",
      title: "Create Session",
      description: "Start a new attendance session",
      icon: Plus,
      color: "bg-blue-500",
      onClick: onCreateSession,
    },
    {
      id: "settings",
      title: "Settings",
      description: "Configure security settings",
      icon: Settings,
      color: "bg-gray-500",
      onClick: () => console.log("Settings clicked"),
    },
    {
      id: "export-attendance",
      title: "Export Attendance",
      description: "Download attendance FileTexts",
      icon: Download,
      color: "bg-green-500",
      onClick: () => onExportData("attendance"),
    },
    {
      id: "export-security",
      title: "Export Security",
      description: "Download security FileTexts",
      icon: Shield,
      color: "bg-red-500",
      onClick: () => onExportData("security"),
    },
    {
      id: "refresh-data",
      title: "Refresh Data",
      description: "Update dashboard data",
      icon: RefreshCw,
      color: "bg-purple-500",
      onClick: () => console.log("Refresh clicked"),
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Manage notifications",
      icon: Bell,
      color: "bg-yellow-500",
      onClick: () => console.log("Notifications clicked"),
    },
  ];

  const quickStats = [
    {
      title: "Active Sessions",
      value: "2",
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Total Students",
      value: "75",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Fraud Alerts",
      value: "3",
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      title: "Success Rate",
      value: "94.2%",
      icon: BarChart3,
      color: "text-purple-600",
    },
  ];

  const recentActions = [
    {
      action: "Session created",
      details: "CS 101 - Data Structures",
      time: "2 minutes ago",
      icon: Plus,
      color: "text-green-600",
    },
    {
      action: "Fraud alert resolved",
      details: "Location spoofing - John Doe",
      time: "15 minutes ago",
      icon: Shield,
      color: "text-blue-600",
    },
    {
      action: "FileText exported",
      details: "Attendance FileText - Week 1",
      time: "1 hour ago",
      icon: Download,
      color: "text-purple-600",
    },
    {
      action: "Settings updated",
      details: "Security settings modified",
      time: "2 hours ago",
      icon: Settings,
      color: "text-gray-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            className="flex items-center space-x-3 p-3 border rounded-lg"
          >
            <div className={`p-2 rounded-full bg-gray-100`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div>
              <div className="text-sm font-medium">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            className="h-auto p-4 flex flex-col items-start space-y-2"
            onClick={action.onClick}
          >
            <div className="flex items-center space-x-2 w-full">
              <div className={`p-1 rounded ${action.color}`}>
                <action.icon className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium">{action.title}</span>
            </div>
            <span className="text-xs text-muted-foreground text-left">
              {action.description}
            </span>
          </Button>
        ))}
      </div>

      {/* Recent Actions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Recent Actions</h4>
        <div className="space-y-2">
          {recentActions.map((item, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-2 border rounded"
            >
              <div className="p-1 rounded-full bg-gray-100">
                <item.icon className={`h-3 w-3 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{item.action}</div>
                <div className="text-xs text-muted-foreground">
                  {item.details}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{item.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Status */}
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Security Status
          </span>
        </div>
        <div className="text-xs text-green-700 space-y-1">
          <p>锟?All security systems operational</p>
          <p>锟?Fraud detection active</p>
          <p>锟?Location verification enabled</p>
          <p>锟?Device fingerprinting active</p>
        </div>
      </div>

      {/* Quick Tools */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Quick Tools</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="justify-start">
            <MapPin className="h-4 w-4 mr-2" />
            Location Settings
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            <Clock className="h-4 w-4 mr-2" />
            Time Settings
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            <Camera className="h-4 w-4 mr-2" />
            Photo Settings
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            <Smartphone className="h-4 w-4 mr-2" />
            Device Settings
          </Button>
        </div>
      </div>

      {/* Emergency Actions */}
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">
            Emergency Actions
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="destructive" size="sm" className="justify-start">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency Square
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start text-red-600 border-red-200"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Alert
          </Button>
        </div>
      </div>
    </div>
  );
}
