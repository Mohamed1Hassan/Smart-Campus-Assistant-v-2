import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (token?: string) => {
  if (socket) return socket;

  // Initialize socket connection
  socket = io(process.env.NEXT_PUBLIC_APP_URL || "", {
    path: "/api/socket",
  });

  if (token) {
    socket.emit("authenticate", { token });
  }

  socket.on("connect", () => {
    console.log("[Socket] Connected");
  });

  socket.on("disconnect", () => {
    console.log("[Socket] Disconnected");
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
