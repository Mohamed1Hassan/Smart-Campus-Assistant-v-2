"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Bot,
  Plus,
  RotateCcw,
  Sparkles,
  Edit2,
  X,
  Menu,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../components/common/DashboardLayout";
import ChatInput from "../components/student/ai-assistant/ChatInput";
import { useToast } from "../components/common/ToastProvider";
import ErrorBoundary from "../components/ErrorBoundary";
import { apiClient } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface ChatMessage {
  id: string;
  text: string;
  sender: "student" | "ai";
  timestamp: Date;
}

interface Session {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

const MAX_SESSIONS = 25;
const MAX_MESSAGES_PER_SESSION = 500;
const SAVE_DEBOUNCE_MS = 300;

const initialSessionTemplate: Omit<Session, 'id'> = {
  name: "New chat",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messageCount: 0,
};

export default function StudentAIAssistant() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
  } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [language, setLanguage] = useState<"auto" | "en" | "ar">("auto");
  const [showSessionsPanel, setShowSessionsPanel] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);

  const DEV = process.env.NODE_ENV === "development";

  useEffect(() => {
    const check = () =>
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 1024);
    check();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const debouncedSave = useCallback(
    (sessionId: string, msgs: ChatMessage[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        const trimmed = msgs.slice(-MAX_MESSAGES_PER_SESSION);
        localStorage.setItem(
          `student-ai-session-${sessionId}-messages`,
          JSON.stringify(trimmed),
        );
        if (DEV)
          console.log("Saved session messages:", sessionId, trimmed.length);
      }, SAVE_DEBOUNCE_MS);
    },
    [DEV],
  );

  // FIXED: Stabilized session initialization to prevent infinite loops
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedSessions = localStorage.getItem("student-ai-sessions");
    const savedActiveId = localStorage.getItem("student-ai-active-session");

    const createAndSetInitialSession = () => {
      const newId = String(Date.now());
      const initialSession: Session = {
        id: newId,
        ...initialSessionTemplate,
      };
      setSessions([initialSession]);
      setActiveSessionId(initialSession.id);
      localStorage.setItem(
        "student-ai-sessions",
        JSON.stringify([initialSession]),
      );
      localStorage.setItem("student-ai-active-session", initialSession.id);
    };

    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);

        if (
          savedActiveId &&
          parsed.find((s: Session) => s.id === savedActiveId)
        ) {
          setActiveSessionId(savedActiveId);
        } else if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        } else {
          createAndSetInitialSession();
        }
      } catch {
        createAndSetInitialSession();
      }
    } else {
      createAndSetInitialSession();
    }
  }, []);

  useEffect(() => {
    if (activeSessionId && typeof window !== "undefined") {
      isInitialLoadRef.current = true;
      const savedMessages = localStorage.getItem(
        `student-ai-session-${activeSessionId}-messages`,
      );
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages).map(
            (msg: { timestamp: string }) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }),
          );
          setMessages(parsedMessages);
        } catch {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (sessions.length > 0 && typeof window !== "undefined") {
      localStorage.setItem("student-ai-sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId && typeof window !== "undefined") {
      localStorage.setItem("student-ai-active-session", activeSessionId);
    }
  }, [activeSessionId]);

  const addToast = useCallback((
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) => {
    switch (type) {
      case "success":
        showSuccess(message, { showProgress: true });
        break;
      case "error":
        showError(message, { showProgress: true });
        break;
      case "warning":
        showWarning(message, { showProgress: true });
        break;
      case "info":
        showInfo(message, { showProgress: true });
        break;
    }
  }, [showSuccess, showError, showWarning, showInfo]);

  const detectLanguage = useCallback((text: string): "ar" | "en" => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text) ? "ar" : "en";
  }, []);

  const newSession = () => {
    const id = String(Date.now());
    const newSess: Session = {
      id,
      ...initialSessionTemplate,
    };

    setSessions(prev => [newSess, ...prev].slice(0, MAX_SESSIONS));
    setActiveSessionId(id);
    setMessages([]);
    addToast("New chat created", "success");
    if (isMobile) setShowSessionsPanel(false);
  };

  const deleteSession = (sessionId: string) => {
    if (sessions.length === 1) {
      addToast("Cannot delete the last session", "warning");
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.confirm("Delete this chat? This action cannot be undone.")
    ) {
      setSessions(prev => {
        const filtered = prev.filter((s) => s.id !== sessionId);
        if (activeSessionId === sessionId && filtered.length > 0) {
          setActiveSessionId(filtered[0].id);
        }
        return filtered;
      });
      localStorage.removeItem(`student-ai-session-${sessionId}-messages`);
      addToast("Chat deleted", "success");
    }
  };

  const renameSession = (sessionId: string, newName: string) => {
    if (!newName.trim()) return;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, name: newName.trim(), updatedAt: new Date().toISOString() }
          : s,
      ),
    );
    setEditingSessionId(null);
    addToast("Chat renamed", "success");
  };

  const updateSessionMetadata = useCallback(
    (sessionId: string, messageCount: number) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messageCount, updatedAt: new Date().toISOString() }
            : s,
        ),
      );
    },
    [],
  );

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) {
      addToast("Please enter a message before sending", "warning");
      return;
    }

    const langToSend = language === "auto" ? detectLanguage(text) : language;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: "student",
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    isInitialLoadRef.current = false;
    setIsLoading(true);

    try {
      const axios = apiClient.getInstance();
      const resp = await axios.post("/api/chat", {
        message: text,
        lang: langToSend,
        userId: user?.id,
      });

      const data = resp?.data;
      if (data && data.redirect) {
        // Manually set client-side cookie and localStorage as a robust fallback
        document.cookie = "isAdminUnlocked=true; path=/; max-age=3600; SameSite=Lax";
        localStorage.setItem("isAdminUnlocked", "true");
        router.push(data.redirect);
        return;
      }

      if (data && (data.success || data.reply)) {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: data.reply || data.data?.message || "Hello!",
          sender: "ai",
          timestamp: new Date(),
        };

        const finalMessages = [...newMessages, aiResponse];
        setMessages(finalMessages);
        debouncedSave(activeSessionId, finalMessages);
        updateSessionMetadata(activeSessionId, finalMessages.length);
      } else {
        throw new Error(data?.error || "Failed to get AI response");
      }
    } catch {
      const detectedLang = detectLanguage(text);
      const errorText = detectedLang === "ar"
        ? "عذراً، الخادم غير متاح حالياً. يرجى المحاولة لاحقاً."
        : "Sorry, I cannot connect to the server right now. Please try again later.";

      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: "ai",
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, errorResponse];
      setMessages(finalMessages);
      debouncedSave(activeSessionId, finalMessages);
      updateSessionMetadata(activeSessionId, finalMessages.length);
      addToast("Cannot connect to server. Please try again later.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSelect = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleClearChat = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Clear all messages in this chat? This action cannot be undone.")
    ) {
      setMessages([]);
      localStorage.removeItem(`student-ai-session-${activeSessionId}-messages`);
      updateSessionMetadata(activeSessionId, 0);
      addToast("Chat cleared successfully", "success");
    }
  };

  const deleteMessage = useCallback((messageId: string) => {
    if (typeof window !== "undefined" && window.confirm("Delete this message?")) {
      setMessages(prev => {
         const filtered = prev.filter((m) => m.id !== messageId);
         debouncedSave(activeSessionId, filtered);
         updateSessionMetadata(activeSessionId, filtered.length);
         return filtered;
      });
      addToast("Message deleted", "success");
    }
  }, [activeSessionId, debouncedSave, updateSessionMetadata, addToast]);

  const retryLast = () => {
    const lastUser = [...messages].reverse().find((m) => m.sender === "student");
    if (lastUser?.text) {
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0 && messages[lastIndex].sender === "ai") {
        setMessages((prev) => prev.slice(0, -1));
      }
      handleSendMessage(lastUser.text);
    } else {
      addToast("No message to retry", "warning");
    }
  };

  const memoizedMessages = useMemo(() => (
    messages.map((message) => {
      const isAi = message.sender === "ai";
      const isArabic = detectLanguage(message.text) === "ar";
      const timestamp = message.timestamp instanceof Date
        ? message.timestamp
        : new Date(message.timestamp);

      return (
        <motion.div
          initial={isInitialLoadRef.current ? false : { opacity: 0, y: 20 }}
          animate={isInitialLoadRef.current ? false : { opacity: 1, y: 0 }}
          key={message.id}
          className={`flex ${isAi ? "justify-start" : "justify-end"} mb-6 last:mb-0`}
        >
          <div className={`flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[85%] ${isAi ? "flex-row" : "flex-row-reverse"}`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg mt-1 ${isAi ? "bg-gradient-to-br from-indigo-500 to-purple-600" : "bg-gradient-to-br from-blue-500 to-indigo-600"}`}>
              {isAi ? (
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2 group">
              <div className={`relative px-4 sm:px-6 py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] shadow-md border ${
                  isAi
                    ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border-gray-100 dark:border-gray-700"
                    : "bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-tr-none border-indigo-500"
                }`}>
                {isAi && (
                  <div className="absolute -top-6 left-0 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                    AI Campus Assistant
                  </div>
                )}
                <div className={`whitespace-pre-wrap leading-relaxed text-sm sm:text-base ${isArabic ? "text-right" : "text-left"}`} dir={isArabic ? "rtl" : "ltr"}>
                  {message.text}
                </div>
              </div>
              <div className={`flex items-center gap-3 px-2 ${isAi ? "justify-start" : "justify-end"}`}>
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                  {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {!isAi && (
                  <button onClick={() => deleteMessage(message.id)} className="hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      );
    })
  ), [messages, detectLanguage, deleteMessage]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <ErrorBoundary>
      <DashboardLayout userName={user ? `${user.firstName} ${user.lastName}` : "Student"} userType="student">
        <div className="flex h-[calc(100vh-6rem)] lg:h-[calc(100vh-6rem)] gap-6 max-w-7xl mx-auto pb-0 lg:pb-6 relative">
          <AnimatePresence mode="wait">
            {showSessionsPanel && (
              <>
                {isMobile && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowSessionsPanel(false)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden rounded-[2rem]"
                  />
                )}
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className={`flex-shrink-0 flex flex-col bg-white dark:bg-gray-900 shadow-2xl lg:shadow-xl lg:border border-gray-100 dark:border-gray-800 overflow-hidden ${isMobile ? "absolute inset-y-0 left-0 z-40 rounded-l-[2.5rem] lg:rounded-[2.5rem]" : "z-10 rounded-[2.5rem]"}`}
                >
                  <div className="w-80 h-full flex flex-col">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10">
                      <h3 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Sessions</h3>
                      <div className="flex items-center gap-1">
                        <button onClick={newSession} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors text-indigo-600 dark:text-indigo-400" title="New Chat"><Plus className="w-5 h-5" /></button>
                        <button onClick={() => setShowSessionsPanel(false)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"><X className="w-5 h-5" /></button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {sessions.map((session) => (
                        <div key={session.id} onClick={() => { setActiveSessionId(session.id); if (isMobile) setShowSessionsPanel(false); }} className={`group p-3 rounded-xl cursor-pointer transition-all border ${activeSessionId === session.id ? "bg-indigo-50/80 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-900/50 shadow-sm" : "bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                          {editingSessionId === session.id ? (
                            <div className="flex items-center gap-2">
                              <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} onBlur={() => renameSession(session.id, editingName)} onKeyDown={(e) => e.key === "Enter" && renameSession(session.id, editingName)} className="flex-1 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus onClick={(e) => e.stopPropagation()} />
                              <button onClick={() => renameSession(session.id, editingName)} className="p-1 text-emerald-600"><Edit2 className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-sm truncate ${activeSessionId === session.id ? "text-indigo-900 dark:text-indigo-100" : "text-gray-700 dark:text-gray-300"}`}>{session.name}</h4>
                                <p className="text-xs text-gray-400 mt-1">{new Date(session.updatedAt).toLocaleDateString()} · {session.messageCount} msgs</p>
                              </div>
                              {activeSessionId === session.id && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(session.id); setEditingName(session.name); }} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-lg text-gray-500 transition-colors"><Edit2 className="w-3 h-3" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 lg:rounded-[2.5rem] shadow-xl lg:border border-gray-100 dark:border-gray-800 overflow-hidden relative h-full z-0">
            <div className="h-20 px-4 lg:px-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 z-20">
              <div className="flex items-center gap-4 sm:gap-5">
                <button onClick={() => setShowSessionsPanel(!showSessionsPanel)} className="p-2 sm:p-2.5 -ml-2 rounded-xl hover:bg-white dark:hover:bg-gray-800 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-gray-600 dark:text-gray-300 transition-all hover:scale-105" title={showSessionsPanel ? "Hide Sidebar" : "Show Sidebar"}>
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                </button>
                <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-2 ring-white/50 dark:ring-gray-800/50">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">AI Assistant</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online · {activeSession?.name || "New Chat"}
                  </p>
                </div>
              </div>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth bg-gray-50/50 dark:bg-gray-900 pb-40 lg:pb-32">
              {messages.length === 0 && !isLoading ? (
                <div className="min-h-full flex flex-col items-center justify-start sm:justify-center text-center max-w-2xl mx-auto px-2 sm:px-4 pt-4 sm:pt-0 sm:mt-10">
                  <div className="w-16 h-16 sm:w-28 sm:h-28 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-2xl sm:rounded-[2rem] flex items-center justify-center mb-4 sm:mb-8 animate-float shadow-inner border border-white/40 dark:border-indigo-500/20 backdrop-blur-md relative group cursor-default">
                    <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-400/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Sparkles className="w-8 h-8 sm:w-14 sm:h-14 text-indigo-600 dark:text-indigo-400 relative z-10" />
                  </div>
                  <h2 className="text-xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-2 sm:mb-4 tracking-tight">How can I help you today?</h2>
                  <p className="text-sm sm:text-lg text-gray-500 dark:text-gray-400 mb-6 sm:mb-10 max-w-lg">I can help you with your schedule, assignments, attendance tracking, and general academic questions.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full px-2 sm:px-0">
                    {[
                      { icon: "📅", text: "What's my schedule today?" },
                      { icon: "📊", text: "Check my attendance" },
                      { icon: "📝", text: "List upcoming exams" },
                      { icon: "🎓", text: "Study tips for finals" },
                    ].map((prompt, idx) => (
                      <button key={idx} onClick={() => handlePromptSelect(prompt.text)} className="p-3 sm:p-5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 rounded-2xl sm:rounded-[1.5rem] text-left transition-all group shadow-sm hover:shadow-md hover:-translate-y-1 flex sm:block items-center sm:items-start gap-3 sm:gap-0">
                        <span className="text-xl sm:text-2xl sm:mb-3 block transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">{prompt.icon}</span>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{prompt.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {memoizedMessages}
                  {isLoading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                      <div className="flex gap-4 max-w-[85%]">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md mt-1">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 rounded-3xl rounded-tl-none flex items-center gap-1.5 border border-gray-200 dark:border-gray-700">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            <div className="absolute bottom-3 sm:bottom-6 left-3 right-3 sm:left-6 sm:right-6 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] shadow-xl z-20 transition-all flex-shrink-0">
              <div className="max-w-4xl mx-auto relative p-2 sm:p-4">
                {messages.length > 0 && (
                  <div className="absolute -top-12 sm:-top-14 left-0 right-0 flex justify-center gap-2 sm:gap-3 pointer-events-none">
                    <div className="pointer-events-auto flex gap-3">
                      <button onClick={handleClearChat} className="px-4 py-2 bg-white dark:bg-gray-800 text-xs font-bold text-red-500 shadow-md hover:shadow-lg border border-gray-100 dark:border-gray-700 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 hover:-translate-y-0.5 transition-all flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} /> Clear
                      </button>
                      {messages[messages.length - 1]?.sender === "ai" && (
                        <button onClick={retryLast} className="px-4 py-2 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 shadow-md hover:shadow-lg border border-gray-100 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-0.5 transition-all flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} /> Regenerate
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} chromeless />
                <div className="text-center sm:mt-3 px-2">
                  <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest leading-tight">
                    AI can make mistakes. Verify important information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <style jsx global>{`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(2deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
        `}</style>
      </DashboardLayout>
    </ErrorBoundary>
  );
}
