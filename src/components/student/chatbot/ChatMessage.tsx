import { motion } from "framer-motion";
import { User, Bot } from "lucide-react";
import { ChatMessage as ChatMessageType } from "./hooks/useChat";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${message.isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`flex items-start gap-3 max-w-[80%] ${message.isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            message.isUser
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          {message.isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </motion.div>

        {/* Message Card - Using Professor Dashboard card styling */}
        <motion.div
          initial={{ opacity: 0, x: message.isUser ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className={`relative group bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200 ${
            message.isUser
              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              : ""
          }`}
        >
          {/* Message Text */}
          <div
            className={`text-sm leading-relaxed whitespace-pre-wrap ${
              message.isUser
                ? "text-blue-900 dark:text-blue-100"
                : "text-gray-900 dark:text-textDark"
            }`}
          >
            {message.text}
          </div>

          {/* Timestamp */}
          <div
            className={`text-xs mt-2 ${
              message.isUser
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-mutedDark"
            }`}
          >
            {formatTime(message.timestamp)}
          </div>

          {/* Language Indicator */}
          {message.language && (
            <div
              className={`absolute -bottom-1 -right-1 text-xs px-1.5 py-0.5 rounded-full ${
                message.language === "ar"
                  ? "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                  : "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              }`}
            >
              {message.language === "ar" ? "عربي" : "EN"}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
