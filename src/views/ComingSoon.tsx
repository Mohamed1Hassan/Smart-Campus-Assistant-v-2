"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8 transition-colors duration-200">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
          {title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 transition-colors duration-200">
          This page is coming soon!
        </p>
        <button
          onClick={() => router.push("/student-dashboard")}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
