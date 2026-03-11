import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  attendanceService,
  AttendanceSession,
  CreateSessionData,
  UpdateSessionData,
  SessionStats,
  PaginationParams,
} from "../services/attendance.service";

interface UseAttendanceSessionsReturn {
  // Data
  sessions: AttendanceSession[];
  selectedSession: AttendanceSession | null;
  stats: SessionStats | null;

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isStarting: boolean;
  isStopping: boolean;
  isPausing: boolean;
  isGeneratingQR: boolean;

  // Error states
  error: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  startError: string | null;
  stopError: string | null;
  pauseError: string | null;
  qrError: string | null;

  // Actions
  createSession: (
    sessionData: CreateSessionData,
  ) => Promise<AttendanceSession | null>;
  updateSession: (
    sessionId: string,
    updates: UpdateSessionData,
  ) => Promise<boolean>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  startSession: (sessionId: string) => Promise<boolean>;
  stopSession: (sessionId: string) => Promise<boolean>;
  pauseSession: (sessionId: string) => Promise<boolean>;
  generateQRCode: (sessionId: string) => Promise<string | null>;
  loadSessions: (params?: PaginationParams) => Promise<void>;
  loadSessionById: (sessionId: string) => Promise<void>;
  loadStats: (professorId?: string) => Promise<void>;
  getSessionRecords: (
    sessionId: string,
    params?: PaginationParams,
  ) => Promise<unknown>;
  setSelectedSession: (session: AttendanceSession | null) => void;
  clearErrors: () => void;
}

