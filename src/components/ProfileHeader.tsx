"use client";
import { Edit2, TrendingUp, Award, Building, Users } from "lucide-react";
import AvatarUploader from "./AvatarUploader";

interface ProfileHeaderProps {
  profile: {
    id: string;
    name: string;
    major?: string;
    department?: string;
    title?: string;
    attendancePercent?: number;
    gpa?: number;
    totalStudents?: number;
    avatarUrl: string | null;
  };
  isEditing: boolean;
  onToggleEdit: () => void;
  onAvatarChange: (file: File | null) => void;
  userType?: "student" | "professor";
  avatarPreview?: string | null;
}

export default function ProfileHeader({
  profile,
  isEditing,
  onToggleEdit,
  onAvatarChange,
  userType = "student",
  avatarPreview,
}: ProfileHeaderProps) {
  const DEV = process.env.NODE_ENV === "development";

  if (DEV)
    console.log("ProfileHeader - profile data:", {
      attendancePercent: profile.attendancePercent,
      gpa: profile.gpa,
      userType,
    });

  return (
    <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Simple top strip (matches original component design) */}
      <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-700" />

      <div className="px-8 pb-8">
        <div className="flex items-end justify-between -mt-16 mb-6">
          <AvatarUploader
            currentAvatar={profile.avatarUrl}
            userName={profile.name}
            onAvatarChange={onAvatarChange}
            isEditing={isEditing}
            preview={avatarPreview}
          />

          <button
            onClick={onToggleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            aria-label={isEditing ? "Cancel editing" : "Edit profile"}
          >
            <Edit2 className="w-4 h-4" />
            <span className="font-medium">
              {isEditing ? "Cancel" : "Edit Profile"}
            </span>
          </button>
        </div>

        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-textDark">
            {profile.name}
          </h1>
          <p className="text-gray-600 dark:text-mutedDark text-lg">
            {userType === "student" ? "Student ID" : "Professor ID"}:{" "}
            {profile.id}
          </p>
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            {userType === "student"
              ? profile.major
              : `${profile.title}${profile.department ? ` - ${profile.department}` : ""}`}
          </p>
          {DEV && userType === "professor" && (
            <p className="text-xs text-gray-400 mt-1">
              Debug: department = &quot;{profile.department || "(empty)"}&quot;
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {userType === "student" ? (
            <>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-gray-600 dark:text-mutedDark mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Attendance Rate</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-textDark">
                  {profile.attendancePercent}%
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-gray-600 dark:text-mutedDark mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-sm font-medium">Current GPA</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-textDark">
                  {profile.gpa?.toFixed(2)}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-gray-600 dark:text-mutedDark mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Active
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-gray-600 dark:text-mutedDark mb-1">
                  <Building className="w-4 h-4" />
                  <span className="text-sm font-medium">Department</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-textDark">
                  {profile.department}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-gray-600 dark:text-mutedDark mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Students</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-textDark">
                  {profile.totalStudents}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-gray-600 dark:text-mutedDark mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Active
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
