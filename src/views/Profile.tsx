"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { m, LazyMotion, domAnimation, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  User,
  Camera,
  Save,
  Trash2,
  BookOpen,
  Award,
  ArrowLeft,
  CheckCircle,
  Edit2,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../components/common/DashboardLayout";
import ProfileForm from "../components/ProfileForm";
import AccountSettings from "../components/AccountSettings";
import AcademicSummary from "../components/AcademicSummary";
const FaceIDRegister = dynamic(() => import("../components/profile/FaceIDRegister"), {
  ssr: false,
  loading: () => <div className="h-48 w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl" />
});
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/common/ToastProvider";
import { apiClient } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import { useFormValidation } from "../hooks/useFormValidation";
import { validators } from "../utils/validation.frontend";
import { MAJOR_NAMES } from "../utils/departmentUtils";

const initialProfile = {
  id: "",
  name: "",
  email: "",
  phone: "",
  dob: "",
  address: "",
  major: "",
  attendancePercent: 0,
  gpa: 0,
  notificationsEnabled: true,
  avatarUrl: null as string | null,
  emergencyContact: "",
  faceDescriptor: undefined as unknown,
};

interface UserProfileResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
  phone?: string;
  dob?: string;
  address?: string;
  major?: string;
  attendancePercent?: number;
  gpa?: number;
  notificationsEnabled?: boolean;
  avatarUrl?: string;
  emergencyContact?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  faceDescriptor?: any;
}

