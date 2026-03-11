import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  useApi,
  useGet,
  usePost,
  usePut,
  useDelete,
  useFileUpload,
  usePaginatedApi,
} from "../useApi";
import { apiClient, ApiResponse } from "../../services/api";

// Mock the API client
vi.mock("../../services/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    uploadFile: vi.fn(),
    withRetry: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);

describe("useApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic functionality", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(() =>
        useApi(() =>
          Promise.resolve({ success: true, data: null, message: "" }),
        ),
      );

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBe(false);
      expect(typeof result.current.execute).toBe("function");
      expect(typeof result.current.reset).toBe("function");
    });

    it("should handle successful API call", async () => {
      const mockData = { id: 1, name: "Test" };
      const mockResponse = { success: true, data: mockData };

      mockApiClient.get.mockResolvedValue({
        ...mockResponse,
        message: "Success",
      } as unknown as ApiResponse<typeof mockData>);

      const { result } = renderHook(() => useApi(() => apiClient.get("/test")));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBe(true);
    });

    it("should handle failed API call", async () => {
      const mockResponse = { success: false, message: "API Error" };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useApi(() => apiClient.get("/test")));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe("API Error");
      expect(result.current.success).toBe(false);
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network error");

      mockApiClient.get.mockRejectedValue(networkError);

      const { result } = renderHook(() => useApi(() => apiClient.get("/test")));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe("Network error");
      expect(result.current.success).toBe(false);
    });

    it("should set loading state during API call", async () => {
      let resolvePromise: (value: ApiResponse<unknown>) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockApiClient.get.mockReturnValue(
        promise as unknown as Promise<ApiResponse<unknown>>,
      );

      const { result } = renderHook(() => useApi(() => apiClient.get("/test")));

      act(() => {
        result.current.execute();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!({ success: true, data: { id: 1 }, message: "Success" });
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("options", () => {
    it("should execute immediately when immediate option is true", async () => {
      const mockData = { id: 1 };
      const mockResponse = { success: true, data: mockData };

      mockApiClient.get.mockResolvedValue({
        ...mockResponse,
        message: "Success",
      } as unknown as ApiResponse<typeof mockData>);

      renderHook(() =>
        useApi(() => apiClient.get("/test"), { immediate: true }),
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith("/test");
      });
    });

    it("should call onSuccess callback on successful API call", async () => {
      const mockData = { id: 1 };
      const mockResponse = { success: true, data: mockData };
      const onSuccess = vi.fn();

      mockApiClient.get.mockResolvedValue({
        ...mockResponse,
        message: "Success",
      } as unknown as ApiResponse<typeof mockData>);

      const { result } = renderHook(() =>
        useApi(() => apiClient.get("/test"), { onSuccess }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onSuccess).toHaveBeenCalledWith(mockData);
    });

    it("should call onError callback on failed API call", async () => {
      const mockResponse = { success: false, message: "API Error" };
      const onError = vi.fn();

      mockApiClient.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useApi(() => apiClient.get("/test"), { onError }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "API Error",
        }),
      );
    });

    it("should call onFinally callback after API call", async () => {
      const mockData = { id: 1 };
      const mockResponse = { success: true, data: mockData };
      const onFinally = vi.fn();

      mockApiClient.get.mockResolvedValue({
        ...mockResponse,
        message: "Success",
      } as unknown as ApiResponse<typeof mockData>);

      const { result } = renderHook(() =>
        useApi(() => apiClient.get("/test"), { onFinally }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onFinally).toHaveBeenCalled();
    });

    it("should use retry mechanism when retry option is enabled", async () => {
      const mockData = { id: 1 };
      const mockResponse = { success: true, data: mockData };

      mockApiClient.withRetry.mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useApi(() => apiClient.get("/test"), { retry: true, retryAttempts: 3 }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(mockApiClient.withRetry).toHaveBeenCalledWith(
        expect.any(Function),
        3,
      );
    });
  });

  describe("reset functionality", () => {
    it("should reset state to initial values", async () => {
      const mockData = { id: 1 };
      const mockResponse = { success: true, data: mockData };

      mockApiClient.get.mockResolvedValue({
        ...mockResponse,
        message: "Success",
      } as unknown as ApiResponse<typeof mockData>);

      const { result } = renderHook(() => useApi(() => apiClient.get("/test")));

      // Execute API call
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.success).toBe(true);

      // Reset state
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBe(false);
    });
  });
});

describe("useGet", () => {
  it("should make GET request with correct URL", async () => {
    const mockData = { id: 1 };
    const mockResponse = { success: true, data: mockData };

    mockApiClient.get.mockResolvedValue({
      ...mockResponse,
      message: "Success",
    } as unknown as ApiResponse<typeof mockData>);

    const { result } = renderHook(() => useGet("/api/test"));

    await act(async () => {
      await result.current.execute();
    });

    expect(mockApiClient.get).toHaveBeenCalledWith("/api/test");
    expect(result.current.data).toEqual(mockData);
  });
});

describe("usePost", () => {
  it("should make POST request with data", async () => {
    const mockData = { id: 1 };
    const postData = { name: "Test" };
    const mockResponse = { success: true, data: mockData };

    mockApiClient.post.mockResolvedValue({
      ...mockResponse,
      message: "Success",
    } as unknown as ApiResponse<typeof mockData>);

    const { result } = renderHook(() => usePost("/api/test"));

    await act(async () => {
      await result.current.execute(postData);
    });

    expect(mockApiClient.post).toHaveBeenCalledWith("/api/test", postData);
    expect(result.current.data).toEqual(mockData);
  });
});

describe("usePut", () => {
  it("should make PUT request with data", async () => {
    const mockData = { id: 1, name: "Updated" };
    const putData = { name: "Updated" };
    const mockResponse = { success: true, data: mockData };

    mockApiClient.put.mockResolvedValue({
      ...mockResponse,
      message: "Success",
    } as unknown as ApiResponse<typeof mockData>);

    const { result } = renderHook(() => usePut("/api/test/1"));

    await act(async () => {
      await result.current.execute(putData);
    });

    expect(mockApiClient.put).toHaveBeenCalledWith("/api/test/1", putData);
    expect(result.current.data).toEqual(mockData);
  });
});

describe("useDelete", () => {
  it("should make DELETE request", async () => {
    const mockResponse = { success: true, message: "", data: null };

    mockApiClient.delete.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDelete("/api/test/1"));

    await act(async () => {
      await result.current.execute();
    });

    expect(mockApiClient.delete).toHaveBeenCalledWith("/api/test/1");
    expect(result.current.success).toBe(true);
  });
});

