"use client";
import { useEffect, useRef } from "react";
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
  const isInitialLoadRef = useRef(true);
  const previousMessageCount = useRef(0);

  // Ensure scroll position is at top when component first mounts
  useEffect(() => {
    // Reset container scroll position to top on initial mount
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  // Reset container scroll to top when messages are first loaded from localStorage
  useEffect(() => {
    if (messages.length > 0 && isInitialLoadRef.current) {
      // Small delay to ensure messages are rendered, then reset container scroll
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
        isInitialLoadRef.current = false;
      }, 200); // Increased delay to ensure page-level scroll reset happens first

      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Auto-scroll to bottom when new messages arrive (but not on initial load)
  useEffect(() => {
    // Skip auto-scroll on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      previousMessageCount.current = messages.length;
      return;
    }

    // Only auto-scroll if new messages were added
    if (messages.length > previousMessageCount.current) {
      // Use a small delay to ensure the message is rendered
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
    previousMessageCount.current = messages.length;
  }, [messages, isLoading]);

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
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🤖</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-textDark mb-3">
            Welcome to AI Study Assistant
          </h3>
          <p className="text-gray-500 dark:text-mutedDark mb-6">
            I&apos;m here to help you with your studies, explain concepts, solve
            problems, and assist with your academic journey.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="font-medium text-blue-800 dark:text-blue-300">
                📚 Study Help
              </span>
              <p className="text-blue-600 dark:text-blue-400">
                Explanations, summaries
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="font-medium text-green-800 dark:text-green-300">
                💡 Problem Solving
              </span>
              <p className="text-green-600 dark:text-green-400">
                Step-by-step solutions
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="font-medium text-purple-800 dark:text-purple-300">
                🎯 Exam Prep
              </span>
              <p className="text-purple-600 dark:text-purple-400">
                Practice questions
              </p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span className="font-medium text-orange-800 dark:text-orange-300">
                📝 Assignments
              </span>
              <p className="text-orange-600 dark:text-orange-400">
                Writing help, research
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
      aria-label="AI assistant chat messages"
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-lg flex-shrink-0">
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
