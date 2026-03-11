// Simple WebSocket service with safe no-op in development if URL not configured
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();
  private enabled = true;
  private wsUrl: string | null = null;

  constructor() {
    // Prefer Vite env; fallback to NODE_ENV heuristic
    const viteUrl =
      (typeof import.meta !== "undefined" &&
        (import.meta as unknown as { env: Record<string, string> }).env &&
        (import.meta as unknown as { env: Record<string, string> }).env
          .VITE_WEBSOCKET_URL) ||
      "";
    const nodeEnv =
      (typeof process !== "undefined" &&
        process.env &&
        (process.env as Record<string, string>).NODE_ENV) ||
      "development";
    this.wsUrl =
      viteUrl || (nodeEnv === "production" ? "wss://your-domain.com/ws" : "");
    this.enabled = !!this.wsUrl;
    if (!this.enabled) {
      console.info("[WebSocket] Disabled (no VITE_WEBSOCKET_URL configured)");
      return;
    }
    this.connect();
  }

  private connect() {
    if (!this.enabled || !this.wsUrl) return;
    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.event, data.data);
        } catch (error) {
          console.error("WebSocket message parse error:", error);
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        // Downgrade to warn to avoid console noise when disabled on server
        console.warn("WebSocket error:", error);
      };
    } catch (error) {
      console.warn("WebSocket connection error:", error);
      this.reconnect();
    }
  }

  private reconnect() {
    if (!this.enabled) return;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.warn("Max reconnection attempts reached");
    }
  }

  public emit(event: string, data: unknown) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((listener) => listener(data));
  }

  public on(event: string, callback: (data: unknown) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback?: (data: unknown) => void) {
    if (callback) {
      const listeners = this.eventListeners.get(event) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.eventListeners.delete(event);
    }
  }

  public send(event: string, data: unknown) {
    if (!this.enabled) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    } else {
      // Silent when offline to avoid noise in dev
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export singleton instance
let wsService: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService => {
  if (!wsService) {
    wsService = new WebSocketService();
  }
  return wsService;
};

export default WebSocketService;
