import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "../components/common/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { useAttendanceSessions } from "../hooks/useAttendanceSessions";
import { apiClient } from "../services/api";
import { useToast } from "../components/common/ToastProvider";

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

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

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
      <div className="max-w-7xl mx-auto h-[calc(100vh-5rem)] md:h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 flex-shrink-0">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            aria-label="Go back to attendance list"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? "Edit Session" : "Create Session"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isEditMode ? "Modify existing attendance session" : "Configure a new attendance session"}
            </p>
          </div>
        </div>

        <div className="flex-1 flex gap-8 min-h-0">
          {/* Left Column - Form */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Stepper */}
            <div className="flex items-center justify-between mb-6 md:mb-8 px-1 md:px-2 flex-shrink-0">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={`flex items-center gap-2 cursor-pointer group ${index <= currentStep ? "text-purple-600 dark:text-purple-400" : "text-gray-600"}`}
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
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all ${index <= currentStep ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20" : "border-gray-200 dark:border-gray-700"}`}
                    >
                      <step.icon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <span className="font-medium hidden md:block text-sm md:text-base">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 md:mx-4 transition-colors ${index < currentStep ? "bg-purple-200 dark:bg-purple-900" : "bg-gray-100 dark:bg-gray-800"}`}
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
                    <div className="bg-white dark:bg-cardDark rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Session Details</h2>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Course
                          </label>
                          <select
                            id="course-select"
                            value={formData.courseId}
                            onChange={(e) => handleInputChange("courseId", e.target.value)}
                            onBlur={() => handleBlur("courseId")}
                            className={`w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition-all ${errors.courseId ? "border-red-300 focus:ring-red-200" : "border-gray-200 dark:border-gray-700"}`}
                          >
                            <option value="">Select a course...</option>
                            {courses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.courseName} ({course.courseCode})
                              </option>
                            ))}
                          </select>
                          {errors.courseId && <p className="text-red-500 text-xs mt-1">{errors.courseId}</p>}
                        </div>
                        <div>
                          <label htmlFor="session-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title
                          </label>
                          <input
                            id="session-title"
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleInputChange("title", e.target.value)}
                            onBlur={() => handleBlur("title")}
                            placeholder="e.g. Week 5: Neural Networks"
                            className={`w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition-all ${errors.title ? "border-red-300 focus:ring-red-200" : "border-gray-200 dark:border-gray-700"}`}
                          />
                          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                        </div>
                        <div>
                          <label htmlFor="session-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description (Optional)
                          </label>
                          <textarea
                            id="session-description"
                            value={formData.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            placeholder="Brief description of the session topics..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
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
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${currentStep === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}
              >
                Back
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                  className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isCreating || isUpdating}
                  className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-1"
                >
                  {isCreating || isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
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
