import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import {
  Layout,
  Clock,
  MapPin,
  Shield,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import DashboardLayout from "../components/common/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { useAttendanceSessions } from "../hooks/useAttendanceSessions";
import { apiClient } from "../services/api";
import { useToast } from "../components/common/ToastProvider";
import { Activity, MapPin as MapPinIcon } from "lucide-react";


// Dynamically import heavy components
const ScheduleStep = dynamic(() => import("../components/professor/attendance/ScheduleStep"), { ssr: false });
const LocationStep = dynamic(() => import("../components/professor/attendance/LocationStep"), { ssr: false });
const SecurityStep = dynamic(() => import("../components/professor/attendance/SecurityStep"), { ssr: false });
const AttendanceLivePreview = dynamic(() => import("../components/professor/attendance/AttendanceLivePreview"), { ssr: false });

interface Course {
  id: number;
  courseName: string;
  courseCode: string;
  enrollments?: Array<{ studentId: number }>;
}

interface FormErrors {
  courseId?: string;
  title?: string;
  description?: string;
  startTime?: string;
  duration?: string;
  locationName?: string;
  latitude?: string;
  longitude?: string;
  radius?: string;
  gracePeriod?: string;
  maxAttempts?: string;
  riskThreshold?: string;
  [key: string]: string | undefined;
}

// Hook to detect desktop screens for conditional rendering
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isDesktop;
};

