/**
 * Centralized API Service Layer
 * Handles all HTTP requests with Axios configuration, interceptors, and error handling
 */

import axios from "axios";

// Fallback types due to module resolution issues with Axios 1.x in this environment
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
type AxiosInstance = any;
type AxiosRequestConfig = any;
type AxiosResponse<T = any, D = any> = any;
type InternalAxiosRequestConfig<D = any> = any;
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { User } from "../types/auth.types";

// API Configuration with dynamic port detection
const getApiBaseUrl = () => {
  // Since the backend is now integrated into Next.js, we should use relative paths
  // for client-side requests. Server-side requests will handle their own URL logic.
  if (typeof window === "undefined") {
    // For server-side fetching (if needed), use localhost or an internal URL
    return `http://localhost:${process.env.PORT || 3000}/api`;
  }
  return "/api";
};
const API_TIMEOUT = 60000; // 60 seconds (increased for cold starts)
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary?: Record<string, unknown>;
  error?: string | Record<string, unknown> | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  retryAfter?: number; // Retry after time in seconds (for rate limiting)
  status?: number; // HTTP status code
}

// Token Management
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = "accessToken";
  private static readonly REFRESH_TOKEN_KEY = "refreshToken";
  private static readonly TOKEN_EXPIRY_KEY = "expiresAt";
  private static readonly USER_DATA_KEY = "userData";

  static getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static getTokenExpiry(): number | null {
    if (typeof window === "undefined") return null;
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry) : null;
  }

  static getUserData(): User | null {
    if (typeof window === "undefined") return null;
    try {
      const userData = localStorage.getItem(this.USER_DATA_KEY);

      if (!userData || userData === "undefined" || userData === "null") {
        return null;
      }

      return JSON.parse(userData) as User;
    } catch (error) {
      console.error("[TokenManager] Error parsing user data:", error);
      localStorage.removeItem(this.USER_DATA_KEY);
      return null;
    }
  }

  static setTokens(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ): void {
    if (typeof window === "undefined") return;
    const expiryTime = Date.now() + expiresIn * 1000;

    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  static setUserData(user: User): void {
    if (typeof window === "undefined") return;
    try {
      if (!user) {
        console.error("[TokenManager] Cannot store null/undefined user data");
        return;
      }
      const userData = JSON.stringify(user);
      localStorage.setItem(this.USER_DATA_KEY, userData);
      console.log("[TokenManager] User data stored to localStorage:", user);
    } catch (error) {
      console.error(
        "[TokenManager] Error storing user data to localStorage:",
        error,
      );
    }
  }

  static clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
  }

  static isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;

    // Check if token expires in the next 5 minutes
    return Date.now() >= expiry - 5 * 60 * 1000;
  }

  static isTokenValid(): boolean {
    const token = this.getAccessToken();
    const expiry = this.getTokenExpiry();

    if (!token || !expiry) return false;

    // Token is valid if expiry time is in the future (with 5 minute buffer)
    // This prevents using tokens that are about to expire
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return Date.now() < expiry - bufferTime;
  }

  static hasValidRefreshToken(): boolean {
    const refreshToken = this.getRefreshToken();
    return !!refreshToken;
  }
}

