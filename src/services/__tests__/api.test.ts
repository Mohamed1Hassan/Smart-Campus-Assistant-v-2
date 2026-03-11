import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { apiClient, TokenManager } from "../api";

// Mock fetch
global.fetch = vi.fn();

const mockFetch = vi.mocked(fetch);

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET requests", () => {
    it("should make successful GET request", async () => {
      const mockData = { id: 1, name: "Test" };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockData,
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await apiClient.get("/api/test");

      expect(mockFetch).toHaveBeenCalledWith("/api/test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual({
        success: true,
        data: mockData,
      });
    });

    it("should include authorization header when token exists", async () => {
      const mockData = { id: 1, name: "Test" };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockData,
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      // Mock token manager
      vi.spyOn(TokenManager, "getAccessToken").mockReturnValue("test-token");

      await apiClient.get("/api/test");

      expect(mockFetch).toHaveBeenCalledWith("/api/test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
      });
    });

    it("should handle GET request errors", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({
          success: false,
          message: "Not found",
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await apiClient.get("/api/test");

      expect(result).toEqual({
        success: false,
        message: "Not found",
      });
    });
  });

  describe("POST requests", () => {
    it("should make successful POST request with data", async () => {
      const requestData = { name: "Test" };
      const mockData = { id: 1, name: "Test" };
      const mockResponse = {
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockData,
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await apiClient.post("/api/test", requestData);

      expect(mockFetch).toHaveBeenCalledWith("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      expect(result).toEqual({
        success: true,
        data: mockData,
      });
    });

    it("should handle POST request without data", async () => {
      const mockData = { id: 1 };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockData,
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await apiClient.post("/api/test");

      expect(mockFetch).toHaveBeenCalledWith("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: undefined,
      });

      expect(result).toEqual({
        success: true,
        data: mockData,
      });
    });
  });

  describe("PUT requests", () => {
    it("should make successful PUT request", async () => {
      const requestData = { name: "Updated" };
      const mockData = { id: 1, name: "Updated" };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockData,
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await apiClient.put("/api/test/1", requestData);

      expect(mockFetch).toHaveBeenCalledWith("/api/test/1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      expect(result).toEqual({
        success: true,
        data: mockData,
      });
    });
  });

  describe("DELETE requests", () => {
    it("should make successful DELETE request", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: null,
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await apiClient.delete("/api/test/1");

      expect(mockFetch).toHaveBeenCalledWith("/api/test/1", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(result).toEqual({
        success: true,
        data: null,
      });
    });
  });

  describe("PATCH requests", () => {
    it("should make successful PATCH request", async () => {
      const requestData = { name: "Partially Updated" };
      const mockData = { id: 1, name: "Partially Updated" };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockData,
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await apiClient.patch("/api/test/1", requestData);

      expect(mockFetch).toHaveBeenCalledWith("/api/test/1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      expect(result).toEqual({
        success: true,
        data: mockData,
      });
    });
  });

  describe("file upload", () => {
    it("should upload file successfully", async () => {
      const mockFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      const mockData = { url: "https://example.com/file.txt" };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockData,
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const onProgress = vi.fn();
      const result = await apiClient.uploadFile(
        "/api/upload",
        mockFile,
        onProgress,
      );

      expect(mockFetch).toHaveBeenCalledWith("/api/upload", {
        method: "POST",
        headers: {
          Authorization: undefined, // No token in this test
        },
        body: expect.any(FormData),
      });

      expect(result).toEqual({
        success: true,
        data: mockData,
      });
    });
  });

  describe("retry mechanism", () => {
    it("should retry failed requests", async () => {
      const mockData = { id: 1 };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockData,
        }),
      };

      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await apiClient.withRetry(
        () => apiClient.get("/api/test"),
        2,
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        data: mockData,
      });
    });

    it("should fail after max retries", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(
        apiClient.withRetry(() => apiClient.get("/api/test"), 2),
      ).rejects.toThrow("Network error");

      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe("error handling", () => {
    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(apiClient.get("/api/test")).rejects.toThrow("Network error");
    });

    it("should handle JSON parsing errors", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      };

      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      await expect(apiClient.get("/api/test")).rejects.toThrow("Invalid JSON");
    });

    it("should handle non-JSON responses", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("Plain text response"),
      };

      // Mock response without json method
      delete (mockResponse as { json?: unknown }).json;
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const result = await apiClient.get("/api/test");

      expect(result).toEqual({
        success: true,
        data: "Plain text response",
      });
    });
  });

  describe("token management integration", () => {
    it("should refresh token on 401 error", async () => {
      const mockUser = { id: "1", email: "test@example.com" };

      // First call returns 401
      const unauthorizedResponse = {
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({
          success: false,
          message: "Unauthorized",
        }),
      };

      // Second call (after refresh) succeeds
      const successResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockUser,
        }),
      };

      mockFetch
        .mockResolvedValueOnce(unauthorizedResponse as unknown as Response)
        .mockResolvedValueOnce(successResponse as unknown as Response);

      // Mock token manager
      vi.spyOn(TokenManager, "getAccessToken").mockReturnValue("expired-token");
      vi.spyOn(TokenManager, "getRefreshToken").mockReturnValue(
        "refresh-token",
      );
      vi.spyOn(TokenManager, "setTokens").mockImplementation(() => {});
      vi.spyOn(TokenManager, "clearTokens").mockImplementation(() => {});

      const result = await apiClient.get("/api/test");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        data: mockUser,
      });
    });
  });
});