export default function ProfessorAttendanceCreate() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.id as string;
  const isEditMode = !!sessionId;
  const isDesktop = useIsDesktop();

  const { success, error: showError, info, warning: showWarning } = useToast();

  const {
    createSession,
    updateSession,
    loadSessionById,
    selectedSession,
    isCreating,
    isUpdating,
  } = useAttendanceSessions();

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  void isLoadingCourses;

  // Form state
  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    description: "",
    startTime: "",
    duration: 2,
    location: {
      name: "",
      latitude: "",
      longitude: "",
      radius: 50,
    },
    security: {
      isLocationRequired: true,
      isPhotoRequired: false,
      isDeviceCheckRequired: true,
      fraudDetectionEnabled: true,
      gracePeriod: 5,
      maxAttempts: 3,
      riskThreshold: 70,
    },
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [currentStep, setCurrentStep] = useState(0);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.id) return;
      setIsLoadingCourses(true);
      try {
        const professorId =
          typeof user.id === "string" ? parseInt(user.id) : user.id;
        const response = await apiClient.get<Course[]>("/api/courses", {
          params: { professorId },
        });
        if (response.success && Array.isArray(response.data)) {
          setCourses(
            response.data.map((c: Course) => ({
              id: Number(c.id),
              courseName: String(c.courseName).trim(),
              courseCode: String(c.courseCode).trim(),
              enrollments: c.enrollments || [],
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setIsLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [user?.id]);

  // Fetch session data if in edit mode
  useEffect(() => {
    if (isEditMode && sessionId) {
      loadSessionById(sessionId);
    }
  }, [isEditMode, sessionId, loadSessionById]);

  // Populate form with session data
  useEffect(() => {
    if (isEditMode && selectedSession) {
      const start = new Date(selectedSession.startTime);
      const end = new Date(selectedSession.endTime);
      const durationHours =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      const formattedStart = new Date(
        start.getTime() - start.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16);

      setFormData({
        courseId: String(selectedSession.courseId),
        title: selectedSession.title,
        description: selectedSession.description || "",
        startTime: formattedStart,
        duration: durationHours,
        location: {
          name: selectedSession.location?.name || "",
          latitude: String(selectedSession.location?.latitude || ""),
          longitude: String(selectedSession.location?.longitude || ""),
          radius: selectedSession.location?.radius || 50,
        },
        security: {
          isLocationRequired:
            selectedSession.security?.isLocationRequired ?? true,
          isPhotoRequired: selectedSession.security?.isPhotoRequired ?? false,
          isDeviceCheckRequired:
            selectedSession.security?.isDeviceCheckRequired ?? true,
          fraudDetectionEnabled:
            selectedSession.security?.fraudDetectionEnabled ?? true,
          gracePeriod: selectedSession.security?.gracePeriod ?? 5,
          maxAttempts: selectedSession.security?.maxAttempts ?? 3,
          riskThreshold: selectedSession.security?.riskThreshold ?? 70,
        },
      });
    }
  }, [isEditMode, selectedSession]);

  const validateField = useCallback(
    (field: string, value: unknown): string | undefined => {
      switch (field) {
        case "courseId":
          return !value ? "Course is required" : undefined;
        case "title":
          if (!value) return "Title is required";
          if ((value as string).length < 3) return "Title too short";
          return undefined;
        case "startTime":
          if (!value) return "Start time is required";
          if (new Date(value as string) <= new Date()) return "Must be in future";
          return undefined;
        case "duration":
          return !value ? "Duration is required" : undefined;
        default:
          return undefined;
      }
    },
    [],
  );

  const handleInputChange = useCallback((field: string, value: unknown) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  }, [touched, validateField]);

  const [permissions, setPermissions] = useState({
    location: "prompt" as PermissionState,
  });

  const checkDeviceCapabilities = useCallback(async () => {
    // Check Location Permission
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });
        setPermissions((prev) => ({ ...prev, location: result.state }));
        result.onchange = () => {
          setPermissions((prev) => ({ ...prev, location: result.state }));
        };
      } catch (error) {
        console.warn("Location permission query failed:", error);
      }
    } else {
      // Fallback
      navigator.geolocation.getCurrentPosition(
        () => setPermissions(prev => ({ ...prev, location: "granted" })),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setPermissions(prev => ({ ...prev, location: "denied" }));
          }
        },
        { timeout: 2000 }
      );
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPermissions(prev => ({ ...prev, location: "granted" }));
          handleInputChange("location.latitude", pos.coords.latitude);
          handleInputChange("location.longitude", pos.coords.longitude);
          success("Location access granted and coordinates updated.");
          resolve();
        },
        (err) => {
          console.warn("Location request failed:", err);
          setPermissions(prev => ({ ...prev, location: "denied" }));
          showError("Location access denied.");
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [success, showError, handleInputChange]);

  useEffect(() => {
    checkDeviceCapabilities();
  }, [checkDeviceCapabilities]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldParts = field.split(".");
    const value =
      fieldParts.length > 1
        ? (formData[fieldParts[0] as keyof typeof formData] as Record<string, unknown>)[fieldParts[1]]
        : (formData as Record<string, unknown>)[field];
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleQuickTimeSelect = (type: "now" | "today" | "tomorrow") => {
    const now = new Date();
    let targetDate = new Date();
    if (type === "now") targetDate = new Date(now.getTime() + 5 * 60 * 1000);
    else if (type === "today") targetDate.setHours(14, 0, 0, 0);
    else if (type === "tomorrow") {
      targetDate.setDate(now.getDate() + 1);
      targetDate.setHours(9, 0, 0, 0);
    }

    const formatted = new Date(
      targetDate.getTime() - targetDate.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 16);
    handleInputChange("startTime", formatted);
  };

  const handleSubmit = async () => {
    const newErrors: FormErrors = {};
    ["courseId", "title", "startTime", "duration"].forEach((field) => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ courseId: true, title: true, startTime: true, duration: true });
      showError("Please fix validation errors");
      return;
    }

    const sessionData = {
      courseId: parseInt(formData.courseId),
      courseName: courses.find((c) => c.id === parseInt(formData.courseId))?.courseName || "",
      title: formData.title,
      description: formData.description,
      startTime: new Date(formData.startTime),
      endTime: new Date(new Date(formData.startTime).getTime() + formData.duration * 60 * 60 * 1000),
      location: {
        latitude: parseFloat(formData.location.latitude) || 0,
        longitude: parseFloat(formData.location.longitude) || 0,
        radius: formData.location.radius,
        name: formData.location.name,
      },
      security: formData.security,
      professorId: user?.id.toString() || "",
    };

    const result = isEditMode
      ? await updateSession(sessionId, sessionData)
      : await createSession(sessionData);

    if (result) {
      success(isEditMode ? "Session updated successfully" : "Session created successfully");
      router.push("/dashboard/professor/attendance/sessions");
    }
  };

  const steps = [
    { id: 0, title: "Basic Info", icon: Layout },
    { id: 1, title: "Schedule", icon: Clock },
    { id: 2, title: "Location", icon: MapPin },
    { id: 3, title: "Security", icon: Shield },
  ];

  const selectedCourse = courses.find((c) => c.id === parseInt(formData.courseId));

  return (
    <DashboardLayout userName={user ? `${user.firstName} ${user.lastName}` : "Professor"} userType="professor">
      <div className="max-w-7xl mx-auto h-[calc(100vh-5rem)] md:h-[calc(100vh-8rem)] flex flex-col px-4">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/40 dark:border-gray-700/50 p-6 lg:p-8 group"
        >
          {/* Glow effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-125" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.back()}
                className="w-12 h-12 bg-white/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-gray-100 dark:border-gray-600 group/back"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover/back:-translate-x-1 transition-transform" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight">
                  {isEditMode ? "Edit Session" : "Create Session"}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base font-medium">
                  {isEditMode ? "Modify existing attendance session" : "Configure a new attendance session"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl border bg-purple-50/50 border-purple-100/50 dark:bg-purple-900/10 dark:border-purple-800/30 backdrop-blur-sm shadow-sm">
                <Activity className="h-5 w-5 text-purple-500" strokeWidth={2.5} />
                <span className="text-sm sm:text-base font-bold text-purple-700 dark:text-purple-400">
                  {isEditMode ? "Editing" : "Draft"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>


        {/* Permission Advisor (Only if location not granted) */}
        {permissions.location !== "granted" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-[2rem] p-6 shadow-xl relative border bg-white/80 dark:bg-gray-800/80 border-white/40 dark:border-gray-700/50 backdrop-blur-xl transition-all duration-500"
          >
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className={`p-4 rounded-3xl border transition-all ${
                permissions.location === "denied" ? "bg-red-500/10 border-red-200/50 text-red-600" : "bg-blue-500/10 border-blue-200/50 text-blue-600"
              }`}>
                <MapPinIcon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Location Access Required | إذن الوصول مطلوب
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  To set accurate coordinates for this session, we need access to your GPS.
                  <br />
                  <span className="dir-rtl block font-medium mt-1">
                    لتحديد إحداثيات الجلسة بدقة، نحتاج للوصول إلى الموقع الجغرافي.
                  </span>
                </p>
              </div>
              <button
                onClick={requestLocationPermission}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-purple-500/20 transition-all active:scale-95"
              >
                Enable Access | تفعيل الموقع
              </button>
            </div>
            
            {permissions.location === "denied" && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                <p className="text-xs text-amber-800 dark:text-amber-400 text-center">
                  <b>Location blocked:</b> Please click the 🔒 icon in the address bar to reset permissions. | <b>الموقع محظور:</b> اضغط على القفل 🔒 لإعادة تعيين الأذونات.
                </p>
              </div>
            )}
          </motion.div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">

          {/* Left Column - Form */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Stepper */}
            <div className="flex items-center justify-between mb-8 px-1 md:px-2 flex-shrink-0">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1 last:flex-none relative">
                  <div
                    className={`flex items-center gap-3 cursor-pointer group z-10 transition-all ${index <= currentStep ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-gray-600"}`}
                    onClick={() => setCurrentStep(index)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Step ${index + 1}: ${step.title}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setCurrentStep(index);
                      }
                    }}
                  >
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                        index < currentStep 
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" 
                          : index === currentStep
                            ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-lg shadow-purple-500/10 scale-110"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      }`}
                    >
                      {index < currentStep ? (
                        <Activity className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="hidden lg:block">
                       <p className={`text-xs uppercase font-bold tracking-wider mb-0.5 ${index <= currentStep ? "text-purple-500" : "text-gray-400"}`}>Step {index + 1}</p>
                       <span className="font-black text-sm">{step.title}</span>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 md:mx-4 transition-colors duration-500 ${index < currentStep ? "bg-emerald-500" : "bg-gray-100 dark:bg-gray-800"}`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto pr-2 overflow-x-hidden">
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl border border-white/40 dark:border-gray-700/50">
                      <h2 className="text-xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
                         <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <Layout className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                         </div>
                         Session Details | تفاصيل الجلسة
                      </h2>
                      
                      <div className="space-y-6">
                        <div className="relative">
                          <label htmlFor="course-select" className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                            Target Course
                          </label>
                          <select
                            id="course-select"
                            value={formData.courseId}
                            onChange={(e) => handleInputChange("courseId", e.target.value)}
                            onBlur={() => handleBlur("courseId")}
                            className={`w-full px-5 py-4 rounded-2xl border bg-gray-50/50 dark:bg-gray-900/50 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium appearance-none ${errors.courseId ? "border-red-300 ring-4 ring-red-500/10" : "border-gray-200 dark:border-gray-700 hover:border-purple-400"}`}
                          >
                            <option value="">Select a course...</option>
                            {courses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.courseName} ({course.courseCode})
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-5 top-[3.25rem] pointer-events-none">
                             <ChevronRight className="w-5 h-5 text-gray-400 rotate-90" />
                          </div>
                          {errors.courseId && <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.courseId}</p>}
                        </div>

                        <div>
                          <label htmlFor="session-title" className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                            Session Title
                          </label>
                          <input
                            id="session-title"
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleInputChange("title", e.target.value)}
                            onBlur={() => handleBlur("title")}
                            placeholder="e.g. Week 5: Neural Networks"
                            className={`w-full px-5 py-4 rounded-2xl border bg-gray-50/50 dark:bg-gray-900/50 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium ${errors.title ? "border-red-300 ring-4 ring-red-500/10" : "border-gray-200 dark:border-gray-700 hover:border-purple-400"}`}
                          />
                          {errors.title && <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.title}</p>}
                        </div>

                        <div>
                          <label htmlFor="session-description" className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                            Description (Optional)
                          </label>
                          <textarea
                            id="session-description"
                            value={formData.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            placeholder="Brief description of the session topics..."
                            rows={4}
                            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium resize-none hover:border-purple-400"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <ScheduleStep
                    formData={formData}
                    errors={errors}
                    handleInputChange={handleInputChange}
                    handleQuickTimeSelect={handleQuickTimeSelect}
                  />
                )}

                {currentStep === 2 && (
                  <LocationStep
                    formData={formData}
                    handleInputChange={handleInputChange}
                    showError={showError}
                    showWarning={showWarning}
                    info={info}
                    success={success}
                  />
                )}

                {currentStep === 3 && <SecurityStep formData={formData} handleInputChange={handleInputChange} />}
              </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md sticky bottom-0 z-20 -mx-2 px-2">
              <button
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className={`px-8 py-4 rounded-2xl font-bold transition-all ${currentStep === 0 ? "text-gray-300 dark:text-gray-600 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 active:scale-95"}`}
              >
                Back
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                  className="px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 group"
                >
                  Next Step <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isCreating || isUpdating}
                  className="px-12 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-purple-500/30 transition-all active:scale-95 flex items-center gap-2 group"
                >
                  {isCreating || isUpdating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  )}
                  {isEditMode ? "Update Session" : "Create Session"}
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Live Preview (Rendered conditionally based on screen size for performance) */}
          {isDesktop && (
            <div className="w-[380px] flex-shrink-0">
              <div className="sticky top-6">
                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4">Live Preview</h2>
                <AttendanceLivePreview formData={formData} selectedCourse={selectedCourse} />
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
