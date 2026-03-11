"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Trash2,
  User,
  Award,
  CheckCircle,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "../components/common/DashboardLayout";
import AccountSettings from "../components/AccountSettings";
import ProfessorAcademicSummary from "../components/ProfessorAcademicSummary";
import { useToast } from "../components/common/ToastProvider";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../services/api";
import { determineDepartmentFromCourses } from "../utils/departmentUtils";

interface ProfileErrors {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  title?: string;
  dob?: string;
}

const initialProfile = {
  id: "",
  name: "",
  email: "",
  phone: "",
  dob: "",
  address: "",
  department: "",
  title: "",
  officeHours: "",
  researchInterests: "",
  notificationsEnabled: true,
  avatarUrl: null as string | null,
  emergencyContact: "",
  totalStudents: 500,
};

export default function ProfessorProfile() {
  const { user, isAuthenticated, checkAuthStatus } = useAuth();
  const {
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
  } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  // Local state for form editing
  const [editForm, setEditForm] = useState(initialProfile);

  const successBannerRef = useRef<HTMLDivElement>(null);

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

  const safe = <T,>(v: T, fallback: T): T =>
    v !== undefined && v !== null && v !== "" ? v : fallback;

  // Fetch Profile Data
  const { data: profile = initialProfile, isLoading: isProfileLoading } =
    useQuery({
      queryKey: ["professor-profile", user?.id],
      queryFn: async () => {
        if (!isAuthenticated || !user?.id) return initialProfile;

        const professorId =
          typeof user.id === "string" ? parseInt(user.id) : user.id;

        const [profileResponse, coursesResponse] = await Promise.all([
          apiClient.get("/api/users/profile"),
          apiClient
            .get("/api/courses", { params: { professorId } })
            .catch(() => ({ success: false, data: [] })),
        ]);

        let departmentName = "";
        if (
          coursesResponse.success &&
          Array.isArray(coursesResponse.data) &&
          coursesResponse.data.length > 0
        ) {
          departmentName = determineDepartmentFromCourses(coursesResponse.data);
        }

        if (profileResponse.success && profileResponse.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userData = ((profileResponse.data as any).user ||
            profileResponse.data) as any;
          return {
            id: user.universityId || "P20251001",
            name: userData.name || `${user.firstName} ${user.lastName}`,
            email: user.email || "",
            phone: safe(userData.phone, ""),
            dob: safe(userData.dob, ""),
            address: safe(
              userData.address,
              "Faculty Building, Room 205, Cairo University",
            ),
            department: departmentName || userData.department || "",
            title: safe(userData.title, "Associate Professor"),
            officeHours: safe(
              userData.officeHours,
              "Mon-Wed 10:00-12:00, Thu 14:00-16:00",
            ),
            researchInterests: safe(
              userData.researchInterests,
              "Machine Learning, Artificial Intelligence, Data Science",
            ),
            notificationsEnabled: userData.notificationsEnabled ?? true,
            avatarUrl: safe(userData.avatarUrl, null),
            emergencyContact: safe(userData.emergencyContact, ""),
            totalStudents: 500,
          };
        }

        // Fallback if profile fetch fails but we have user data
        return {
          ...initialProfile,
          id: user.universityId || "P20251001",
          name: `${user.firstName} ${user.lastName}`,
          email: user.email || "",
          department: departmentName,
        };
      },
      enabled: !!isAuthenticated && !!user?.id,
      staleTime: 5 * 60 * 1000,
    });

  // Fetch Academic Data
  const {
    data: academicData = {
      currentCourses: 0,
      totalStudents: 0,
      researchProjects: 0,
    },
  } = useQuery({
    queryKey: ["professor-academic-stats", user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !user?.id)
        return { currentCourses: 0, totalStudents: 0, researchProjects: 0 };

      const professorId =
        typeof user.id === "string" ? parseInt(user.id) : user.id;
      const coursesResponse = await apiClient.get("/api/courses", {
        params: { professorId },
      });

      if (coursesResponse.success && coursesResponse.data) {
        const courses = Array.isArray(coursesResponse.data)
          ? coursesResponse.data
          : [];
        const activeCourses = courses.filter(
          (c: { isActive?: boolean }) => c.isActive !== false,
        );

        const totalStudentsCount = courses.reduce(
          (
            sum: number,
            course: { enrolledStudents?: number; totalStudents?: number },
          ) => {
            return sum + (course.enrolledStudents || course.totalStudents || 0);
          },
          0,
        );

        return {
          currentCourses: activeCourses.length,
          totalStudents: totalStudentsCount,
          researchProjects: 0,
        };
      }
      return { currentCourses: 0, totalStudents: 0, researchProjects: 0 };
    },
    enabled: !!isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: typeof initialProfile) => {
      const profileData: Record<string, unknown> = { ...updatedProfile };
      if (avatarFile && avatarPreview) profileData.avatarUrl = avatarPreview;
      return await apiClient.put("/api/users/profile", profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professor-profile"] });
      // Refresh global auth state to sync header/sidebar
      if (checkAuthStatus) checkAuthStatus();
      setSaveStatus("success");
      setIsEditing(false);
      addToast("Profile updated successfully!", "success");
      setTimeout(() => successBannerRef.current?.focus(), 100);
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
    onError: () => {
      setSaveStatus("error");
      addToast("Failed to save profile. Please try again.", "error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
  });

  // Move edit state initialization to handleToggleEdit instead to avoid cascading renders
  // Remove the useEffect that was copying profile to editForm

  const handleToggleEdit = () => {
    if (isEditing) {
      setAvatarFile(null);
      setAvatarPreview(null);
      setErrors({});
      setEditForm(profile);
    } else {
      setEditForm(profile);
    }
    setIsEditing(!isEditing);
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAvatarChange = (file: File | null) => {
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }
    if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
      addToast("Please select a JPG or PNG image", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast("Image must be 2MB or smaller", "error");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleNotificationToggle = (checked: boolean) => {
    // Optimistic update could be done here, but for now we'll just update local state if editing
    // or trigger a mutation if not editing (omitted for brevity, assuming edit mode for all changes)
    if (isEditing) {
      setEditForm((prev) => ({ ...prev, notificationsEnabled: checked }));
    }
  };

  const validateForm = () => {
    const e: ProfileErrors = {};
    if (!editForm.name.trim()) e.name = "Name is required";
    if (!editForm.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email))
      e.email = "Valid email is required";

    // Make these optional since they might be empty in DB
    // if (!editForm.phone.trim()) e.phone = 'Phone number is required';
    // if (!editForm.department.trim()) e.department = 'Department is required';
    // if (!editForm.title.trim()) e.title = 'Academic title is required';

    if (Object.keys(e).length > 0) {
      console.warn("[ValidationErrors]", e);
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      addToast("Please fix the errors before saving", "warning");
      return;
    }
    updateProfileMutation.mutate(editForm);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    addToast(
      "Account deletion requested. This feature requires backend implementation.",
      "warning",
    );
  };

  const achievements = [];
  if (profile.department)
    achievements.push({ label: profile.department, color: "blue" });
  if (profile.title && profile.title.toLowerCase().includes("professor"))
    achievements.push({ label: profile.title, color: "purple" });
  if (profile.researchInterests) {
    const interests = profile.researchInterests.split(",").length;
    if (interests >= 3)
      achievements.push({
        label: `${interests} Research Areas`,
        color: "green",
      });
  }

  // Loading Skeleton
  if (isProfileLoading) {
    return (
      <DashboardLayout userName="Loading..." userType="professor">
        <div className="max-w-7xl mx-auto pb-12 animate-pulse">
          <div className="h-64 rounded-b-3xl bg-gray-200 dark:bg-gray-800 -mt-6 -mx-6 mb-20" />
          <div className="px-4 sm:px-6 lg:px-8 relative -mt-32">
            <div className="flex flex-col items-center lg:flex-row lg:items-end gap-6 mb-8">
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gray-300 dark:bg-gray-700 border-4 border-white dark:border-gray-900" />
              <div className="flex-1 space-y-4 text-center lg:text-left pt-4">
                <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded mx-auto lg:mx-0" />
                <div className="h-4 w-48 bg-gray-300 dark:bg-gray-700 rounded mx-auto lg:mx-0" />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const displayProfile = isEditing ? editForm : profile;

  return (
    <DashboardLayout
      userName={
        user ? `${user.firstName} ${user.lastName}` : displayProfile.name
      }
      userAvatar={avatarPreview || displayProfile.avatarUrl || undefined}
      userType="professor"
    >
      <div className="max-w-7xl mx-auto pb-12">
        {/* Cover Image Section */}
        <div className="relative h-64 rounded-b-3xl bg-gradient-to-r from-indigo-600 to-purple-700 overflow-hidden shadow-lg -mt-6 -mx-6 lg:-mx-8 mb-20">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

          <div className="absolute top-6 left-6 lg:left-8 z-10">
            <Link
              href="/professor-dashboard"
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-black/30"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
          </div>

          {isEditing && (
            <button className="absolute bottom-6 right-6 lg:right-8 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all border border-white/30">
              <Camera className="w-4 h-4" />
              <span className="text-sm font-medium">Change Cover</span>
            </button>
          )}
        </div>

        {/* Profile Header Content */}
        <div className="px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col items-center lg:flex-row lg:items-end gap-6 -mt-32 mb-8">
            <div className="relative group">
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 border-white dark:border-gray-900 shadow-xl overflow-hidden bg-white dark:bg-gray-800 relative z-10">
                {avatarPreview || displayProfile.avatarUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={avatarPreview || displayProfile.avatarUrl || ""}
                      alt={displayProfile.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-400 dark:text-gray-500">
                    <User className="w-16 h-16 lg:w-20 lg:h-20" />
                  </div>
                )}

                {isEditing && (
                  <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20">
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-xs font-medium">Change</span>
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
              <div className="absolute bottom-2 right-2 z-20 w-5 h-5 lg:w-6 lg:h-6 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            </div>

            <div className="flex-1 pt-2 lg:pt-0 lg:pb-4 w-full">
              <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-4 text-center lg:text-left">
                <div>
                  <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                    {displayProfile.name}
                  </h1>
                  <p className="text-base lg:text-lg text-gray-600 dark:text-gray-300 flex items-center justify-center lg:justify-start gap-2">
                    <Briefcase className="w-4 h-4" />
                    {displayProfile.title} •{" "}
                    {displayProfile.department || "Department not set"}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto justify-center">
                  {!isEditing ? (
                    <button
                      onClick={handleToggleEdit}
                      className="w-full lg:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 font-medium flex items-center justify-center gap-2"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                      <button
                        onClick={handleToggleEdit}
                        className="flex-1 lg:flex-none px-6 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                        className="flex-1 lg:flex-none px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 font-medium flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {updateProfileMutation.isPending
                          ? "Saving..."
                          : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {saveStatus === "success" && (
            <motion.div
              ref={successBannerRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-200 font-medium">
                Profile updated successfully!
              </p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Personal Info & Contact */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h3>

                <div className="space-y-6">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            handleFieldChange("name", e.target.value)
                          }
                          className={`w-full px-4 py-2 rounded-lg border ${errors.name ? "border-red-500" : "border-gray-200 dark:border-gray-700"} bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Academic Title
                        </label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) =>
                            handleFieldChange("title", e.target.value)
                          }
                          className={`w-full px-4 py-2 rounded-lg border ${errors.title ? "border-red-500" : "border-gray-200 dark:border-gray-700"} bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                        />
                        {errors.title && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.title}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          value={editForm.department}
                          onChange={(e) =>
                            handleFieldChange("department", e.target.value)
                          }
                          className={`w-full px-4 py-2 rounded-lg border ${errors.department ? "border-red-500" : "border-gray-200 dark:border-gray-700"} bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                        />
                        {errors.department && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.department}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Email Address
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {displayProfile.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Phone Number
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {displayProfile.phone || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Office Location
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {displayProfile.address || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Office Hours
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {displayProfile.officeHours || "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Achievements Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                  <Award className="w-5 h-5" />
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
                  {achievements.length === 0 && (
                    <p className="text-white/70 text-sm">
                      Complete your profile to earn badges!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Middle & Right Columns - Stats & Settings */}
            <div className="lg:col-span-2 space-y-8">
              <ProfessorAcademicSummary
                currentCourses={academicData.currentCourses}
                totalStudents={academicData.totalStudents}
                researchProjects={academicData.researchProjects}
              />

              {isEditing && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    Additional Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          handleFieldChange("email", e.target.value)
                        }
                        className={`w-full px-4 py-2 rounded-lg border ${errors.email ? "border-red-500" : "border-gray-200 dark:border-gray-700"} bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) =>
                          handleFieldChange("phone", e.target.value)
                        }
                        className={`w-full px-4 py-2 rounded-lg border ${errors.phone ? "border-red-500" : "border-gray-200 dark:border-gray-700"} bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Office Location
                      </label>
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) =>
                          handleFieldChange("address", e.target.value)
                        }
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Office Hours
                      </label>
                      <input
                        type="text"
                        value={editForm.officeHours}
                        onChange={(e) =>
                          handleFieldChange("officeHours", e.target.value)
                        }
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Research Interests
                      </label>
                      <textarea
                        value={editForm.researchInterests}
                        onChange={(e) =>
                          handleFieldChange("researchInterests", e.target.value)
                        }
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        placeholder="e.g. Machine Learning, Data Science..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                  Account Settings
                </h3>
                <AccountSettings
                  notificationsEnabled={displayProfile.notificationsEnabled}
                  onNotificationToggle={handleNotificationToggle}
                  userRole="PROFESSOR"
                />

                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-bold text-red-600 mb-4">
                    Danger Zone
                  </h4>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-sm font-medium border border-red-200 dark:border-red-800 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
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
    </DashboardLayout>
  );
}
