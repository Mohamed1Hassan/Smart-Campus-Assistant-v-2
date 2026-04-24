"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSendMessage,
  isLoading,
  placeholder = "Ask the assistant anything...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (trimmedMessage && !isLoading) {
      onSendMessage(trimmedMessage);
      setMessage("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-cardDark border-t border-gray-200 dark:border-gray-700 p-4"
    >
      <form onSubmit={handleSubmit} className="relative group">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full px-5 py-4 pr-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-[1.5rem] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 dark:focus:border-purple-500 focus:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all resize-none min-h-[56px] max-h-[150px] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm no-scrollbar"
          rows={1}
        />

        {/* Character count */}
        {message.length > 0 && (
          <div className="absolute top-[-20px] right-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">
            {message.length}/1000
          </div>
        )}

        <motion.button
          type="submit"
          disabled={!message.trim() || isLoading}
          whileHover={{ scale: isLoading || !message.trim() ? 1 : 1.05 }}
          whileTap={{ scale: isLoading || !message.trim() ? 1 : 0.95 }}
          aria-label="Send message"
          className="absolute right-2 bottom-2 p-3 sm:p-3.5 bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-800 text-white rounded-xl sm:rounded-[1rem] transition-all duration-300 flex items-center justify-center disabled:cursor-not-allowed shadow-md hover:shadow-lg disabled:shadow-none"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.div>
          ) : (
            <Send className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
