"use client";
import { useState, useEffect } from "react";
import {
  AlertCircle,
  Loader2,
  UserPlus,
  ArrowRight,
  Check,
  User,
  Lock,
  GraduationCap,
  School,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { FormField } from "../components/ui/FormField";
import { useFormValidation } from "../hooks/useFormValidation";
import { validators, inputMasks } from "../utils/validation.frontend";
import { apiClient } from "../services/api";
import { Logo } from "../components/common/Logo";

export default function Login() {
  const { login, isLoading, error, clearError } = useAuth();
  const { theme: savedTheme, setTheme } = useTheme();

  const [role, setRole] = useState<"student" | "professor">("student");
  const [localError, setLocalError] = useState("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // In Next.js we control the register form purely via local state

  const {
    values,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldError,
  } = useFormValidation({
    initialValues: {
      universityId: "",
      password: "",
    },
    validationRules: {
      universityId: [
        validators.required("University ID is required"),
        validators.universityId("University ID must be exactly 8 digits"),
      ],
      password: [
        validators.required("Password is required"),
        validators.password("Password must be at least 6 characters"),
      ],
    },
    onSubmit: async (values) => {
      try {
        if (rememberMe) {
          localStorage.setItem("login.rememberMe", "true");
          localStorage.setItem("login.universityId", values.universityId);
        } else {
          localStorage.removeItem("login.rememberMe");
          localStorage.removeItem("login.universityId");
        }
        await login(values.universityId, values.password, role);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Invalid University ID or Password";
        setLocalError(errorMsg);
        throw err;
      }
    },
  });

  // Optimized light-mode only enforcement for Login page
  useEffect(() => {
    // Record original theme
    const originalTheme =
      localStorage.getItem("theme") ||
      (savedTheme === "dark" ? "dark" : "light");

    // Force light mode
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");

    return () => {
      // Restore original theme on unmount
      if (originalTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
        setTheme("dark");
      } else {
        setTheme("light");
      }
    };
  }, [savedTheme, setTheme]);

  useEffect(() => {
    const remembered = localStorage.getItem("login.rememberMe") === "true";
    const savedId = localStorage.getItem("login.universityId") || "";
    if (remembered && savedId) {
      setRememberMe(true);
      handleChange("universityId", savedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Legacy auto-redirect logic (based on old AuthContext) is disabled in Next.js + Clerk setup
  // so that the original Login UI can be viewed without immediately navigating away.

  const displayError = localError || error;
  const hasFormErrors = false; // validation handled by FormField components
  const hasAnyError = !!(displayError || hasFormErrors);

  return (
    <>
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gray-50">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-500/20 to-purple-600/20 animate-gradient-xy"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/30 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-400/30 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20"></div>
        </div>

        <main
          id="main-content"
          className="w-full max-w-6xl flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10"
          aria-labelledby="login-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", type: "spring", stiffness: 200, damping: 20 }}
            className="w-full grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 bg-white/70 lg:bg-white/80 backdrop-blur-3xl lg:backdrop-blur-2xl rounded-[2.5rem] lg:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] lg:shadow-2xl border border-white/60 lg:border-white/50 overflow-hidden"
          >
            {/* Left Side - Illustration/Branding */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
              <div className="absolute inset-0 mix-blend-overlay opacity-10">
                <Image
                  src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                  alt="University Building"
                  fill
                  className="object-cover object-center"
                  priority
                  fetchPriority="high"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  {/* Smart Campus Logo (Our Logo) */}
                  <div className="rounded-full bg-white relative w-16 h-16 border-2 border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.4)] flex-shrink-0 z-10 flex items-center justify-center overflow-hidden">
                    <Logo className="w-12 h-12" />
                  </div>

                  {/* Text Container */}
                  <div className="flex flex-col ml-1">
                    <span className="text-2xl font-bold tracking-tight text-white leading-none mb-1">
                      Thebes Academy
                    </span>
                    <span className="text-sm font-medium text-blue-200 tracking-wide uppercase">
                      Smart Campus
                    </span>
                  </div>
                </div>

                {/* H1 for better SEO indexing */}
                <h1 className="sr-only">
                  معهد طيبة - معهد طيبة العالي - النظام الذكي للحضور والغياب (Smart Campus Assistant)
                </h1>

                <h2 className="text-4xl font-bold leading-tight mb-4" lang="ar" dir="rtl">
                  المنصة التعليمية لـ
                  <br />
                  <span className="text-blue-200">معهد طيبة العالي</span>
                </h2>
                <p className="text-blue-100 text-lg max-w-md" dir="rtl" lang="ar">
                  النظام الذكي لإدارة الحضور والغياب والمواد الدراسية ومتابعة الأداء الأكاديمي.
                </p>
                <p className="text-blue-100/80 text-sm max-w-md mt-2" dir="rtl" lang="ar">
                  تابع جدولك الدراسي، وسجل حضورك، وابقَ على اطلاع دائم بمقرراتك الدراسية عبر منصة واحدة متكاملة.
                </p>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-6 mt-12">
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/20 transition-colors cursor-default">
                  <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center mb-3">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">For Students</h3>
                  <p className="text-sm text-blue-100">
                    Track progress & attendance
                  </p>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/20 transition-colors cursor-default">
                  <div className="w-10 h-10 bg-indigo-500/30 rounded-lg flex items-center justify-center mb-3">
                    <School className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">For Professors</h3>
                  <p className="text-sm text-blue-100">
                    Manage courses & insights
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="p-6 pt-10 md:p-12 lg:p-16 flex flex-col justify-center bg-white/40 lg:bg-white/50">
              {/* Intelligent Responsive Header for Mobile */}
              <div className="mb-8 text-center lg:text-left flex flex-col items-center lg:items-start">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, ease: "easeOut" }}
                  className="lg:hidden flex flex-col items-center mb-6"
                >
                  <div className="flex items-center justify-center mb-4">
                    {/* Smart Campus Logo */}
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white relative z-10 overflow-hidden">
                      <Logo className="w-12 h-12" />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight" dir="rtl" lang="ar">
                    معهد طيبة العالي
                  </h2>
                  <h3 className="text-lg font-bold text-blue-600 tracking-tight mt-1">
                    Smart Campus
                  </h3>
                  <p className="text-sm text-gray-400 font-medium mt-1 text-center" dir="rtl" lang="ar">المنصة التعليمية والنظام الذكي</p>
                </motion.div>

                {/* Desktop Welcome Back Text */}
                <h2
                  id="login-title"
                  className="text-3xl font-bold text-gray-900 mb-2 hidden lg:block tracking-tight"
                >
                  Welcome Back! 👋
                </h2>
                <p className="text-gray-500 text-sm lg:text-base hidden lg:block">
                  Please sign in to continue to your dashboard at Thebes Academy.
                </p>
                {/* Mobile Welcome Text */}
                <p className="text-gray-500 text-sm max-w-sm lg:hidden mt-2 text-center">
                  Enter your credentials to securely access your academic dashboard.
                </p>
              </div>

              {/* Role Selection Tabs - Only show when NOT registering */}
              {!showRegisterForm && (
                <div className="flex p-1.5 bg-gray-500/5 lg:bg-gray-100/80 backdrop-blur-sm lg:backdrop-blur-none rounded-2xl mb-8 relative border border-gray-200/40 lg:border-gray-200/50">
                  <motion.div
                    layout
                    className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] lg:shadow-sm border-none lg:border lg:border-gray-100"
                    animate={{
                      x: role === "student" ? 0 : "100%",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  <button
                    onClick={() => setRole("student")}
                    className={`flex-1 relative z-10 py-3 text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2 rounded-xl ${
                      role === "student"
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    Student
                  </button>
                  <button
                    onClick={() => setRole("professor")}
                    className={`flex-1 relative z-10 py-3 text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2 rounded-xl ${
                      role === "professor"
                        ? "text-indigo-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <School className="w-4 h-4" />
                    Professor
                  </button>
                </div>
              )}

              <AnimatePresence mode="wait">
                {!showRegisterForm ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    noValidate
                  >
                    {/* Error Alert */}
                    <AnimatePresence>
                      {hasAnyError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4 flex items-start gap-3 overflow-hidden"
                        >
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-red-800 font-medium">
                            {displayError}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-5">
                      <FormField
                        label="University ID"
                        name="universityId"
                        type="text"
                        value={values.universityId}
                        onChange={(value) => {
                          handleChange("universityId", value);
                          if (displayError) {
                            setLocalError("");
                            clearError();
                          }
                        }}
                        onBlur={() => handleBlur("universityId")}
                        placeholder="e.g., 20221234"
                        autoComplete="username"
                        inputMode="numeric"
                        mask={inputMasks.universityId}
                        error={getFieldError("universityId")}
                        touched={touched.universityId}
                        disabled={isLoading || isSubmitting}
                        required
                        icon={User}
                      />

                      <FormField
                        label="Password"
                        name="password"
                        type="password"
                        value={values.password}
                        onChange={(value) => {
                          handleChange("password", value);
                          if (displayError) {
                            setLocalError("");
                            clearError();
                          }
                        }}
                        onBlur={() => handleBlur("password")}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        showPasswordToggle
                        error={getFieldError("password")}
                        touched={touched.password}
                        disabled={isLoading || isSubmitting}
                        required
                        icon={Lock}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none group">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center duration-200 transition-[background-color,border-color,box-shadow,transform] ${rememberMe ? "bg-blue-600 border-blue-600 shadow-sm scale-110" : "border-gray-300 bg-white group-hover:border-blue-400"}`}
                        >
                          {rememberMe && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          disabled={isLoading}
                        />
                        <span className="font-medium">Remember me</span>
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          alert(
                            "Please contact the university IT department to reset your password.",
                          )
                        }
                        className="text-blue-600 hover:text-blue-700 font-semibold hover:underline decoration-2 underline-offset-2 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || isSubmitting || !isValid}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                      {isLoading || isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Signing in...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In</span>
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                    </button>

                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white/50 backdrop-blur-sm text-gray-500 font-medium">
                          New to Smart Campus?
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRegisterForm(true)}
                      className="w-full bg-white border border-gray-200/80 lg:border-gray-200 text-gray-700 font-medium lg:font-bold py-4 rounded-2xl lg:rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98] lg:active:scale-100"
                    >
                      <UserPlus className="w-5 h-5 text-gray-400 lg:text-gray-500" />
                      Create Account
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-6">
                      <button
                        onClick={() => {
                          setShowRegisterForm(false);
                          setRegisterSuccess(false);
                          setLocalError("");
                        }}
                        className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-2 transition-colors font-medium group"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                      </button>
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Create Account
                      </h2>
                      <p className="text-gray-500 text-sm font-medium">
                        Join the Smart Campus community today.
                      </p>
                    </div>

                    <RegisterForm
                      role="student"
                      onSuccess={async (credentials) => {
                        if (credentials) {
                          try {
                            setRegisterSuccess(true);
                            // Short delay to show success message
                            await new Promise((resolve) =>
                              setTimeout(resolve, 1500),
                            );
                            await login(
                              credentials.universityId,
                              credentials.password,
                            );
                          } catch (error) {
                            console.error("Auto-login failed:", error);
                            setLocalError(
                              "Account created but auto-login failed. Please sign in manually.",
                            );
                            setShowRegisterForm(false);
                            setRegisterSuccess(false);
                          }
                        } else {
                          setRegisterSuccess(true);
                          setLocalError("");
                          setTimeout(() => {
                            setShowRegisterForm(false);
                            setRegisterSuccess(false);
                          }, 3000);
                        }
                      }}
                      onError={(error) => setLocalError(error)}
                      isSubmitting={isRegistering}
                      setIsSubmitting={setIsRegistering}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {registerSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 shadow-sm"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-green-800 font-medium">
                    Account created successfully! Redirecting to login...
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          <div className="absolute bottom-4 left-0 right-0 text-center z-10">
            <p className="text-xs text-gray-400 font-medium">
              © 2025 Smart Campus Assistant. All rights reserved.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

// Register Form Component
interface RegisterFormProps {
  role: "student" | "professor";
  onSuccess: (credentials?: { universityId: string; password: string }) => void;
  onError: (error: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
}

function RegisterForm({
  role,
  onSuccess,
  onError,
  isSubmitting,
  setIsSubmitting,
}: RegisterFormProps) {
  const {
    values,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldError,
    reset,
  } = useFormValidation({
    initialValues: {
      name: "",
      universityId: "",
      email: "",
      password: "",
      confirmPassword: "",
      major: "",
      level: "",
    },
    validationRules: {
      name: [
        validators.required("Name is required"),
        validators.minLength(5, "Name must be at least 5 characters"),
        validators.pattern(
          /^[^\s]+\s+[^\s]+.*$/,
          "Please enter your full name (first and last name)"
        ),
      ],
      universityId: [
        validators.required("University ID is required"),
        validators.universityId("University ID must be exactly 8 digits"),
      ],
      email: [
        validators.required("Email is required"),
        validators.email("Please enter a valid email address"),
      ],
      password: [
        validators.required("Password is required"),
        validators.minLength(6, "Password must be at least 6 characters"),
      ],
      confirmPassword: [validators.required("Please confirm your password")],
      major: [validators.required(role === "student" ? "Major is required" : "Department is required")],
      ...(role === "student" ? { level: [validators.required("Level is required")] } : {}),
    },
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        if (values.password !== values.confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const universityIdFromForm = values.universityId || "";
        const universityIdToSend = String(universityIdFromForm).trim();

        if (!universityIdToSend || universityIdToSend.length === 0) {
          throw new Error("University ID is required");
        }

        const nameParts = values.name.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName =
          nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

        if (!firstName) {
          throw new Error("Please enter your name");
        }

        const registrationData = {
          firstName: firstName,
          lastName: lastName,
          universityId: universityIdToSend,
          email: values.email.trim(),
          password: values.password,
          role: role, // Dynamic role based on selected tab
          major: values.major,
          level: role === "student" ? parseInt(values.level) : undefined,
        };

        const response = await apiClient.post(
          "/auth/register",
          registrationData,
        );

        if (!response.success) {
          const errorMessage =
            response.message || "Registration failed. Please try again.";
          onError(errorMessage);
          return;
        }

        onSuccess({
          universityId: universityIdToSend,
          password: values.password,
        });
        reset();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        let errorMessage = "Registration failed. Please try again.";
        if (error?.success === false && error?.message) {
          errorMessage = error.message;
        } else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (error?.data?.message) {
          errorMessage = error.data.message;
        }
        onError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const passwordMatchError =
    touched.confirmPassword &&
    values.confirmPassword &&
    values.password !== values.confirmPassword
      ? "Passwords do not match"
      : null;

  const majors = [
    { value: "IS", label: "Information Systems" },
    { value: "CS", label: "Computer Science" },
    { value: "ACC", label: "Accounting" },
    { value: "ACC-EN", label: "Accounting English" },
    { value: "BM", label: "Banking Management" },
    { value: "BA", label: "Business Administration" },
  ];

  const levels = [
    { value: "1", label: "Level 1" },
    { value: "2", label: "Level 2" },
    { value: "3", label: "Level 3" },
    { value: "4", label: "Level 4" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Full Name"
        name="name"
        type="text"
        value={values.name}
        onChange={(value) => handleChange("name", value)}
        onBlur={() => handleBlur("name")}
        placeholder="e.g. Ahmed Hassan"
        autoComplete="name"
        error={getFieldError("name")}
        touched={touched.name}
        disabled={isSubmitting}
        required
        icon={User}
      />

      <FormField
        label="University ID"
        name="universityId"
        type="text"
        value={values.universityId}
        onChange={(value) => handleChange("universityId", value)}
        onBlur={() => handleBlur("universityId")}
        placeholder="e.g. 20221234"
        autoComplete="username"
        inputMode="numeric"
        mask={inputMasks.universityId}
        error={getFieldError("universityId")}
        touched={touched.universityId}
        disabled={isSubmitting}
        required
        icon={GraduationCap}
      />
      <FormField
        label="Email Address"
        name="email"
        type="email"
        value={values.email}
        onChange={(value) => handleChange("email", value)}
        onBlur={() => handleBlur("email")}
        placeholder="e.g. ahmed@example.com"
        autoComplete="email"
        error={getFieldError("email")}
        touched={touched.email}
        disabled={isSubmitting}
        required
        icon={Mail}
      />

      <div
        className={`grid ${role === "student" ? "grid-cols-2" : "grid-cols-1"} gap-4`}
      >
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {role === "student" ? "Major" : "Department"}
          </label>
          <select
            name="major"
            value={values.major}
            onChange={(e) => handleChange("major", e.target.value)}
            onBlur={() => handleBlur("major")}
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-white/50 backdrop-blur-sm"
            required
          >
            <option value="">
              Select {role === "student" ? "Major" : "Department"}
            </option>
            {majors.map((major) => (
              <option key={major.value} value={major.value}>
                {major.label}
              </option>
            ))}
          </select>
          {touched.major && getFieldError("major") && (
            <p className="text-xs text-red-500 mt-1">
              {getFieldError("major")}
            </p>
          )}
        </div>

        {role === "student" && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Level
            </label>
            <select
              name="level"
              value={values.level}
              onChange={(e) => handleChange("level", e.target.value)}
              onBlur={() => handleBlur("level")}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-white/50 backdrop-blur-sm"
              required={role === "student"}
            >
              <option value="">Select Level</option>
              {levels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            {touched.level && getFieldError("level") && (
              <p className="text-xs text-red-500 mt-1">
                {getFieldError("level")}
              </p>
            )}
          </div>
        )}
      </div>

      <FormField
        label="Password"
        name="password"
        type="password"
        value={values.password}
        onChange={(value) => handleChange("password", value)}
        onBlur={() => handleBlur("password")}
        placeholder="Min 6 characters"
        autoComplete="new-password"
        showPasswordToggle
        error={getFieldError("password")}
        touched={touched.password}
        disabled={isSubmitting}
        required
        icon={Lock}
      />

      <FormField
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={values.confirmPassword}
        onChange={(value) => handleChange("confirmPassword", value)}
        onBlur={() => handleBlur("confirmPassword")}
        placeholder="Re-enter password"
        autoComplete="new-password"
        showPasswordToggle
        error={passwordMatchError || getFieldError("confirmPassword")}
        touched={touched.confirmPassword}
        disabled={isSubmitting}
        required
        icon={Lock}
      />

      <button
        type="submit"
        disabled={isSubmitting || !isValid || passwordMatchError !== null}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 mt-6"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Creating Account...</span>
          </>
        ) : (
          <>
            <UserPlus className="w-5 h-5" />
            <span>Create Account</span>
          </>
        )}
      </button>
    </form>
  );
}