const PROFILE_VALIDATION_RULES = {
  name: [
    validators.required("Full name is required"),
    validators.minLength(2, "Name must be at least 2 characters"),
  ],
  email: [validators.required("Email is required"), validators.email()],
  phone: [validators.required("Phone number is required"), validators.phone()],
  dob: [validators.required("Date of birth is required"), validators.date()],
  address: [
    validators.required("Address is required"),
    validators.minLength(10, "Please provide a complete address"),
  ],
  emergencyContact: [
    validators.required("Emergency contact is required"),
    validators.minLength(5, "Please provide full contact information"),
  ],
};

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const {
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
  } = useToast();
  const queryClient = useQueryClient();

  // Initialize profile from AuthContext immediately
  const authProfileFallback = useMemo(() => {
    if (!user) return initialProfile;
    return {
      id: user.universityId || "",
      name: `${user.firstName} ${user.lastName}`,
      email: user.email || "",
      phone: "",
      dob: "",
      address: "",
      major: "",
      attendancePercent: 0,
      gpa: 0,
      notificationsEnabled: true,
      avatarUrl: user.avatarUrl || null,
      emergencyContact: "",
      faceDescriptor: undefined,
    };
  }, [user]);

  const [isEditing, setIsEditing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [originalProfile, setOriginalProfile] = useState(authProfileFallback);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  void lastUpdated; // used for tracking only

  const successBannerRef = useRef<HTMLDivElement>(null);

  // Full profile state
  const [fullProfile, setFullProfile] = useState(authProfileFallback);

  // Academic data state
  const [academicData, setAcademicData] = useState({
    currentCourses: 0,
    upcomingExams: 0,
  });

  // Form validation
  const {
    values: formValues,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValue,
  } = useFormValidation({
    initialValues: {
      name: authProfileFallback.name,
      email: authProfileFallback.email,
      phone: authProfileFallback.phone || "",
      dob: authProfileFallback.dob || "",
      address: authProfileFallback.address || "",
      emergencyContact: authProfileFallback.emergencyContact || "",
    },
    validationRules: PROFILE_VALIDATION_RULES,
    onSubmit: async (values) => {
      setIsLoading(true);
      setSaveStatus("idle");
      try {
        const updateData: {
          name: string;
          email: string;
          phone: string;
          dob: string;
          address: string;
          emergencyContact: string;
          avatarUrl?: string;
        } = {
          name: values.name,
          email: values.email,
          phone: values.phone,
          dob: values.dob,
          address: values.address,
          emergencyContact: values.emergencyContact,
        };

        if (avatarFile && avatarPreview) {
          updateData.avatarUrl = avatarPreview;
        }

        const response = await apiClient.put("/api/users/profile", updateData);

        if (response.success) {
          setSaveStatus("success");
          setLastUpdated(new Date());
          addToast("Profile updated successfully!", "success");
          const updatedProfile = {
            ...fullProfile,
            ...values,
            avatarUrl: avatarPreview || fullProfile.avatarUrl,
          };
          setFullProfile(updatedProfile);
          setOriginalProfile(updatedProfile);
          setIsEditing(false);

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["student-profile"] });
        } else {
          throw new Error(response.message || "Failed to update profile");
        }
      } catch (error: unknown) {
        setSaveStatus("error");
        addToast(
          error instanceof Error ? error.message : "Failed to update profile",
          "error",
        );
      } finally {
        setIsLoading(false);
      }
    },
  });

  const addToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) => {
    switch (type) {
      case "success":
        showSuccess(message, { showProgress: true });
        break;
      case "error":
        showError(message, { showProgress: true });
        break;
      case "warning":
        showWarning(message, { showProgress: true });
        break;
      case "info":
        showInfo(message, { showProgress: true });
        break;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safe = (v: unknown, fallback: any) =>
    v !== undefined && v !== null && v !== "" ? v : fallback;

  // Fetch profile data using useQuery
  const { data: profileData } = useQuery({
    queryKey: ["student-profile", user?.universityId],
    queryFn: async () => {
      if (!isAuthenticated || !user?.universityId) return null;
      const response =
        await apiClient.get<UserProfileResponse>("/api/users/profile");
      if (response.success && response.data) {
        const userData = response.data.user || response.data;
        const currentAuthFallback = user
          ? {
              id: user.universityId,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              phone: "",
              dob: "",
              address: "",
              major: "",
              attendancePercent: 0,
              gpa: 0,
              notificationsEnabled: true,
              avatarUrl: user.avatarUrl || null,
              emergencyContact: "",
            }
          : initialProfile;

        return {
          id: currentAuthFallback.id,
          name: currentAuthFallback.name,
          email: currentAuthFallback.email,
          phone: safe(userData.phone, currentAuthFallback.phone),
          dob: safe(userData.dob, currentAuthFallback.dob),
          address: safe(userData.address, currentAuthFallback.address),
          major: safe(userData.major, currentAuthFallback.major),
          attendancePercent: safe(
            userData.attendancePercent,
            currentAuthFallback.attendancePercent,
          ),
          gpa: safe(userData.gpa, currentAuthFallback.gpa),
          notificationsEnabled:
            userData.notificationsEnabled ??
            currentAuthFallback.notificationsEnabled,
          avatarUrl: safe(userData.avatarUrl, currentAuthFallback.avatarUrl),
          emergencyContact: safe(
            userData.emergencyContact,
            currentAuthFallback.emergencyContact,
          ),
          faceDescriptor: userData.faceDescriptor || undefined,
        };
      }
      return null;
    },
    enabled: !!isAuthenticated && !!user?.universityId,
    staleTime: 5 * 60 * 1000,
  });

  // Sync profile data with local state
  useEffect(() => {
    if (profileData) {
      setFullProfile(profileData);
      setValue("name", profileData.name);
      setValue("email", profileData.email);
      setValue("phone", profileData.phone || "");
      setValue("dob", profileData.dob || "");
      setValue("address", profileData.address || "");
      setValue("emergencyContact", profileData.emergencyContact || "");
      setOriginalProfile(profileData);
    }
  }, [profileData, setValue]);

  // Fetch academic data using useQuery
  const { data: fetchedAcademicData } = useQuery({
    queryKey: ["student-academic-data", user?.universityId],
    queryFn: async () => {
      if (!isAuthenticated || !user?.universityId)
        return { currentCourses: 0, upcomingExams: 0 };

      try {
         
        const coursesResponse = await apiClient.get<{
          courses: unknown[];
          enrollments: unknown[];
        }>("/api/courses/student/enrolled");
        if (coursesResponse.success && coursesResponse.data) {
          const enrolledCourses = Array.isArray(coursesResponse.data)
            ? coursesResponse.data
            : coursesResponse.data.courses ||
              coursesResponse.data.enrollments ||
              [];

          return {
            currentCourses: enrolledCourses.length,
            upcomingExams: 0, // TODO: Add upcoming exams API endpoint
          };
        }
      } catch (error) {
        console.error("Error fetching academic data:", error);
      }
      return { currentCourses: 0, upcomingExams: 0 };
    },
    enabled: !!isAuthenticated && !!user?.universityId,
    staleTime: 5 * 60 * 1000,
  });

  // Sync academic data
  useEffect(() => {
    if (fetchedAcademicData) {
      setAcademicData(fetchedAcademicData);
    }
  }, [fetchedAcademicData]);

  const handleToggleEdit = () => {
    if (isEditing) {
      reset();
      setAvatarFile(null);
      setAvatarPreview(null);
      setSaveStatus("idle");
    }
    setIsEditing(!isEditing);
  };

  const handleAvatarChange = (file: File | null) => {
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setFullProfile((prev) => ({ ...prev, notificationsEnabled: enabled }));
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    addToast(
      "Account deletion requested. This feature requires backend implementation.",
      "warning",
    );
  };

  const achievements = [
    {
      label: "Dean's List",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    {
      label: "Perfect Attendance",
      color: "bg-green-100 text-green-800 border-green-200",
    },
    {
      label: "Class Representative",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
  ];

  return (
    <DashboardLayout
      userName={fullProfile.name}
      userAvatar={avatarPreview || fullProfile.avatarUrl || undefined}
      userType="student"
    >
      <LazyMotion features={domAnimation}>
      <div className="max-w-7xl mx-auto pb-12 relative z-0">
        {/* Cover Image Section */}
        <div className="relative h-48 sm:h-72 rounded-b-[2.5rem] lg:rounded-b-[3rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 overflow-hidden shadow-2xl -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 mb-20 sm:mb-24">
          <div className="absolute inset-0 z-0">
            <Image src="https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-1.2.1&auto=format&fit=crop&w=1024&q=60" alt="Profile Cover" fill priority className="object-cover opacity-30 mix-blend-overlay" sizes="100vw" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

          <div className="absolute top-8 left-4 sm:left-6 lg:left-8 z-10">
            <Link
              href="/dashboard/student"
              className="flex items-center gap-2 text-white hover:text-white transition-all bg-black/30 backdrop-blur-md border border-white/20 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-2xl hover:bg-black/40 hover:-translate-y-0.5 text-sm sm:text-base shadow-lg"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-bold">Back to Dashboard</span>
            </Link>
          </div>

          {isEditing && (
            <button className="absolute bottom-6 right-4 sm:bottom-8 sm:right-8 lg:right-10 bg-white/20 backdrop-blur-xl hover:bg-white/30 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-[1.5rem] flex items-center gap-2 transition-all border border-white/40 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-xs sm:text-sm">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-bold tracking-wide">Change Cover</span>
            </button>
          )}
        </div>

        {/* Profile Header Content */}
        <div className="px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="flex flex-col lg:flex-row items-center lg:items-end gap-5 sm:gap-8 -mt-32 sm:-mt-40 mb-10 text-center lg:text-left">
            <div className="relative group">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-[2.5rem] ring-4 ring-white/50 dark:ring-gray-800/50 shadow-2xl overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl relative z-10 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-2">
                {avatarPreview || fullProfile.avatarUrl ? (
                  <Image
                    src={avatarPreview || fullProfile.avatarUrl || ""}
                    alt={fullProfile.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/60 dark:to-purple-900/60 text-indigo-500 dark:text-indigo-300">
                    <User className="w-16 h-16 sm:w-20 sm:h-20" />
                  </div>
                )}

                {isEditing && (
                  <label className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20">
                    <Camera className="w-8 h-8 sm:w-10 sm:h-10 mb-2" />
                    <span className="text-xs sm:text-sm font-bold tracking-wider uppercase">
                      Change Photo
                    </span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      className="hidden"
                      onChange={(e) =>
                        handleAvatarChange(e.target.files?.[0] || null)
                      }
                    />
                  </label>
                )}
              </div>
              <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-20 w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 ring-4 ring-white dark:ring-gray-900 rounded-full shadow-lg">
                <div className="w-full h-full rounded-full animate-ping bg-emerald-400 opacity-75"></div>
              </div>
            </div>

            <div className="flex-1 pt-4 lg:pt-0 lg:pb-6 w-full">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-2 tracking-tight">
                    {fullProfile.name}
                  </h1>
                  <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 flex items-center justify-center lg:justify-start gap-2">
                    <BookOpen className="w-4 h-4" />
                    {fullProfile.major
                      ? MAJOR_NAMES[fullProfile.major] || fullProfile.major
                      : "Major not set"}{" "}
                    • ID: {fullProfile.id}
                  </p>
                </div>

                <div className="flex items-center justify-center lg:justify-end gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                  {!isEditing ? (
                    <button
                      onClick={handleToggleEdit}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl sm:rounded-[1.5rem] hover:from-indigo-500 hover:to-indigo-600 transition-all shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1 font-bold flex items-center justify-center gap-2.5"
                    >
                      <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={handleToggleEdit}
                        className="flex-1 sm:flex-none px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-white dark:hover:bg-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => handleSubmit(e)}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 font-bold flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          <AnimatePresence>
            {saveStatus === "success" && (
              <m.div
                ref={successBannerRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-green-800 dark:text-green-200 font-medium">
                  Profile updated successfully!
                </p>
              </m.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Personal Info & Achievements */}
            <div className="space-y-6 sm:space-y-8">
              <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-white/50 dark:border-gray-700/50 p-6 sm:p-8 transition-all hover:shadow-2xl">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl">
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Personal Information
                  </h2>
                </div>
                <ProfileForm
                  profile={{
                    name: formValues.name,
                    email: formValues.email,
                    phone: formValues.phone,
                    dob: formValues.dob,
                    address: formValues.address,
                    emergencyContact: formValues.emergencyContact,
                  }}
                  isEditing={isEditing}
                  onChange={handleChange}
                  errors={errors}
                  touched={touched}
                  onBlur={handleBlur}
                  chromeless
                />
              </div>

              {/* Achievements Card */}
              <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-[2rem] shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden group hover:shadow-indigo-500/20 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/30 transition-all duration-500"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/30 rounded-full -ml-16 -mb-16 blur-2xl group-hover:bg-indigo-400/40 transition-all duration-500"></div>

                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10 tracking-tight">
                  <Award className="w-6 h-6" />
                  Achievements
                </h3>

                <div className="flex flex-wrap gap-2 relative z-10">
                  {achievements.map((achievement, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium border border-white/10"
                    >
                      {achievement.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle & Right Columns - Stats & Settings */}
            <div className="lg:col-span-2 space-y-8">
              <AcademicSummary
                currentCourses={academicData.currentCourses}
                upcomingExams={academicData.upcomingExams}
              />

              <FaceIDRegister
                isRegistered={!!fullProfile.faceDescriptor}
                onComplete={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["student-profile"],
                  })
                }
              />

              <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-white/50 dark:border-gray-700/50 p-6 sm:p-8 transition-all hover:shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight flex items-center gap-3">
                  Account Settings
                </h3>
                <AccountSettings
                  notificationsEnabled={fullProfile.notificationsEnabled}
                  onNotificationToggle={handleNotificationToggle}
                  userRole="STUDENT"
                  chromeless={true}
                />

                <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-red-500 dark:text-red-400 mb-4 uppercase tracking-wider">
                    Danger Zone
                  </h4>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-white/50 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-bold border border-red-200/50 dark:border-red-800/50 flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        confirmText="Delete Account"
        cancelText="Cancel"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />
          </LazyMotion>
    </DashboardLayout>
  );
}
