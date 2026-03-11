"use client";
import { motion } from "framer-motion";
import {
  Lightbulb,
  BookOpen,
  FileText,
  HelpCircle,
  Brain,
  Calculator,
} from "lucide-react";

interface QuickPromptsProps {
  onPromptSelect: (prompt: string) => void;
  isVisible: boolean;
}

const quickPrompts = [
  {
    id: "explain",
    text: "Explain this concept in simple terms",
    icon: HelpCircle,
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "solve",
    text: "Help me solve this math problem step by step",
    icon: Calculator,
    color: "from-green-500 to-green-600",
  },
  {
    id: "summarize",
    text: "Summarize the key points from my lecture notes",
    icon: BookOpen,
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "practice",
    text: "Give me practice questions for my upcoming exam",
    icon: Brain,
    color: "from-orange-500 to-orange-600",
  },
  {
    id: "assignment",
    text: "Help me structure my essay on this topic",
    icon: FileText,
    color: "from-pink-500 to-pink-600",
  },
  {
    id: "study",
    text: "Create a study plan for my final exams",
    icon: Lightbulb,
    color: "from-indigo-500 to-indigo-600",
  },
];

export default function QuickPrompts({
  onPromptSelect,
  isVisible,
}: QuickPromptsProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-cardDark rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-fit"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-textDark">
            Quick Prompts
          </h3>
          <p className="text-sm text-gray-500 dark:text-mutedDark">
            Click to get started
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {quickPrompts.map((prompt, index) => (
          <motion.button
            key={prompt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPromptSelect(prompt.text)}
            className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 bg-gradient-to-br ${prompt.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
              >
                <prompt.icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-textDark group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {prompt.text}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Additional Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
      >
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
          {"\u{1F4A1}"} Pro Tips
        </h4>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <li>- Be specific about your subject and topic</li>
          <li>- Ask for different difficulty levels</li>
          <li>- Request examples or step-by-step solutions</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
