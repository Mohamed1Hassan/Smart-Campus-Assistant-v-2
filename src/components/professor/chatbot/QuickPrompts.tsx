"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Lightbulb,
  BookOpen,
  FileText,
  HelpCircle,
  Brain,
  Calendar,
  Users,
  ClipboardList,
} from "lucide-react";

interface QuickPromptsProps {
  onPromptSelect: (prompt: string) => void;
  isVisible: boolean;
}

interface PromptCategory {
  title: string;
  prompts: Array<{
    id: string;
    text: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }>;
}

const promptCategories: PromptCategory[] = [
  {
    title: "Course Management",
    prompts: [
      {
        id: "summarize",
        text: "Summarize today's lecture",
        icon: BookOpen,
        color: "from-blue-500 to-blue-600",
      },
      {
        id: "assignment",
        text: "Suggest assignment ideas for Database course",
        icon: Lightbulb,
        color: "from-green-500 to-green-600",
      },
      {
        id: "quiz",
        text: "Generate 5 quiz questions on Machine Learning",
        icon: FileText,
        color: "from-purple-500 to-purple-600",
      },
    ],
  },
  {
    title: "Content Generation",
    prompts: [
      {
        id: "exam",
        text: "Create exam questions for Operating Systems",
        icon: Brain,
        color: "from-orange-500 to-orange-600",
      },
      {
        id: "grading",
        text: "Help me create a grading rubric",
        icon: ClipboardList,
        color: "from-pink-500 to-pink-600",
      },
      {
        id: "explain",
        text: "Explain this concept simply for students",
        icon: HelpCircle,
        color: "from-indigo-500 to-indigo-600",
      },
    ],
  },
  {
    title: "Teaching Assistance",
    prompts: [
      {
        id: "schedule",
        text: "Help me plan my course schedule",
        icon: Calendar,
        color: "from-teal-500 to-teal-600",
      },
      {
        id: "attendance",
        text: "How can I improve student attendance?",
        icon: Users,
        color: "from-cyan-500 to-cyan-600",
      },
    ],
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
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
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

      <div className="space-y-6">
        {promptCategories.map((category, categoryIndex) => (
          <div key={category.title}>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              {category.title}
            </h4>
            <div className="space-y-2">
              {category.prompts.map((prompt, promptIndex) => {
                const globalIndex =
                  promptCategories
                    .slice(0, categoryIndex)
                    .reduce((sum, cat) => sum + cat.prompts.length, 0) +
                  promptIndex;
                return (
                  <motion.button
                    key={prompt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: globalIndex * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onPromptSelect(prompt.text)}
                    className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 bg-gradient-to-br ${prompt.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                      >
                        <prompt.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-textDark group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {prompt.text}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
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
          💡 Pro Tips
        </h4>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <li>�?Be specific about your course and topic</li>
          <li>�?Ask for different difficulty levels</li>
          <li>�?Request examples or explanations</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
