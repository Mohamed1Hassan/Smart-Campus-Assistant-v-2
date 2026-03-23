import { motion } from "framer-motion";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "student" | "ai";
  timestamp: Date;
}

interface ChatMessageProps {
  message: ChatMessage;
  index: number;
}

export default function ChatMessage({ message, index }: ChatMessageProps) {
  const isStudent = message.sender === "student";

  // Use Unicode escape sequences to avoid raw emoji parsing issues in some Babel setups
  const studentAvatar = "\u{1F468}\u200D\u{1F393}";
  const aiAvatar = "\u{1F916}"; // 🤖

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
        duration: 0.4,
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
      }}
      className={`flex ${isStudent ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`flex items-start gap-3 max-w-[80%] ${isStudent ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
            isStudent
              ? "bg-gradient-to-br from-blue-500 to-blue-600"
              : "bg-gradient-to-br from-purple-500 to-purple-600"
          }`}
        >
          {isStudent ? studentAvatar : aiAvatar}
        </div>

        {/* Message Bubble */}
        <div className="flex flex-col">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`relative px-4 py-3 rounded-2xl shadow-sm ${
              isStudent
                ? "bg-blue-500 text-white rounded-br-md"
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-textDark border border-gray-200 dark:border-gray-700 rounded-bl-md"
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.text}
            </p>
          </motion.div>

          {/* Timestamp */}
          <span
            className={`text-xs text-gray-500 dark:text-mutedDark mt-1 ${
              isStudent ? "text-right" : "text-left"
            }`}
          >
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