// API Client Class
class ApiClient {
  private axiosInstance: AxiosInstance;
  private apiBaseUrl: string;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (error?: unknown) => void;
  }> = [];

  constructor() {
    // Calculate baseURL dynamically to ensure it works correctly
    // This is called in constructor so it uses the current window.location.hostname
    this.apiBaseUrl = getApiBaseUrl();

    console.log("[ApiClient] Initializing with baseURL:", this.apiBaseUrl);
    console.log(
      "[ApiClient] Current hostname:",
      typeof window !== "undefined" ? window.location.hostname : "N/A",
    );

    // Validate the computed URL
    if (
      !this.apiBaseUrl ||
      (!this.apiBaseUrl.startsWith("http") && !this.apiBaseUrl.startsWith("/"))
    ) {
      console.error("[ApiClient] Invalid API base URL:", this.apiBaseUrl);
      throw new Error(`Invalid API base URL: ${this.apiBaseUrl}`);
    }

    this.axiosInstance = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: API_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // For cookies
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request Interceptor
    this.axiosInstance.interceptors.request.use(
      (
        config: InternalAxiosRequestConfig & {
          metadata?: { startTime: number };
        },
      ) => {
        const token = TokenManager.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Normalize URL to avoid double /api when baseURL already ends with /api
        try {
          const base = (config.baseURL || this.apiBaseUrl).replace(/\/+$/, "");
          if (typeof config.url === "string") {
            const originalUrl = config.url;
            if (base.endsWith("/api") && originalUrl.startsWith("/api/")) {
              config.url = originalUrl.replace(/^\/api\//, "/");
            }
          }
        } catch {}

        config.metadata = { startTime: Date.now() };

        if (process.env.NODE_ENV === "development") {
          console.debug(
            `API Request: ${config.method?.toUpperCase()} ${config.url}`,
            config.data,
          );
        }

        return config;
      },
      (error: unknown) => {
        return Promise.reject(this.handleError(error));
      },
    );

    // Response Interceptor
    this.axiosInstance.interceptors.response.use(
      (
        response: AxiosResponse & {
          config: InternalAxiosRequestConfig & {
            metadata?: { startTime: number };
          };
        },
      ) => {
        if (response.config.metadata?.startTime) {
          const responseTime = Date.now() - response.config.metadata.startTime;
          console.debug(
            `API Response Time: ${responseTime}ms for ${response.config.url}`,
          );
        }

        if (process.env.NODE_ENV === "development") {
          console.debug(
            `API Response: ${response.status} ${response.config.url}`,
            response.data,
          );
        }

        return response;
      },
      async (error: unknown) => {
        const err = error as {
          config?: InternalAxiosRequestConfig & {
            _retry?: boolean;
            suppress404?: boolean;
          };
          response?: { status: number; data?: unknown };
          message?: string;
          code?: string;
        };
        const originalRequest = err.config;
        if (!originalRequest) return Promise.reject(error);

        // Silently handle expected 404s - don't even log them
        const isExpected404 = originalRequest.suppress404 === true;
        if (err.response?.status === 404 && isExpected404) {
          // Return a mock response structure that won't trigger further logging
          return Promise.reject({
            ...err,
            code: "HTTP_404",
            response: {
              ...err.response,
              status: 404,
              data: { success: false, message: "Not found", data: null },
            },
            isHandled: true, // Flag to indicate this was handled silently
          });
        }

        // Skip token refresh for auth endpoints (login, register, refresh, logout)
        const isAuthEndpoint =
          originalRequest.url?.includes("/auth/login") ||
          originalRequest.url?.includes("/auth/register") ||
          originalRequest.url?.includes("/auth/refresh") ||
          originalRequest.url?.includes("/auth/logout");

        // Handle 401 Unauthorized - Token refresh (only for non-auth endpoints)
        if (
          err.response?.status === 401 &&
          !originalRequest._retry &&
          !isAuthEndpoint
        ) {
          // Skip token refresh if using mock tokens (development mode)
          const refreshToken = TokenManager.getRefreshToken();
          if (
            refreshToken === "mock-refresh-token" ||
            refreshToken?.startsWith("mock-")
          ) {
            // In development mode with mock tokens, just redirect to login
            this.handleAuthFailure();
            return Promise.reject(this.handleError(error));
          }

          // No refresh token available - don't try to refresh
          if (!refreshToken) {
            this.handleAuthFailure();
            return Promise.reject(this.handleError(error));
          }

          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.refreshToken();
            this.processQueue(null);

            // Retry original request with new token
            const newToken = TokenManager.getAccessToken();

            if (process.env.NODE_ENV === "development") {
              console.log("[ApiClient] Retrying request after token refresh:", {
                url: originalRequest.url,
                hasNewToken: !!newToken,
                tokenLength: newToken?.length,
              });
            }

            if (!newToken) {
              throw new Error("Failed to get new access token after refresh");
            }

            // Ensure headers object exists
            originalRequest.headers = originalRequest.headers || {};

            // Set the new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Keep _retry flag set to prevent infinite refresh loops
            // If the retry also fails with 401, it means the refresh token is invalid
            // and we should handle it as auth failure, not try to refresh again

            // Retry the original request with new token
            return this.axiosInstance(originalRequest);
          } catch (refreshError: unknown) {
            this.processQueue(refreshError);
            this.handleAuthFailure();
            return Promise.reject(this.handleError(refreshError));
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      },
    );
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    // If using mock tokens (development mode), don't try to refresh
    // The backend doesn't support refresh tokens yet
    if (
      refreshToken === "mock-refresh-token" ||
      (refreshToken && refreshToken.startsWith("mock-"))
    ) {
      console.warn(
        "Mock refresh token detected - refresh token endpoint not available",
      );
      throw new Error("Refresh token not supported in development mode");
    }

    try {
      console.log("[ApiClient] Attempting to refresh token...");

      const response = await axios.post(
        `${this.apiBaseUrl}/auth/refresh`,
        {
          refreshToken,
        },
        {
          withCredentials: true,
          timeout: API_TIMEOUT,
        },
      );

      console.log("[ApiClient] Refresh token response received:", {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
      });

      const responseData = response.data as ApiResponse<unknown>;

      // Handle multiple response structures:
      // 1. { success: true, data: { accessToken, refreshToken, expiresIn } }
      // 2. { success: true, data: { user, accessToken, refreshToken, expiresIn } }
      // 3. { accessToken, refreshToken, expiresIn }
      let data = responseData as unknown as Record<string, unknown>;

      // If response has a 'data' property, use it
      if (responseData.data && typeof responseData.data === "object") {
        data = responseData.data as Record<string, unknown>;
      }

      console.log("[ApiClient] Parsed token data:", {
        hasAccessToken: !!(data as Record<string, unknown>).accessToken,
        hasRefreshToken: !!(data as Record<string, unknown>).refreshToken,
        hasExpiresIn: !!(data as Record<string, unknown>).expiresIn,
        hasUser: !!(data as Record<string, unknown>).user,
        dataKeys: Object.keys(data as object),
      });

      if (!data || !(data as Record<string, unknown>).accessToken) {
        console.error(
          "[ApiClient] Invalid refresh response - missing accessToken:",
          data,
        );
        throw new Error("Invalid refresh token response - missing accessToken");
      }

      // refreshToken is optional in response (can keep using the same one)
      const newRefreshToken =
        ((data as Record<string, unknown>).refreshToken as string) ||
        refreshToken;

      // Ensure expiresIn is a number
      const expiresIn =
        typeof (data as Record<string, unknown>).expiresIn === "number"
          ? ((data as Record<string, unknown>).expiresIn as number)
          : parseInt((data as Record<string, unknown>).expiresIn as string) ||
            900; // Default 15 minutes

      TokenManager.setTokens(
        (data as Record<string, unknown>).accessToken as string,
        newRefreshToken,
        expiresIn,
      );

      // Update user data if provided
      if ((data as Record<string, unknown>).user) {
        TokenManager.setUserData(
          (data as Record<string, unknown>).user as User,
        );
      }

      // Verify token was saved correctly
      const savedToken = TokenManager.getAccessToken();
      console.log("[ApiClient] Token refresh successful:", {
        tokenSaved: !!savedToken,
        tokenMatches: savedToken === data.accessToken,
        tokenLength: savedToken?.length,
      });

      // Double-check token was saved
      if (!savedToken || savedToken !== data.accessToken) {
        throw new Error("Token was not saved correctly after refresh");
      }
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: { data?: unknown; status?: number };
      };
      console.error("[ApiClient] Token refresh failed:", {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });
      TokenManager.clearTokens();
      throw error;
    }
  }

  private processQueue(error: unknown): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });

    this.failedQueue = [];
  }

  private handleAuthFailure(): void {
    TokenManager.clearTokens();
    // clearTokens already removes USER_DATA_KEY, so no need for separate clearUserData

    // Dispatch custom event for auth failure
    window.dispatchEvent(
      new CustomEvent("auth:logout", {
        detail: { reason: "Token refresh failed" },
      }),
    );

    // Redirect to login page
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  private handleError(error: unknown): ApiError {
    const apiError: ApiError = {
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred",
      timestamp: new Date().toISOString(),
    };

    const err = error as {
      message?: string;
      code?: string;
      response?: {
        status: number;
        statusText?: string;
        data?: unknown;
      };
      config?: {
        url?: string;
        method?: string;
        baseURL?: string;
      };
      request?: unknown;
    };

    // Debug logging for development - skip 404 errors as they're expected for missing endpoints
    if (
      process.env.NODE_ENV === "development" &&
      err.response?.status !== 404
    ) {
      // Use console.warn instead of console.error to avoid triggering Next.js error overlays
      console.warn("API Error (non-fatal):", {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          baseURL: err.config?.baseURL,
        },
      });
    }

    const errorWithPossibleName = error as { name?: string };
    const isCanceled =
      err.code === "ERR_CANCELED" ||
      errorWithPossibleName?.name === "CanceledError" ||
      errorWithPossibleName?.name === "AbortError" ||
      (axios as unknown as { isCancel: (value: unknown) => boolean }).isCancel?.(error);

    if (isCanceled) {
      apiError.code = "ABORT_ERROR";
      apiError.message = "Request was cancelled";
      return apiError;
    }

    if (err.response) {
      // Server responded with error status
      const response = err.response.data as Record<string, unknown>;
      apiError.code =
        (response?.code as string) || `HTTP_${err.response.status}`;
      apiError.message =
        (response?.message as string) || err.message || "Server error";
      apiError.details =
        response?.error || response?.details || response?.errors; // Support both details and errors
      apiError.status = err.response.status;

      // Extract retryAfter for rate limiting (429 errors)
      if (err.response.status === 429) {
        apiError.retryAfter = response?.retryAfter as number | undefined;
        // Use retryAfterMinutes if available (from auth.middleware), otherwise calculate from retryAfter
        if (response?.retryAfterMinutes !== undefined) {
          // Message already contains minutes, use it directly if present
          if (
            response?.message &&
            (response.message as string).includes("try again")
          ) {
            apiError.message = response.message as string;
          } else {
            apiError.message = `Too many login attempts. Please try again in ${response.retryAfterMinutes} minute${response.retryAfterMinutes !== 1 ? "s" : ""}.`;
          }
        } else if (apiError.retryAfter) {
          // Calculate minutes from retryAfter (seconds)
          const minutes = Math.ceil(apiError.retryAfter / 60);
          apiError.message = `Too many login attempts. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`;
        }
      }
    } else if (err.request) {
      // Request was made but no response received
      apiError.code = "NETWORK_ERROR";
      apiError.message = "Network error - please check your connection";
      apiError.details = {
        url: err.config?.url,
        method: err.config?.method,
        baseURL: err.config?.baseURL,
      };

      // Detailed logging for network errors (warn-level to avoid Next.js error overlays)
      console.warn("[ApiClient] Network error details:", {
        message: err.message,
        code: err.code,
        url: err.config?.url,
        baseURL: err.config?.baseURL,
        fullURL: `${err.config?.baseURL}${err.config?.url}`,
        timeout: API_TIMEOUT,
        hostname:
          typeof window !== "undefined" ? window.location.hostname : "N/A",
        currentURL:
          typeof window !== "undefined" ? window.location.href : "N/A",
        suggestion:
          "Check if VITE_API_BASE_URL is set correctly in environment variables.",
      });

      // Add a more visible notice for the user in the console (warn-level)
      if (typeof window !== "undefined") {
        console.warn(
          `%c[Network Warning] Failed to connect to ${err.config?.baseURL}`,
          "background: #ff9800; color: #ffffff; padding: 4px; font-weight: bold; border-radius: 4px;",
        );
        console.warn("Possible causes:");
        console.warn("1. Backend is not running or not accessible");
        console.warn(
          "2. CORS configuration on backend does not allow this origin",
        );
        console.warn(
          "3. VITE_API_BASE_URL is missing or incorrect (currently: " +
            err.config?.baseURL +
            ")",
        );
      }
    } else {
      // Something else happened
      apiError.code = "REQUEST_ERROR";
      apiError.message = err.message || "An error occurred during the request";
    }

    return apiError;
  }

  // HTTP Methods
  async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig & { suppress404?: boolean },
  ): Promise<ApiResponse<T>> {
    // For endpoints that are expected to potentially return 404, use validateStatus to prevent error throwing
    const isExpected404 = config?.suppress404 === true;

    // Prepare config with validateStatus to accept 404 as valid response
    const modifiedConfig: AxiosRequestConfig & { suppress404?: boolean } =
      isExpected404
        ? {
            ...config,
            validateStatus: (status: number) => status < 500, // Accept 4xx as valid responses (don't throw)
            suppress404: true, // Preserve flag for interceptor
          }
        : config || {};

    // Remove suppress404 from params if it exists (it should be in config, not params)
    if (modifiedConfig.params && "suppress404" in modifiedConfig.params) {
      const params = { ...modifiedConfig.params } as Record<string, unknown>;
      delete params.suppress404;
      modifiedConfig.params = params;
    }

    try {
      if (process.env.NODE_ENV === "development" && !isExpected404) {
        console.log(`📡 [ApiClient] GET ${url}`);
      }
      const response = await this.axiosInstance.get(url, modifiedConfig);

      // If it's a 404 and we're expecting it, return a safe response without logging
      if (response.status === 404 && isExpected404) {
        return {
          success: false,
          message: "Not found",
          data: null,
        } as ApiResponse<T>;
      }

      if (process.env.NODE_ENV === "development" && !isExpected404) {
        console.log(`📥 [ApiClient] GET ${url} - Response:`, {
          status: response.status,
          statusText: response.statusText,
          hasData: !!response.data,
          dataType: typeof response.data,
        });
      }

      return response.data;
    } catch (error: unknown) {
      // Re-throw abort/cancel errors immediately so callers can detect them by name/code
      const caughtErr = error as { name?: string; code?: string };
      if (
        caughtErr.name === "AbortError" ||
        caughtErr.name === "CanceledError" ||
        caughtErr.code === "ERR_CANCELED"
      ) {
        throw error;
      }

      // Suppress 404 errors in console - they're expected for missing endpoints
      const err = error as { code?: string; response?: { status: number } };
      const is404 = err?.code === "HTTP_404" || err?.response?.status === 404;
      if (is404 && isExpected404) {
        // Return safe fallback for expected 404s without logging
        return {
          success: false,
          message: "Endpoint not available",
          data: null,
        } as ApiResponse<T>;
      }

      if (!is404 && process.env.NODE_ENV === "development") {
        // Log as warning to avoid dev error overlay while still keeping visibility
        console.warn(`❌ [ApiClient] GET ${url} - Error:`, error);
      }
      throw error;
    }
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log(`📡 [ApiClient] POST ${url}`, data);
      }
      const response = await this.axiosInstance.post(url, data, config);
      return response.data;
    } catch (error: unknown) {
      if (process.env.NODE_ENV === "development") {
        // Log as warning to avoid noisy dev overlays while still keeping visibility
        console.warn(`❌ [ApiClient] POST ${url} - Error:`, error);
      }

      const err = error as {
        response?: { status: number; data?: ApiResponse<unknown> };
        message?: string;
        details?: string;
        code?: string;
      };
      // For 4xx errors, return structured error response instead of throwing
      if (
        err?.response?.status &&
        err.response.status >= 400 &&
        err.response.status < 500
      ) {
        const errorData =
          (err.response.data as unknown as Record<string, unknown>) || {};

        // Check if error is already an ApiError object (from handleError interceptor)
        // ApiError has details field that contains the actual error message
        if (err.details) {
          const errorMessage = err.details || err.message || "Request failed";
          return {
            success: false,
            message: errorMessage,
            error: errorMessage,
            code: err.code || `HTTP_${err.response.status}`,
          } as unknown as ApiResponse<T>;
        }

        // Extract error message from response data - backend may send 'error' or 'message' field
        const errorMessage =
          (errorData.error as string) ||
          (errorData.message as string) ||
          err.message ||
          "Request failed";
        return {
          success: false,
          message: errorMessage,
          error: errorMessage,
          code: (errorData.code as string) || `HTTP_${err.response.status}`,
        } as unknown as ApiResponse<T>;
      }

      // Handle already-transformed ApiError POJOs (from handleError interceptor).
      // The interceptor strips .response and sets .status directly on the object.
      // This covers cases like login 401s where .response is absent but .status/.code are present.
      const errObj = error as Record<string, unknown> & {
        response?: unknown;
        status?: number;
        code?: string;
        message?: string;
      };
      if (
        !errObj?.response &&
        ((errObj?.status !== undefined && errObj.status >= 400) ||
          (typeof errObj?.code === "string" && errObj.code.startsWith("HTTP_")))
      ) {
        return {
          success: false,
          message: errObj?.message || "Request failed",
          error: errObj?.message || "Request failed",
          code: errObj?.code || "UNKNOWN_ERROR",
        } as unknown as ApiResponse<T>;
      }

      const axiosErr = error as {
        response?: { data?: unknown; status: number };
        message: string;
        code?: string;
        details?: string;
      };
      // If it's an AxiosError with response data, extract the message
      if (axiosErr?.response?.data) {
        const errorData = axiosErr.response.data as unknown as Record<
          string,
          unknown
        >;
        // Check if error has details (from ApiError)
        const errorMessage =
          axiosErr.details ||
          (errorData.error as string) ||
          (errorData.message as string) ||
          axiosErr.message ||
          "Request failed";
        const apiError = new Error(errorMessage) as Error & {
          response?: unknown;
          code?: string;
        };
        apiError.response = axiosErr.response;
        apiError.code =
          (errorData.code as string) ||
          axiosErr.code ||
          `HTTP_${axiosErr.response?.status}`;
        throw apiError;
      }

      // For network errors or other issues
      throw error;
    }
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log(`📡 [ApiClient] PUT ${url}`, data);
      }
      const response = await this.axiosInstance.put(url, data, config);
      return response.data;
    } catch (error: unknown) {
      return this.handleMethodError(error, "PUT", url);
    }
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log(`📡 [ApiClient] PATCH ${url}`, data);
      }
      const response = await this.axiosInstance.patch(url, data, config);
      return response.data;
    } catch (error: unknown) {
      return this.handleMethodError(error, "PATCH", url);
    }
  }

  async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log(`📡 [ApiClient] DELETE ${url}`);
      }
      const response = await this.axiosInstance.delete(url, config);
      return response.data;
    } catch (error: unknown) {
      return this.handleMethodError(error, "DELETE", url);
    }
  }

  /**
   * Helper to handle 4xx errors for write methods (PUT, PATCH, DELETE)
   * consistent with POST logic
   */
  private handleMethodError<T>(
    error: unknown,
    method: string,
    url: string,
  ): ApiResponse<T> {
    if (process.env.NODE_ENV === "development") {
      console.warn(`❌ [ApiClient] ${method} ${url} - Error:`, error);
    }

    const err = error as {
      response?: { status: number; data?: ApiResponse<unknown> };
      details?: string;
      message?: string;
      code?: string;
    };
    if (
      err?.response?.status &&
      err.response.status >= 400 &&
      err.response.status < 500
    ) {
      const errorData =
        (err.response.data as unknown as Record<string, unknown>) || {};
      const errorMessage =
        (errorData.error as string) ||
        (errorData.message as string) ||
        err.details ||
        err.message ||
        "Request failed";
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
        code: (errorData.code as string) || `HTTP_${err.response.status}`,
      } as unknown as ApiResponse<T>;
    }

    const errObj = error as {
      status?: number;
      code?: string;
      message?: string;
      response?: unknown;
    };
    if (
      !errObj?.response &&
      ((errObj?.status && errObj.status >= 400) ||
        (typeof errObj?.code === "string" && errObj.code.startsWith("HTTP_")))
    ) {
      return {
        success: false,
        message: errObj?.message || "Request failed",
        error: errObj?.message || "Request failed",
        code: errObj?.code || "UNKNOWN_ERROR",
      } as unknown as ApiResponse<T>;
    }

    throw error;
  }

  // File Upload
  async uploadFile<T = unknown>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await this.axiosInstance.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: {
          loaded: number;
          total?: number;
        }) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  }

  // Retry Logic
  async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts = MAX_RETRY_ATTEMPTS,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
        lastError = error;
        const err = error as { code?: string };

        // Don't retry on authentication errors
        if (err.code === "HTTP_401" || err.code === "HTTP_403") {
          throw error;
        }

        // Don't retry on client errors (4xx except 401, 403)
        if (err.code?.startsWith("HTTP_4")) {
          throw error;
        }

        if (attempt < maxAttempts) {
          const delay = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get("/health");
      return response.success;
    } catch {
      return false;
    }
  }

  // Get current instance (for advanced usage)
  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export TokenManager for external use
export { TokenManager };

// Export types already exported at declaration: ApiResponse, ApiError

// Default export
export default apiClient;
