import { NextApiRequest, NextApiResponse } from "next";
import { Server as HTTPServer } from "http";
import { Socket as NetSocket } from "net";
import socketService from "@/services/socket.service";
import { Server as SocketIOServer } from "socket.io";

type SocketWithServer = NetSocket & {
  server: HTTPServer & {
    io?: SocketIOServer;
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (
  req: NextApiRequest,
  res: NextApiResponse & { socket: SocketWithServer },
) => {
  if (!res.socket.server.io) {
    console.log("[SocketAPI] Initializing Socket.io server...");
    const io = socketService.initialize(res.socket.server as HTTPServer);
    res.socket.server.io = io;
  } else {
    // console.log('[SocketAPI] Socket.io server already initialized');
  }
  res.end();
};

export default SocketHandler;
