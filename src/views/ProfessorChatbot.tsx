"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Bot,
  Plus,
  MessageSquare,
  Copy,
  RotateCcw,
  Trash,
  X,
  Menu,
  Sparkles,
  Edit2,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../components/common/DashboardLayout";
import ChatInput from "../components/professor/chatbot/ChatInput";
import { useToast } from "../components/common/ToastProvider";
import ErrorBoundary from "../components/ErrorBoundary";
import ConfirmModal from "../components/ConfirmModal";
import { apiClient } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface Session {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "professor" | "ai";
  timestamp: Date;
}

const MAX_SESSIONS = 25;
const MAX_MESSAGES_PER_SESSION = 500;
const SAVE_DEBOUNCE_MS = 300;

export default function ProfessorChatbot() {
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
  const [language, setLanguage] = useState<"auto" | "en" | "ar">("auto");
  const [showSessionsPanel, setShowSessionsPanel] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteMessageConfirm, setShowDeleteMessageConfirm] =
    useState(false);
  const [showDeleteSessionConfirm, setShowDeleteSessionConfirm] =
    useState(false);
  const [deleteMessageTarget, setDeleteMessageTarget] = useState<string | null>(
    null,
  );
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<string | null>(
    null,
  );

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);

  // --- Effects ---

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const debouncedSave = useCallback(
    (sessionId: string, msgs: ChatMessage[]) => {
      if (!user?.id) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const trimmed = msgs.slice(-MAX_MESSAGES_PER_SESSION);
        localStorage.setItem(
          `professor-ai-session-${user.id}-${sessionId}-messages`,
          JSON.stringify(trimmed),
        );
      }, SAVE_DEBOUNCE_MS);
    },
    [user?.id],
  );

  useEffect(() => {
    if (activeSessionId && user?.id) {
      const savedMessages = localStorage.getItem(
        `professor-ai-session-${user.id}-${activeSessionId}-messages`,
      );
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages).map(
            (msg: unknown) => {
              const m = msg as {
                id: string;
                text: string;
                sender: "professor" | "ai";
                timestamp: string;
              };
              return {
                ...m,
                timestamp: new Date(m.timestamp),
              };
            },
          );
          setMessages(parsedMessages);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    }
  }, [activeSessionId, user?.id]);

  useEffect(() => {
    if (!activeSessionId || messages.length === 0) return;
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    if (chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages.length, activeSessionId]);

  useEffect(() => {
    isInitialLoadRef.current = true;
  }, [activeSessionId]);

  useEffect(() => {
    if (sessions.length > 0 && user?.id) {
      localStorage.setItem(
        `professor-ai-sessions-${user.id}`,
        JSON.stringify(sessions),
      );
    }
  }, [sessions, user?.id]);

  useEffect(() => {
    if (activeSessionId && user?.id) {
      localStorage.setItem(
        `professor-ai-active-session-${user.id}`,
        activeSessionId,
      );
    }
  }, [activeSessionId, user?.id]);

  // --- Helpers ---

  const addToast = (
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
  };

  const detectLanguage = (text: string): "ar" | "en" => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text) ? "ar" : "en";
  };

  // FIXED: Using functional update to break infinite loop dependency with sessions state
  const createNewSession = useCallback(() => {
    const id = String(Date.now());
    const newSess: Session = {
      id,
      name: "New Chat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };
    setSessions(prev => [newSess, ...prev].slice(0, MAX_SESSIONS));
    setActiveSessionId(id);
    setMessages([]);
    return id;
  }, []);

  const handleNewSession = () => {
    createNewSession();
    addToast("New chat created", "success");
    if (window.innerWidth < 1024) setShowSessionsPanel(false);
  };

  // FIXED: Stabilized session loading logic
  useEffect(() => {
    if (!user?.id) return;

    const savedSessions = localStorage.getItem(
      `professor-ai-sessions-${user.id}`,
    );
    const savedActiveId = localStorage.getItem(
      `professor-ai-active-session-${user.id}`,
    );

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
          createNewSession();
        }
      } catch {
        createNewSession();
      }
    } else {
      createNewSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Removed createNewSession from deps to avoid loop if it changes

  const deleteSession = (sessionId: string) => {
    if (sessions.length === 1) {
      addToast("Cannot delete the last session", "warning");
      return;
    }
    setDeleteSessionTarget(sessionId);
    setShowDeleteSessionConfirm(true);
  };

  const confirmDeleteSession = () => {
    if (!deleteSessionTarget || !user?.id) return;
    setSessions(prev => {
       const filtered = prev.filter((s) => s.id !== deleteSessionTarget);
       if (activeSessionId === deleteSessionTarget && filtered.length > 0) {
         setActiveSessionId(filtered[0].id);
       }
       return filtered;
    });
    localStorage.removeItem(
      `professor-ai-session-${user.id}-${deleteSessionTarget}-messages`,
    );
    setShowDeleteSessionConfirm(false);
    setDeleteSessionTarget(null);
    addToast("Chat deleted", "success");
  };

  const startRenamingSession = (session: Session) => {
    setEditingSessionId(session.id);
    setEditingName(session.name);
  };

  const saveSessionName = () => {
    if (editingSessionId && editingName.trim()) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === editingSessionId
            ? {
                ...s,
                name: editingName.trim(),
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      );
      addToast("Chat renamed", "success");
    }
    setEditingSessionId(null);
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
    if (!text.trim()) return;

    const langToSend = language === "auto" ? detectLanguage(text) : language;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: "professor",
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const axios = apiClient.getInstance();

      const resp = await axios.post("/api/chat", {
        message: text,
        lang: langToSend,
        userId: user?.id || "professor-1",
      });

      const data = resp?.data;
      if (data && data.redirect) {
        router.push(data.redirect);
        return;
      }

      if (data && (data.success || data.reply)) {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: data.reply || data.data?.message || "Hello! 👋",
          sender: "ai",
          timestamp: new Date(),
        };
        const finalMessages = [...newMessages, aiResponse];
        setMessages(finalMessages);
        debouncedSave(activeSessionId, finalMessages);
        updateSessionMetadata(activeSessionId, finalMessages.length);
      } else {
        throw new Error(data.error || "Failed to get AI response");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error calling chatbot API:", error);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error connecting to the server. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      };
      const finalMessages = [...newMessages, errorResponse];
      setMessages(finalMessages);
      debouncedSave(activeSessionId, finalMessages);
      updateSessionMetadata(activeSessionId, finalMessages.length);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSelect = (prompt: string) => handleSendMessage(prompt);
  const handleClearChat = () => setShowClearConfirm(true);
  const confirmClearChat = () => {
    if (!user?.id) return;
    setMessages([]);
    localStorage.removeItem(
      `professor-ai-session-${user.id}-${activeSessionId}-messages`,
    );
    updateSessionMetadata(activeSessionId, 0);
    setShowClearConfirm(false);
    addToast("Chat cleared", "success");
  };

  const copyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast("Copied to clipboard", "success");
    } catch {
      addToast("Failed to copy", "error");
    }
  };

  const deleteMessage = (messageId: string) => {
    setDeleteMessageTarget(messageId);
    setShowDeleteMessageConfirm(true);
  };

  const confirmDeleteMessage = () => {
    if (!deleteMessageTarget) return;
    setMessages(prev => {
       const filtered = prev.filter((m) => m.id !== deleteMessageTarget);
       debouncedSave(activeSessionId, filtered);
       updateSessionMetadata(activeSessionId, filtered.length);
       return filtered;
    });
    setShowDeleteMessageConfirm(false);
    setDeleteMessageTarget(null);
    addToast("Message deleted", "success");
  };

  const retryLast = () => {
    const lastUser = [...messages]
      .reverse()
      .find((m) => m.sender === "professor");
    if (lastUser?.text) {
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0 && messages[lastIndex].sender === "ai") {
        setMessages((prev) => prev.slice(0, -1));
      }
      handleSendMessage(lastUser.text);
    }
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const groupedMessages = messages.reduce(
    (groups, msg, index) => {
      const dateKey = msg.timestamp.toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push({ message: msg, index });
      return groups;
    },
    {} as Record<string, Array<{ message: ChatMessage; index: number }>>,
  );

  return (
    <ErrorBoundary>
      <DashboardLayout
        userName={user ? `${user.firstName} ${user.lastName}` : "Professor"}
        userType="professor"
      >
        <div className="flex h-[calc(100vh-6rem)] lg:h-[calc(100vh-6rem)] gap-6 max-w-7xl mx-auto pb-0 lg:pb-6 relative">
          {/* Sidebar - Sessions */}
          <AnimatePresence mode="wait">
            {showSessionsPanel && (
              <>
                {/* Mobile Overlay */}
                {window.innerWidth < 1024 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowSessionsPanel(false)}
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  />
                )}
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className={`flex-shrink-0 flex flex-col bg-white dark:bg-cardDark rounded-r-2xl lg:rounded-2xl shadow-xl lg:shadow-sm border-r lg:border border-gray-200 dark:border-gray-700 overflow-hidden ${window.innerWidth < 1024 ? "fixed inset-y-0 left-0 z-50" : ""}`}
                >
                  <div className="w-80 h-full flex flex-col">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                      <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                        History
                      </h2>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleNewSession}
                          className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                          title="New Chat"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setShowSessionsPanel(false)}
                          className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                            activeSessionId === session.id
                              ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 shadow-sm"
                              : "bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          }`}
                          onClick={() => {
                            setActiveSessionId(session.id);
                            if (window.innerWidth < 1024)
                              setShowSessionsPanel(false);
                          }}
                        >
                          {editingSessionId === session.id ? (
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="flex-1 text-sm px-2 py-1 rounded border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                autoFocus
                                onKeyDown={(e) =>
                                  e.key === "Enter" && saveSessionName()
                                }
                              />
                              <button
                                onClick={saveSessionName}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-1 w-2 h-2 rounded-full ${activeSessionId === session.id ? "bg-purple-500" : "bg-gray-300 dark:bg-gray-600"}`}
                              />
                              <div className="flex-1 min-w-0">
                                <h3
                                  className={`text-sm font-medium truncate ${activeSessionId === session.id ? "text-purple-900 dark:text-purple-100" : "text-gray-700 dark:text-gray-300"}`}
                                >
                                  {session.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {new Date(
                                    session.updatedAt,
                                  ).toLocaleDateString()}{" "}
                                  · {session.messageCount} msgs
                                </p>
                              </div>

                              {activeSessionId === session.id && (
                                <div
                                  className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() =>
                                      startRenamingSession(session)
                                    }
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500"
                                    title="Rename"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteSession(session.id)}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-red-500"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
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

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white dark:bg-cardDark lg:rounded-2xl shadow-sm border-x lg:border border-gray-200 dark:border-gray-700 overflow-hidden relative h-full">
            {/* Header */}
            <div className="h-16 px-4 lg:px-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white/80 dark:bg-cardDark/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowSessionsPanel(!showSessionsPanel)}
                  className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-gray-900 dark:text-white leading-tight">
                      AI Assistant
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Online
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  {(["auto", "en", "ar"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        language === lang
                          ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm"
                          : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      {lang === "auto" ? "Auto" : lang.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

                <button
                  onClick={handleClearChat}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 relative">
              <div
                ref={chatContainerRef}
                className="min-h-full p-4 sm:p-6 space-y-6"
              >
                {messages.length === 0 && !isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                      <Sparkles className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      How can I help you today?
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                      I can help you create quizzes, summarize lectures, draft
                      emails to students, or brainstorm assignment ideas.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                      {[
                        {
                          icon: "📝",
                          text: "Generate 5 quiz questions on Machine Learning",
                        },
                        {
                          icon: "📊",
                          text: "Create a grading rubric for a project",
                        },
                        {
                          icon: "📧",
                          text: "Draft an email about the midterm exam",
                        },
                        {
                          icon: "💡",
                          text: "Suggest assignment ideas for Database course",
                        },
                      ].map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => handlePromptSelect(prompt.text)}
                          className="p-4 bg-white dark:bg-cardDark border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md rounded-xl text-left transition-all group"
                        >
                          <span className="text-xl mb-2 block">
                            {prompt.icon}
                          </span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                            {prompt.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 pb-4">
                    {Object.entries(groupedMessages).map(
                      ([dateKey, group], groupIndex) => (
                        <div key={dateKey}>
                          {groupIndex > 0 && (
                            <div className="flex items-center gap-4 my-8">
                              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                {formatDate(new Date(dateKey))}
                              </span>
                              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                            </div>
                          )}

                          {group.map(({ message }) => {
                            const isAi = message.sender === "ai";
                            const isArabic =
                              detectLanguage(message.text) === "ar";

                            return (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={message.id}
                                className={`flex ${isAi ? "justify-start" : "justify-end"} mb-6`}
                              >
                                <div
                                  className={`flex gap-4 max-w-[85%] ${isAi ? "flex-row" : "flex-row-reverse"}`}
                                >
                                  {/* Avatar */}
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${
                                      isAi
                                        ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                        : "bg-purple-600"
                                    }`}
                                  >
                                    {isAi ? (
                                      <Bot className="w-5 h-5 text-purple-600" />
                                    ) : (
                                      <span className="text-xs font-bold text-white">
                                        ME
                                      </span>
                                    )}
                                  </div>

                                  {/* Message Bubble */}
                                  <div
                                    className={`group relative rounded-2xl p-4 shadow-sm ${
                                      isAi
                                        ? "bg-white dark:bg-cardDark border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none"
                                        : "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none"
                                    }`}
                                  >
                                    <div
                                      className={`whitespace-pre-wrap leading-relaxed ${isArabic ? "text-right" : "text-left"}`}
                                      dir={isArabic ? "rtl" : "ltr"}
                                    >
                                      {message.text}
                                    </div>

                                    <div
                                      className={`flex items-center gap-2 mt-2 ${isAi ? "justify-start" : "justify-end text-purple-100"}`}
                                    >
                                      <span className="text-[10px] opacity-70">
                                        {message.timestamp.toLocaleTimeString(
                                          [],
                                          {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          },
                                        )}
                                      </span>

                                      {/* Actions */}
                                      <div
                                        className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isAi ? "text-gray-400" : "text-purple-200"}`}
                                      >
                                        <button
                                          onClick={() =>
                                            copyMessage(message.text)
                                          }
                                          className="p-1 hover:bg-black/5 rounded"
                                          title="Copy"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            deleteMessage(message.id)
                                          }
                                          className="p-1 hover:bg-black/5 rounded"
                                          title="Delete"
                                        >
                                          <Trash className="w-3 h-3" />
                                        </button>
                                        {isAi && (
                                          <button
                                            onClick={retryLast}
                                            className="p-1 hover:bg-black/5 rounded"
                                            title="Regenerate"
                                          >
                                            <RotateCcw className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      ),
                    )}

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start mb-6"
                      >
                        <div className="flex gap-4 max-w-[85%]">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                            <Bot className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="bg-white dark:bg-cardDark border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                            <div
                              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <div
                              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <div
                              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-3 lg:p-4 bg-white dark:bg-cardDark border-t border-gray-100 dark:border-gray-700 z-10 pb-safe">
              <div className="max-w-4xl mx-auto relative">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  placeholder="Type your message..."
                />
                <p className="text-center text-[10px] lg:text-xs text-gray-400 mt-2 hidden sm:block">
                  AI can make mistakes. Please review generated content.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <ConfirmModal
          isOpen={showDeleteSessionConfirm}
          title="Delete Chat"
          message="Are you sure you want to delete this chat session? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteSession}
          onCancel={() => setShowDeleteSessionConfirm(false)}
        />

        <ConfirmModal
          isOpen={showClearConfirm}
          title="Clear Chat"
          message="Are you sure you want to clear all messages in this chat? This cannot be undone."
          confirmText="Clear All"
          cancelText="Cancel"
          onConfirm={confirmClearChat}
          onCancel={() => setShowClearConfirm(false)}
        />

        <ConfirmModal
          isOpen={showDeleteMessageConfirm}
          title="Delete Message"
          message="Are you sure you want to delete this message?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteMessage}
          onCancel={() => setShowDeleteMessageConfirm(false)}
        />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
