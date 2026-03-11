import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { AuthProvider, useAuth, withAuth } from "../AuthContext";
import { apiClient, TokenManager, ApiResponse } from "../../services/api";

// Mock the API client and TokenManager
vi.mock("../../services/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
  TokenManager: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
    isTokenValid: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);
const mockTokenManager = TokenManager as unknown as {
  getAccessToken: ReturnType<typeof vi.fn>;
  getRefreshToken: ReturnType<typeof vi.fn>;
  setTokens: ReturnType<typeof vi.fn>;
  clearTokens: ReturnType<typeof vi.fn>;
  isTokenValid: ReturnType<typeof vi.fn>;
};

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="is-authenticated">
        {auth.isAuthenticated.toString()}
      </div>
      <div data-testid="is-loading">{auth.isLoading.toString()}</div>
      <div data-testid="error">{auth.error || "no-error"}</div>
      <div data-testid="user-name">{auth.user?.firstName || "no-user"}</div>
      <button onClick={() => auth.login("test@example.com", "password")}>
        Login
      </button>
      <button
        onClick={() =>
          auth.register({
            email: "test@example.com",
            password: "password",
            role: "student",
            firstName: "John",
            lastName: "Doe",
          })
        }
      >
        Register
      </button>
      <button onClick={() => auth.logout()}>Logout</button>
      <button onClick={() => auth.clearError()}>Clear Error</button>
    </div>
  );
};

