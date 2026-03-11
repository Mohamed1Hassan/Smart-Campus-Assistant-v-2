"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiClient, TokenManager } from "../services/api";

import { User, AuthState } from "../types/auth.types";

export interface AuthContextType extends AuthState {
  login: (
    universityId: string,
    password: string,
    expectedRole?: string,
  ) => Promise<void>;
  register: (userData: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    isInitialized: false,
  });

  const router = useRouter();

  // Initialize Auth
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const accessToken = TokenManager.getAccessToken();
      const refreshToken = TokenManager.getRefreshToken();

      // If we have either token, attempt profile fetch
      // apiClient interceptors will handle refresh if accessToken is expired
      if (!accessToken && !refreshToken) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isInitialized: true,
        }));
        return;
      }

      const response = await apiClient.get<{
        authenticated: boolean;
        user: User;
      }>("/auth/session");

      if (
        response.success &&
        response.data?.authenticated &&
        response.data?.user
      ) {
        // Synchronize TokenManager user data
        TokenManager.setUserData(response.data.user);

        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          isInitialized: true,
        });
      } else {
        // Not authenticated, but 200 OK
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isInitialized: true,
        }));
      }
    } catch (err) {
      console.error("[AuthContext] Session verification failed:", err);
      TokenManager.clearTokens();
      setState((prev) => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      }));
    }
  };

  const login = async (
    universityId: string,
    password: string,
    expectedRole?: string,
  ) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiClient.post<{
        user: User;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>("/auth/login", { universityId, password });

      if (response.success && response.data) {
        const { user, accessToken, refreshToken, expiresIn } = response.data;

        // Role Validation
        if (
          expectedRole &&
          user.role !== expectedRole &&
          user.role !== "admin"
        ) {
          throw new Error(
            `This account is registered as a ${user.role}. Please use the correct login portal.`,
          );
        }

        // Standardized Token Management
        TokenManager.setTokens(accessToken, refreshToken, expiresIn);
        TokenManager.setUserData(user);

        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          isInitialized: true,
        });

        router.push("/dashboard");
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (err) {
      console.error("[AuthContext] Login error caught:", err);

      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMsg =
        axiosError?.response?.data?.message ||
        (err as Error)?.message ||
        "Invalid University ID or Password";
      setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
      throw err;
    }
  };

  const register = async (userData: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiClient.post<{
        user: User;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>("/auth/register", userData);

      if (response.success && response.data) {
        // Some systems auto-login after register
        const { user, accessToken, refreshToken, expiresIn } = response.data;
        if (accessToken) {
          TokenManager.setTokens(accessToken, refreshToken, expiresIn);
          TokenManager.setUserData(user);

          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            isInitialized: true,
          });
          router.push("/dashboard");
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMsg =
        axiosError?.response?.data?.message ||
        (err as Error)?.message ||
        "Registration failed";
      setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (err) {
      console.error("[AuthContext] Logout API call failed:", err);
    } finally {
      TokenManager.clearTokens();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isInitialized: true,
      });
      router.push("/");
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    setState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  };

  const clearError = () => setState((prev) => ({ ...prev, error: null }));

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken: async () => {},
    updateUser,
    clearError,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * withAuth HOC Compatibility Shim
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: string,
): React.FC<P> {
  return function WithAuthWrapper(props: P) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push("/");
      }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Verifying session...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requiredRole && user?.role !== requiredRole) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 max-w-md mx-auto mb-8">
            You don&apos;t have the required permissions to access this page.
            Please contact your administrator if you believe this is an error.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

export default AuthContext;
