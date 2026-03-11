"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Trash2, MessageSquare, AlertCircle } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { useChat } from "./hooks/useChat";

interface ChatContainerProps {
  className?: string;
}

export default function ChatContainer({ className = "" }: ChatContainerProps) {
  const {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    endSession,
    exportChat,
  } = useChat();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const previousMessageCount = useRef(0);

  // Ensure scroll position is at top when component first mounts
  useEffect(() => {
    // Reset scroll position to top on initial mount
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  // Additional scroll reset when messages are first loaded from localStorage
  useEffect(() => {
    if (messages.length > 0 && isInitialLoadRef.current) {
      // Small delay to ensure messages are rendered, then reset scroll
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      }, 150);

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

  const handleClearConfirm = () => {
    if (endSession) {
      endSession();
    } else {
      clearChat();
    }
    setShowClearConfirm(false);
  };

  const handleExport = () => {
    exportChat();
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-cardDark"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg"
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-textDark">
              Smart Campus Assistant
            </h2>
            <p className="text-sm text-gray-600 dark:text-mutedDark">
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            disabled={messages.length === 0}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Export chat history"
            title="Export chat"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowClearConfirm(true)}
            disabled={messages.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label="End Session"
            title="End Session"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium hidden sm:inline">
              End Session
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50 dark:bg-gray-900/50 scroll-auto"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6"
            >
              <MessageSquare className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </motion.div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-textDark mb-2">
              Welcome to Smart Campus Assistant! 👋
            </h3>
            <p className="text-gray-600 dark:text-mutedDark mb-6 max-w-md">
              I&apos;m here to help you with your university life. Ask me about
              your schedule, campus locations, assignments, or anything else you
              need!
            </p>

            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Hello",
                "What's my next class?",
                "Where is the library?",
                "Help me with assignments",
              ].map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage(suggestion)}
                  className="px-4 py-2 bg-white dark:bg-cardDark border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-700 dark:text-textDark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
                  aria-label={`Send message: ${suggestion}`}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Messages List */
          <AnimatePresence>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-start mb-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <div className="w-4 h-4 bg-gray-400 dark:bg-gray-500 rounded-full" />
                  </div>
                  <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 py-3">
                    <TypingIndicator />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={sendMessage}
        isLoading={isLoading}
        placeholder="Ask me anything about your university life..."
      />

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-cardDark rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-textDark">
                    Clear Chat History
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-mutedDark">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-700 dark:text-textDark mb-6">
                Are you sure you want to clear all chat messages? This will
                permanently delete your conversation history.
              </p>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-textDark rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClearConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Clear Chat
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
