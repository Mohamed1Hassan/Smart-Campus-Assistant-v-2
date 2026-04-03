"use client";
import { Bot, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatbotCardProps {
  href?: string;
}

export default function ChatbotCard({
  href = "/dashboard/student/ai-assistant",
}: ChatbotCardProps) {
  const router = useRouter();

  return (
    <div
      className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => router.push(href)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-800/30 transition-colors">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            AI Assistant
          </h2>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-200 mt-3 font-medium">
        Ask me anything about your schedule, attendance, or campus info
      </p>
    </div>
  );
}
