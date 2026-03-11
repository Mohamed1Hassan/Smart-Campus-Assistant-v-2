"use client";
import { motion } from "framer-motion";
import {
  MessageSquare,
  BookOpen,
  Calendar,
  Brain,
  HelpCircle,
  MapPin,
} from "lucide-react";

interface QuickPromptsProps {
  onPromptClick: (prompt: string) => void;
  className?: string;
}

const quickPrompts = [
  {
    id: "lecture-summary",
    title: "Summarize today's lecture",
    description: "Get a summary of your recent lectures",
    prompt: "Can you summarize today's lecture for me?",
    icon: BookOpen,
    color: "bg-blue-500",
    delay: 0.1,
  },
  {
    id: "next-class",
    title: "What is my next class?",
    description: "Check your upcoming class schedule",
    prompt: "What is my next class?",
    icon: Calendar,
    color: "bg-green-500",
    delay: 0.2,
  },
  {
    id: "quiz-questions",
    title: "Generate quiz questions",
    description: "Create practice questions for any subject",
    prompt: "Generate 5 quiz questions on Machine Learning",
    icon: Brain,
    color: "bg-purple-500",
    delay: 0.3,
  },
  {
    id: "explain-concept",
    title: "Explain a concept",
    description: "Get simple explanations of complex topics",
    prompt: "Explain Linear Algebra simply",
    icon: HelpCircle,
    color: "bg-orange-500",
    delay: 0.4,
  },
  {
    id: "campus-location",
    title: "Find campus location",
    description: "Get directions to rooms and buildings",
    prompt: "Where is Room 203?",
    icon: MapPin,
    color: "bg-red-500",
    delay: 0.5,
  },
  {
    id: "general-help",
    title: "General help",
    description: "Ask about university services",
    prompt: "What services are available for students?",
    icon: MessageSquare,
    color: "bg-indigo-500",
    delay: 0.6,
  },
];

export default function QuickPrompts({
  onPromptClick,
  className = "",
}: QuickPromptsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg"
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </motion.div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-textDark">
            Quick Prompts
          </h3>
          <p className="text-sm text-gray-600 dark:text-mutedDark">
            Click to get started quickly
          </p>
        </div>
      </div>

      {/* Prompts Grid */}
      <div className="space-y-3">
        {quickPrompts.map((prompt) => {
          const Icon = prompt.icon;
          return (
            <motion.button
              key={prompt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prompt.delay }}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPromptClick(prompt.prompt)}
              className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
              aria-label={`${prompt.title}: ${prompt.description}`}
            >
              <div className="flex items-start gap-3">
                <motion.div
                  whileHover={{ rotate: 5 }}
                  className={`p-2 rounded-lg ${prompt.color} shadow-sm`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-textDark mb-1 group-hover:underline">
                    {prompt.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-mutedDark leading-relaxed">
                    {prompt.description}
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full" />
                </motion.div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"
      >
        <p className="text-xs text-gray-600 dark:text-mutedDark text-center">
          💡 <strong>Tip:</strong> You can also type your own questions in the
          chat input below
        </p>
      </motion.div>
    </motion.div>
  );
}
