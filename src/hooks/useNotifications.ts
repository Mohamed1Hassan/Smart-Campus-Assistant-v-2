"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Notifications Hook
 * Manages notification state and real-time updates via WebSocket
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../services/api";
import {
  NotificationResponse,
  NotificationStats,
  NotificationFilters,
  NotificationType,
  NotificationCategory,
} from "../types/notification.types";

// WebSocket connection state
interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
}

// Hook state interface
interface UseNotificationsState {
  notifications: NotificationResponse[];
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  wsState: WebSocketState;
}

// Hook options
interface UseNotificationsOptions {
  autoConnect?: boolean;
  realTime?: boolean;
  filters?: NotificationFilters;
}

import { supabase } from "../lib/supabase";

// Main hook
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { realTime = true, filters } = options;
  const { user, isAuthenticated } = useAuth();

  const [state, setState] = useState<UseNotificationsState>({
    notifications: [],
    stats: null,
    loading: false,
    error: null,
    wsState: {
      connected: false,
      reconnecting: false,
      error: null,
    },
  });

  // Initialize Supabase Realtime Channel
  useEffect(() => {
    if (realTime && isAuthenticated && user) {
      const channel = supabase
        .channel(`user:${user.id}`)
        .on(
          'broadcast',
          { event: `user:${user.id}:notification` },
          (payload: any) => {
            console.log('[useNotifications] New notification:', payload);
            setState((prev) => ({
              ...prev,
              notifications: [
                payload?.payload as unknown as NotificationResponse,
                ...prev.notifications,
              ],
            }));
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            setState((prev) => ({
              ...prev,
              wsState: { connected: true, reconnecting: false, error: null },
            }));
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setState((prev) => ({
              ...prev,
              wsState: { connected: false, reconnecting: false, error: status },
            }));
          }
        });

      return () => {
        channel.unsubscribe();
      };
    }
  }, [isAuthenticated, user, realTime]);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (customFilters?: NotificationFilters) => {
      if (!isAuthenticated || !user) return;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const queryParams = new URLSearchParams();
        const activeFilters = customFilters || filters;

        if (activeFilters?.category) {
          queryParams.append("category", activeFilters.category);
        }
        if (activeFilters?.type) {
          queryParams.append("type", activeFilters.type);
        }
        if (activeFilters?.isRead !== undefined) {
          queryParams.append("isRead", activeFilters.isRead.toString());
        }
        if (activeFilters?.limit) {
          queryParams.append("limit", activeFilters.limit.toString());
        }
        if (activeFilters?.offset) {
          queryParams.append("offset", activeFilters.offset.toString());
        }

        const url = `/api/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await apiClient.get<NotificationResponse[]>(url);

        if (response.success) {
          setState((prev) => ({
            ...prev,
            notifications: response.data || [],
            loading: false,
            error: null,
          }));
        } else {
          throw new Error(response.message || "Failed to fetch notifications");
        }
      } catch (error: unknown) {
        const err = error as Error;
        // Use warn instead of error to avoid noisy dev overlays; UI already reflects the failure
        console.warn("Failed to fetch notifications:", err);
        // Clear stale notifications on error to prevent showing incorrect data
        setState((prev) => ({
          ...prev,
          notifications: [],
          loading: false,
          error: err.message || "Failed to fetch notifications",
        }));
      }
    },
    [isAuthenticated, user, filters],
  );

  // Fetch notification stats
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await apiClient.get<NotificationStats>(
        "/api/notifications/stats",
      );

      if (response.success) {
        setState((prev) => ({
          ...prev,
          stats: response.data || null,
        }));
      } else {
        throw new Error(response.message || "Failed to fetch stats");
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.warn("Failed to fetch notification stats:", err);
      // Clear stale stats on error
      setState((prev) => ({
        ...prev,
        stats: null,
      }));
    }
  }, [isAuthenticated, user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await apiClient.patch(
        `/api/notifications/${notificationId}/read`,
      );

      if (response.success) {
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true, readAt: new Date() }
              : notification,
          ),
        }));

        // Update stats
        setState((prev) => ({
          ...prev,
          stats: prev.stats
            ? {
                ...prev.stats,
                unread: Math.max(0, prev.stats.unread - 1),
              }
            : null,
        }));
      }
    } catch (error) {
      console.warn("Failed to mark notification as read:", error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await apiClient.patch("/api/notifications/read-all");

      if (response.success) {
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: new Date(),
          })),
          stats: prev.stats
            ? {
                ...prev.stats,
                unread: 0,
              }
            : null,
        }));
      }
    } catch (error) {
      console.warn("Failed to mark all notifications as read:", error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      const response = await apiClient.delete(
        `/api/notifications/${notificationId}`,
      );

      if (response.success) {
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.filter(
            (n) => n.id !== notificationId,
          ),
        }));

        // Update stats
        setState((prev) => ({
          ...prev,
          stats: prev.stats
            ? {
                ...prev.stats,
                total: Math.max(0, prev.stats.total - 1),
                unread: Math.max(0, prev.stats.unread - 1),
              }
            : null,
        }));
      }
    } catch (error) {
      console.warn("Failed to delete notification:", error);
    }
  }, []);

  // Create notification (for testing or admin use)
  const createNotification = useCallback(
    async (notificationData: {
      title: string;
      message: string;
      type: NotificationType;
      category: NotificationCategory;
      metadata?: unknown;
    }) => {
      try {
        const response = await apiClient.post(
          "/api/notifications",
          notificationData,
        );

        if (response.success) {
          // Refresh notifications
          await fetchNotifications();
          await fetchStats();
        }
      } catch (error) {
        console.warn("Failed to create notification:", error);
      }
    },
    [fetchNotifications, fetchStats],
  );

  // Connect WebSocket manually
  const connectWebSocket = useCallback(() => {
    // Legacy - Supabase handles connection automatically via subscribe()
    console.log('[useNotifications] connectWebSocket called (legacy)');
  }, []);

  // Disconnect WebSocket manually
  const disconnectWebSocket = useCallback(() => {
    // Legacy
    console.log('[useNotifications] disconnectWebSocket called (legacy)');
    setState((prev) => ({
      ...prev,
      wsState: { connected: false, reconnecting: false, error: null },
    }));
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchStats()]);
  }, [fetchNotifications, fetchStats]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user) {
      refresh();
    }
  }, [isAuthenticated, user, refresh]);

  return {
    // State
    notifications: state.notifications,
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    wsState: state.wsState,

    // Actions
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refresh,

    // WebSocket
    connectWebSocket,
    disconnectWebSocket,
    isWebSocketConnected: state.wsState.connected,
  };
}

export default useNotifications;