describe("useFileUpload", () => {
  it("should handle file upload with progress tracking", async () => {
    const mockFile = new File(["test"], "test.txt", { type: "text/plain" });
    const mockResponse = {
      success: true,
      message: "",
      data: { url: "https://example.com/file.pdf" },
    };

    mockApiClient.uploadFile.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useFileUpload("/api/upload"));

    await act(async () => {
      await result.current.upload(mockFile);
    });

    expect(mockApiClient.uploadFile).toHaveBeenCalledWith(
      "/api/upload",
      mockFile,
      expect.any(Function),
    );
    expect(result.current.data).toEqual(mockResponse.data);
    expect(result.current.uploadProgress).toBeDefined();
  });
});

describe("usePaginatedApi", () => {
  it("should handle paginated data correctly", async () => {
    const mockPage1Data = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];
    const mockPage2Data = [
      { id: 3, name: "Item 3" },
      { id: 4, name: "Item 4" },
    ];

    const mockPage1Response = {
      success: true,
      message: "Page 1 loaded",
      data: {
        data: mockPage1Data,
        total: 4,
        page: 1,
        limit: 2,
        hasMore: true,
      },
    };

    const mockPage2Response = {
      success: true,
      message: "Page 2 loaded",
      data: {
        data: mockPage2Data,
        total: 4,
        page: 2,
        limit: 2,
        hasMore: false,
      },
    };

    mockApiClient.get
      .mockResolvedValueOnce(
        mockPage1Response as unknown as ApiResponse<
          typeof mockPage1Response.data
        >,
      )
      .mockResolvedValueOnce(
        mockPage2Response as unknown as ApiResponse<
          typeof mockPage2Response.data
        >,
      );

    const { result } = renderHook(() => usePaginatedApi("/api/items"));

    // Load first page
    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual(mockPage1Data);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.page).toBe(1);

    // Load second page
    await act(async () => {
      result.current.loadMore();
    });

    expect(result.current.data).toEqual([...mockPage1Data, ...mockPage2Data]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.page).toBe(2);
  });

  it("should refresh paginated data correctly", async () => {
    const mockData = [{ id: 1, name: "Item 1" }];
    const mockResponse = {
      success: true,
      message: "Success",
      data: {
        data: mockData,
        total: 1,
        page: 1,
        limit: 10,
        hasMore: false,
      },
    };

    mockApiClient.get.mockResolvedValue(
      mockResponse as unknown as ApiResponse<typeof mockResponse.data>,
    );

    const { result } = renderHook(() => usePaginatedApi("/api/items"));

    // Load initial data
    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual(mockData);

    // Refresh data
    await act(async () => {
      result.current.refresh();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.page).toBe(1);
  });
});
