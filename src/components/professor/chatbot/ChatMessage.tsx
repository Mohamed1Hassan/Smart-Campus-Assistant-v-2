import { motion } from "framer-motion";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "professor" | "ai";
  timestamp: Date;
}

interface ChatMessageProps {
  message: ChatMessage;
  index: number;
}

export default function ChatMessage({ message, index }: ChatMessageProps) {
  const isProfessor = message.sender === "professor";

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
        ease: "easeOut",
      }}
      className={`flex gap-3 mb-4 ${isProfessor ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
          isProfessor
            ? "bg-gradient-to-br from-blue-500 to-blue-600"
            : "bg-gradient-to-br from-purple-500 to-purple-600"
        }`}
      >
        {isProfessor ? "P" : "B"}
      </div>

      {/* Message Bubble */}
      <div className="flex flex-col">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`relative px-4 py-3 rounded-2xl shadow-sm ${
            isProfessor
              ? "bg-blue-500 text-white rounded-br-md"
              : "bg-gray-100 text-gray-900 rounded-bl-md"
          }`}
        >
          {/* Message Text */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.text}
          </p>

          {/* Timestamp */}
          <div
            className={`text-xs mt-1 ${
              isProfessor ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {formatTime(message.timestamp)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