export const useAttendanceSessions = (): UseAttendanceSessionsReturn => {
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] =
    useState<AttendanceSession | null>(null);

  // Error states (kept local for specific actions)
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [stopError, setStopError] = useState<string | null>(null);
  const [pauseError, setPauseError] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setCreateError(null);
    setUpdateError(null);
    setDeleteError(null);
    setStartError(null);
    setStopError(null);
    setPauseError(null);
    setQrError(null);
  }, []);

  const EMPTY_ARRAY: AttendanceSession[] = [];

  // 1. Fetch Sessions (Query)
  const {
    data: sessions = EMPTY_ARRAY,
    isLoading,
    error: queryError,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ["attendance-sessions"],
    queryFn: async () => {
      const response = await attendanceService.getSessions();
      if (response.success && response.data) {
        // Handle both direct array and paginated structure
        return Array.isArray(response.data)
          ? response.data
          : (response.data as { data: AttendanceSession[] }).data ||
              response.data;
      }
      const errorMsg =
        typeof response.error === "string"
          ? response.error
          : JSON.stringify(response.error);
      throw new Error(errorMsg || "Failed to load sessions");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // 2. Fetch Stats (Query)
  const { data: stats = null, refetch: refetchStats } = useQuery({
    queryKey: ["attendance-stats"],
    queryFn: async () => {
      const response = await attendanceService.getSessionStats();
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Helper to invalidate queries
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["attendance-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["attendance-stats"] });
  };

  // 3. Mutations

  // Create Session
  const createMutation = useMutation({
    mutationFn: async (data: CreateSessionData) => {
      const response = await attendanceService.createSession(data);
      if (!response.success) {
        const errorMsg =
          typeof response.error === "string"
            ? response.error
            : JSON.stringify(response.error);
        throw new Error(errorMsg || "Failed to create session");
      }
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      setCreateError(null);
    },
    onError: (err: Error) => setCreateError(err.message),
  });

  // Update Session
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateSessionData;
    }) => {
      const response = await attendanceService.updateSession(id, updates);
      if (!response.success) {
        const errorMsg =
          typeof response.error === "string"
            ? response.error
            : JSON.stringify(response.error);
        throw new Error(errorMsg || "Failed to update session");
      }
      return response.data;
    },
    onSuccess: (data) => {
      invalidateQueries();
      setUpdateError(null);
      if (selectedSession?.id === data?.id) setSelectedSession(data!);
    },
    onError: (err: Error) => setUpdateError(err.message),
  });

  // Delete Session
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await attendanceService.deleteSession(id);
      if (!response.success) {
        const errorMsg =
          typeof response.error === "string"
            ? response.error
            : JSON.stringify(response.error);
        throw new Error(errorMsg || "Failed to delete session");
      }
      return id;
    },
    onSuccess: (id) => {
      invalidateQueries();
      setDeleteError(null);
      if (selectedSession?.id === id) setSelectedSession(null);
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  // Start Session
  const startMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await attendanceService.startSession(id);
      if (!response.success) {
        const errorMsg =
          typeof response.error === "string"
            ? response.error
            : JSON.stringify(response.error);
        throw new Error(errorMsg || "Failed to start session");
      }
      return response.data;
    },
    onSuccess: (data) => {
      invalidateQueries();
      setStartError(null);
      if (selectedSession?.id === data?.id) setSelectedSession(data!);
    },
    onError: (err: Error) => setStartError(err.message),
  });

  // Stop Session
  const stopMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await attendanceService.stopSession(id);
      if (!response.success) {
        const errorMsg =
          typeof response.error === "string"
            ? response.error
            : JSON.stringify(response.error);
        throw new Error(errorMsg || "Failed to stop session");
      }
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      setStopError(null);
    },
    onError: (err: Error) => setStopError(err.message),
  });

  // Pause Session
  const pauseMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await attendanceService.pauseSession(id);
      if (!response.success) {
        const errorMsg =
          typeof response.error === "string"
            ? response.error
            : JSON.stringify(response.error);
        throw new Error(errorMsg || "Failed to pause session");
      }
      return response.data;
    },
    onSuccess: (data) => {
      invalidateQueries();
      setPauseError(null);
      if (selectedSession?.id === data?.id) setSelectedSession(data!);
    },
    onError: (err: Error) => setPauseError(err.message),
  });

  // Generate QR
  const qrMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await attendanceService.generateQRCode(id);
      if (!response.success) {
        const errorMsg =
          typeof response.error === "string"
            ? response.error
            : JSON.stringify(response.error);
        throw new Error(errorMsg || "Failed to generate QR code");
      }
      return response.data?.qrCode;
    },
    onSuccess: (qrCode, id) => {
      invalidateQueries();
      setQrError(null);
      if (selectedSession?.id === id && qrCode) {
        setSelectedSession((prev) => (prev ? { ...prev, qrCode } : null));
      }
    },
    onError: (err: Error) => setQrError(err.message),
  });

  // Wrappers to match original interface
  const createSession = async (data: CreateSessionData) => {
    try {
      const result = await createMutation.mutateAsync(data);
      return result || null;
    } catch {
      return null;
    }
  };

  const updateSession = async (id: string, updates: UpdateSessionData) => {
    try {
      await updateMutation.mutateAsync({ id, updates });
      return true;
    } catch {
      return false;
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  const startSession = async (id: string) => {
    try {
      await startMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  const stopSession = async (id: string) => {
    try {
      await stopMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  const pauseSession = async (id: string) => {
    try {
      await pauseMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  const generateQRCode = async (id: string) => {
    try {
      const result = await qrMutation.mutateAsync(id);
      return result || null;
    } catch {
      return null;
    }
  };

  const loadSessions = useCallback(async () => {
    await refetchSessions();
  }, [refetchSessions]);

  const loadStats = async () => {
    await refetchStats();
  };

  // Legacy support for loadSessionById
  const loadSessionById = useCallback(async (sessionId: string) => {
    try {
      const response = await attendanceService.getSessionById(sessionId);
      if (response.success && response.data) {
        setSelectedSession(response.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const getSessionRecords = useCallback(
    async (sessionId: string, params?: PaginationParams) => {
      try {
        const response = await attendanceService.getSessionRecords(
          sessionId,
          params,
        );
        if (response.success) return response.data;
        return null;
      } catch {
        return null;
      }
    },
    [],
  );

  return {
    sessions,
    selectedSession,
    stats,
    isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
    isPausing: pauseMutation.isPending,
    isGeneratingQR: qrMutation.isPending,
    error: queryError ? (queryError as Error).message : null,
    createError,
    updateError,
    deleteError,
    startError,
    stopError,
    pauseError,
    qrError,
    createSession,
    updateSession,
    deleteSession,
    startSession,
    stopSession,
    pauseSession,
    generateQRCode,
    loadSessions,
    loadSessionById,
    loadStats,
    getSessionRecords,
    setSelectedSession,
    clearErrors,
  };
};
