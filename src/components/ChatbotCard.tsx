"use client";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";

interface ChatbotCardProps {
  href?: string;
}

const MiniRobot = () => (
  <m.div
    className="relative w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800/50 shadow-sm"
    whileHover={{ scale: 1.05, rotate: [-3, 3, -3, 0] }}
    transition={{ duration: 0.3 }}
  >
    <m.div
      animate={{ y: [-1.5, 1.5, -1.5] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="relative w-6 h-5 bg-gray-900 dark:bg-gray-800 rounded-[0.4rem] shadow-md flex items-center justify-center gap-1 overflow-hidden"
    >
       <m.div
          animate={{ scaleY: [1, 0.1, 1, 1, 1] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1, 0.5, 1] }}
          className="w-1 h-2 bg-blue-400 rounded-full shadow-[0_0_4px_#60a5fa]"
        />
       <m.div
          animate={{ scaleY: [1, 0.1, 1, 1, 1] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1, 0.5, 1] }}
          className="w-1 h-2 bg-blue-400 rounded-full shadow-[0_0_4px_#60a5fa]"
        />
    </m.div>
  </m.div>
);

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
          <MiniRobot />
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