const renderWithAuthProvider = (children: React.ReactNode) => {
  return render(<AuthProvider>{children}</AuthProvider>);
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTokenManager.getAccessToken.mockReturnValue(null);
    mockTokenManager.getRefreshToken.mockReturnValue(null);
    mockTokenManager.isTokenValid.mockReturnValue(false);
  });

  describe("initialization", () => {
    it("should initialize with correct default state", async () => {
      renderWithAuthProvider(<TestComponent />);

      expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");
      expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
      expect(screen.getByTestId("error")).toHaveTextContent("no-error");
      expect(screen.getByTestId("user-name")).toHaveTextContent("no-user");
    });

    it("should initialize with valid token", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        role: "student" as const,
        firstName: "John",
        lastName: "Doe",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTokenManager.getAccessToken.mockReturnValue("valid-token");
      mockTokenManager.getRefreshToken.mockReturnValue("refresh-token");
      mockTokenManager.isTokenValid.mockReturnValue(true);
      mockApiClient.get.mockResolvedValue({
        success: true,
        message: "Success",
        data: { user: mockUser },
      });

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
        expect(screen.getByTestId("user-name")).toHaveTextContent("John");
      });
    });

    it("should clear tokens on invalid token", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("invalid-token");
      mockTokenManager.isTokenValid.mockReturnValue(false);

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(mockTokenManager.clearTokens).toHaveBeenCalled();
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
      });
    });
  });

  describe("login", () => {
    it("should login successfully", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        role: "student" as const,
        firstName: "John",
        lastName: "Doe",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 900,
        },
      };

      mockApiClient.post.mockResolvedValue({
        ...mockResponse,
        message: "Success",
      } as unknown as ApiResponse<typeof mockResponse.data>);

      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText("Login");

      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(mockTokenManager.setTokens).toHaveBeenCalledWith(
          "access-token",
          "refresh-token",
          900,
        );
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
        expect(screen.getByTestId("user-name")).toHaveTextContent("John");
      });
    });

    it("should handle login failure", async () => {
      const mockResponse = {
        success: false,
        message: "Invalid credentials",
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText("Login");

      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Invalid credentials",
        );
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
      });
    });

    it("should handle network error during login", async () => {
      mockApiClient.post.mockRejectedValue(new Error("Network error"));

      renderWithAuthProvider(<TestComponent />);

      const loginButton = screen.getByText("Login");

      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Network error");
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
      });
    });
  });

  describe("register", () => {
    it("should register successfully", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        role: "student" as const,
        firstName: "John",
        lastName: "Doe",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 900,
        },
      };

      mockApiClient.post.mockResolvedValue({
        ...mockResponse,
        message: "Success",
      } as unknown as ApiResponse<typeof mockResponse.data>);

      renderWithAuthProvider(<TestComponent />);

      const registerButton = screen.getByText("Register");

      await act(async () => {
        registerButton.click();
      });

      await waitFor(() => {
        expect(mockTokenManager.setTokens).toHaveBeenCalledWith(
          "access-token",
          "refresh-token",
          900,
        );
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
        expect(screen.getByTestId("user-name")).toHaveTextContent("John");
      });
    });

    it("should handle registration failure", async () => {
      const mockResponse = {
        success: false,
        message: "Email already exists",
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      renderWithAuthProvider(<TestComponent />);

      const registerButton = screen.getByText("Register");

      await act(async () => {
        registerButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Email already exists",
        );
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
      });
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      // First login
      const mockUser = {
        id: "1",
        email: "test@example.com",
        role: "student" as const,
        firstName: "John",
        lastName: "Doe",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLoginResponse = {
        success: true,
        message: "Success",
        data: {
          user: mockUser,
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 900,
        },
      };

      mockApiClient.post.mockResolvedValue({
        ...mockLoginResponse,
        message: "Success",
      } as unknown as ApiResponse<typeof mockLoginResponse.data>);
      mockTokenManager.getRefreshToken.mockReturnValue("refresh-token");

      renderWithAuthProvider(<TestComponent />);

      // Login first
      const loginButton = screen.getByText("Login");
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "true",
        );
      });

      // Then logout
      const logoutButton = screen.getByText("Logout");
      await act(async () => {
        logoutButton.click();
      });

      await waitFor(() => {
        expect(mockTokenManager.clearTokens).toHaveBeenCalled();
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
      });
    });

    it("should logout even if API call fails", async () => {
      mockTokenManager.getRefreshToken.mockReturnValue("refresh-token");
      mockApiClient.post.mockRejectedValue(new Error("Network error"));

      renderWithAuthProvider(<TestComponent />);

      const logoutButton = screen.getByText("Logout");

      await act(async () => {
        logoutButton.click();
      });

      await waitFor(() => {
        expect(mockTokenManager.clearTokens).toHaveBeenCalled();
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
      });
    });
  });

  describe("clearError", () => {
    it("should clear error state", async () => {
      mockApiClient.post.mockRejectedValue(new Error("Network error"));

      renderWithAuthProvider(<TestComponent />);

      // Trigger error
      const loginButton = screen.getByText("Login");
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Network error");
      });

      // Clear error
      const clearErrorButton = screen.getByText("Clear Error");
      await act(async () => {
        clearErrorButton.click();
      });

      expect(screen.getByTestId("error")).toHaveTextContent("no-error");
    });
  });

  describe("useAuth hook", () => {
    it("should throw error when used outside AuthProvider", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("withAuth HOC", () => {
    const TestPage = () => <div>Protected Page</div>;

    it("should render component when authenticated", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        role: "student" as const,
        firstName: "John",
        lastName: "Doe",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTokenManager.getAccessToken.mockReturnValue("valid-token");
      mockTokenManager.isTokenValid.mockReturnValue(true);
      mockApiClient.get.mockResolvedValue({
        success: true,
        message: "Success",
        data: { user: mockUser },
      });

      const ProtectedPage = withAuth(TestPage);

      renderWithAuthProvider(<ProtectedPage />);

      await waitFor(() => {
        expect(screen.getByText("Protected Page")).toBeInTheDocument();
      });
    });

    it("should show loading state initially", () => {
      const ProtectedPage = withAuth(TestPage);

      renderWithAuthProvider(<ProtectedPage />);

      expect(screen.getByRole("generic")).toBeInTheDocument(); // Loading spinner container
    });

    it("should show authentication required when not authenticated", async () => {
      const ProtectedPage = withAuth(TestPage);

      renderWithAuthProvider(<ProtectedPage />);

      await waitFor(() => {
        expect(screen.getByText("Authentication Required")).toBeInTheDocument();
        expect(
          screen.getByText("Please log in to access this page."),
        ).toBeInTheDocument();
      });
    });

    it("should show access denied for wrong role", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        role: "student" as const,
        firstName: "John",
        lastName: "Doe",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTokenManager.getAccessToken.mockReturnValue("valid-token");
      mockTokenManager.isTokenValid.mockReturnValue(true);
      mockApiClient.get.mockResolvedValue({
        success: true,
        message: "Success",
        data: { user: mockUser },
      });

      const ProtectedPage = withAuth(TestPage, "admin");

      renderWithAuthProvider(<ProtectedPage />);

      await waitFor(() => {
        expect(screen.getByText("Access Denied")).toBeInTheDocument();
        expect(
          screen.getByText("You don't have permission to access this page."),
        ).toBeInTheDocument();
      });
    });
  });
});
