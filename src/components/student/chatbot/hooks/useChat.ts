import { useState, useEffect, useCallback } from "react";
import {
  detectLanguage,
  findBestMatch,
  getReply,
} from "../../../../data/predefinedStudentResponses";
import studentKBData from "../../../../data/studentKB.json";
import { useAuth } from "../../../../contexts/AuthContext";

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  language?: "en" | "ar";
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  endSession: () => void;
  exportChat: () => void;
}

const STORAGE_KEY = "studentChatHistory";
const MAX_MESSAGES = 200;

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Get userId to isolate chat history
  const userId = user?.id;
  const userStorageKey = userId ? `${STORAGE_KEY}_${userId}` : null;

  // Load chat history from localStorage on mount or when user changes
  useEffect(() => {
    if (!userStorageKey) {
      setMessages([]); // Clear messages if no user
      return;
    }

    try {
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        const parsedMessages = JSON.parse(saved).map((msg: ChatMessage) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(parsedMessages);
      } else {
        setMessages([]); // No history for this user
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  }, [userStorageKey]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (!userStorageKey) return;

    try {
      localStorage.setItem(userStorageKey, JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  }, [messages, userStorageKey]);

  // Check knowledge base for exact matches
  const checkKnowledgeBase = useCallback((message: string): string | null => {
    const lowerMessage = message.toLowerCase();

    // Check FAQs first
    const faqs = (studentKBData.faq || []) as {
      question: string;
      answer: string;
    }[];
    for (const faq of faqs) {
      if (
        lowerMessage.includes(faq.question.toLowerCase()) ||
        faq.question.toLowerCase().includes(lowerMessage)
      ) {
        return faq.answer;
      }
    }

    if (lowerMessage.includes("gpa") || lowerMessage.includes("grading")) {
      return `Our grading system: ${studentKBData.academic_rules.grading_system}`;
    }

    if (
      lowerMessage.includes("attendance") ||
      lowerMessage.includes("absence")
    ) {
      return `Attendance Rules: ${studentKBData.academic_rules.attendance_requirement}`;
    }

    if (lowerMessage.includes("exam") && lowerMessage.includes("tab")) {
      return `Exam Integrity: ${studentKBData.academic_rules.exam_integrity}`;
    }

    if (lowerMessage.includes("hours") || lowerMessage.includes("time")) {
      return `Campus Working Hours: ${studentKBData.campus_info.working_hours}`;
    }

    if (
      lowerMessage.includes("support") ||
      lowerMessage.includes("contact") ||
      lowerMessage.includes("email")
    ) {
      return `IT Support: ${studentKBData.contacts.it_support}, Student Affairs: ${studentKBData.contacts.student_affairs}`;
    }

    if (lowerMessage.includes("emergency")) {
      return `Emergency Contact: ${studentKBData.contacts.emergency}`;
    }

    return null;
  }, []);

  // Check predefined responses
  const checkPredefinedResponses = useCallback(
    (message: string): string | null => {
      const response = findBestMatch(message);
      if (response) {
        const language = detectLanguage(message);
        return getReply(response, language);
      }
      return null;
    },
    [],
  );

  // Call backend API for complex queries
  const callBackendAPI = useCallback(
    async (message: string): Promise<string> => {
      try {
        const language = detectLanguage(message);

        // Get user ID from auth context if available
        let currentUserId = null;
        try {
          const userDataStr = localStorage.getItem("userData");
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            currentUserId = userData.id;
          }
        } catch (e) {
          console.error("Error getting userId for API call:", e);
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            lang: language,
            userId: currentUserId ? parseInt(currentUserId as string) : null,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          return (
            data.reply ||
            data.message ||
            "Sorry, I could not process your request."
          );
        } else {
          throw new Error(data.error || "Unknown error");
        }
      } catch (error) {
        console.error("Backend API error:", error);
        const language = detectLanguage(message);

        if (language === "ar") {
          return "عذرًا، لا أستطيع الحصول على إجابة الآن. حاول مرة أخرى بعد قليل.";
        } else {
          return "Sorry, I can't fetch an answer right now. Try again in a moment.";
        }
      }
    },
    [],
  );

  // Main message processing logic
  const processMessage = useCallback(
    async (userMessage: string): Promise<string> => {
      // Step 1: Check knowledge base
      const kbReply = checkKnowledgeBase(userMessage);
      if (kbReply) {
        return kbReply;
      }

      // Step 2: Check predefined responses
      const predefinedReply = checkPredefinedResponses(userMessage);
      if (predefinedReply) {
        return predefinedReply;
      }

      // Step 3: Call backend API
      return await callBackendAPI(userMessage);
    },
    [checkKnowledgeBase, checkPredefinedResponses, callBackendAPI],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: text.trim(),
        isUser: true,
        timestamp: new Date(),
        language: detectLanguage(text),
      };

      // Add user message immediately
      setMessages((prev) => {
        const newMessages = [...prev, userMessage];
        return newMessages.slice(-MAX_MESSAGES);
      });

      setIsLoading(true);

      try {
        // Simulate typing delay (1 second)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Process message and get reply
        const replyText = await processMessage(text);
        const language = detectLanguage(replyText);

        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: replyText,
          isUser: false,
          timestamp: new Date(),
          language,
        };

        setMessages((prev) => {
          const newMessages = [...prev, botMessage];
          return newMessages.slice(-MAX_MESSAGES);
        });
      } catch (error) {
        console.error("Error processing message:", error);

        const language = detectLanguage(text);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text:
            language === "ar"
              ? "عذرًا، حدث خطأ في معالجة رسالتك. حاول مرة أخرى."
              : "Sorry, there was an error processing your message. Please try again.",
          isUser: false,
          timestamp: new Date(),
          language,
        };

        setMessages((prev) => {
          const newMessages = [...prev, errorMessage];
          return newMessages.slice(-MAX_MESSAGES);
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, processMessage],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    if (userStorageKey) {
      localStorage.removeItem(userStorageKey);
    }
  }, [userStorageKey]);

  const endSession = useCallback(() => {
    //Clear local storage
    clearChat();
    // Add a system message to indicate session ended (optional, or just clear)
    // For now, we just clear as per "Close" semantics often implying reset
    // You could also add a "Session Ended" message if desired, but clearing is cleaner for "Start New"
  }, [clearChat]);

  const exportChat = useCallback(() => {
    const chatText = messages
      .map((msg) => {
        const timestamp = msg.timestamp.toLocaleString();
        const sender = msg.isUser ? "You" : "Assistant";
        return `[${timestamp}] ${sender}: ${msg.text}`;
      })
      .join("\n\n");

    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-chat-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    endSession,
    exportChat,
  };
};
