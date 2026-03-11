"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ChatMessageComponent, {
  ChatMessage as ChatMessageType,
} from "./ChatMessage";

interface ChatContainerProps {
  messages: ChatMessageType[];
  isLoading: boolean;
}

export default function ChatContainer({
  messages,
  isLoading,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad] = useState(true);
  const previousMessageCount = useRef(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const isNewMessage = messages.length > previousMessageCount.current;

      if (isInitialLoad && containerRef.current) {
        // Initial load: reset scroll to top
        containerRef.current.scrollTop = 0;
      } else if (isNewMessage && !isLoading) {
        // New message: scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }

      previousMessageCount.current = messages.length;
    }
  }, [messages.length, isLoading, isInitialLoad]);

  // Show welcome message when no messages
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🤖</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-textDark mb-3">
            Welcome to AI Teaching Assistant
          </h3>
          <p className="text-gray-500 dark:text-mutedDark mb-6">
            I&apos;m here to help you with course materials, generate quizzes,
            explain concepts, and assist with your teaching workflow.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="font-medium text-blue-800 dark:text-blue-300">
                📚 Course Help
              </span>
              <p className="text-blue-600 dark:text-blue-400">
                Summaries, explanations
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="font-medium text-green-800 dark:text-green-300">
                📝 Generate Content
              </span>
              <p className="text-green-600 dark:text-green-400">
                Quizzes, assignments
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="font-medium text-purple-800 dark:text-purple-300">
                💡 Teaching Tips
              </span>
              <p className="text-purple-600 dark:text-purple-400">
                Best practices
              </p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span className="font-medium text-orange-800 dark:text-orange-300">
                🎯 Assessment
              </span>
              <p className="text-orange-600 dark:text-orange-400">
                Rubrics, grading
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-6 space-y-4 scroll-auto"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
      aria-atomic="false"
    >
      {messages.map((message, index) => (
        <ChatMessageComponent
          key={message.id}
          message={message}
          index={index}
        />
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start mb-4"
        >
          <div className="flex items-start gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-lg flex-shrink-0">
              🤖
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                </div>
                <span className="text-sm text-gray-500 dark:text-mutedDark ml-2">
                  AI is thinking...
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
