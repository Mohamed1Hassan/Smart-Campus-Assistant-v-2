import { NextRequest, NextResponse } from "next/server";
import { ChatbotService } from "@/services/chatbot.service";
import { ChatRequest } from "@/types/chatbot.types";
import OpenAI from "openai";

const chatbotService = new ChatbotService();

// Helper to get OpenAI client with current env vars
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your-openai-api-key-here") return null;

  return new OpenAI({
    apiKey: apiKey,
    baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Smart Campus Assistant",
    },
  });
};

// Fallback responses (Offline Mode)
const generateOfflineResponse = (message: string, lang: string) => {
  const m = message.toLowerCase().trim();
  const isAR = lang === "ar";
  const direct = (en: string, ar: string) => (isAR ? ar : en);

  if (
    ["hello", "hi", "hey", "مرحبا", "السلام", "اهلاً", "اهلا"].some((k) =>
      m.includes(k),
    )
  ) {
    return direct(
      "Hi there! I'm currently in offline mode, but I can still help you check your schedule, attendance, or course list. What would you like to see?",
      "أهلاً بك! أنا حالياً في وضع عدم الاتصال، لكن لا يزال بإمكاني مساعدتك في معرفة جدولك، حضورك، أو قائمة موادك. ماذا تود أن تعرف؟",
    );
  }

  if (
    ["how are you", "how r u", "كيف حالك", "كيفك", "اخبارك"].some((k) =>
      m.includes(k),
    )
  ) {
    return direct(
      "I'm functioning, but I need my API key to be fully smart! For now, ask me about 'schedule', 'courses', or 'attendance'.",
      "أنا أعمل، لكن أحتاج لمفتاح API لأكون ذكياً بالكامل! حالياً، يمكنك سؤالي عن 'الجدول'، 'المواد'، أو 'الحضور'.",
    );
  }

  return direct(
    "I'm currently offline (API Key missing). Please check the dashboard for Schedules, Courses, and Attendance info.",
    "أنا حالياً غير متصل (مفتاح API مفقود). يرجى التحقق من لوحة التحكم لمعرفة الجداول، المواد، ومعلومات الحضور.",
  );
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, lang, userId } = body;

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const openai = getOpenAIClient();
    const hasValidApiKey = !!openai;

    // If no valid API key, use fallback
    if (!hasValidApiKey) {
      return NextResponse.json({
        success: true,
        reply: generateOfflineResponse(message, lang || "en"),
        suggestions: [
          "What are my classes today?",
          "Show my attendance status",
          "Course information",
          "Help with assignments",
        ],
        isOffline: true,
      });
    }

    // Use the enhanced chatbot service if userId is provided
    if (userId) {
      const parsedUserId = parseInt(String(userId), 10);
      if (!isNaN(parsedUserId)) {
        const chatRequest: ChatRequest = {
          message: message.trim(),
          language: lang || "en",
          context: {},
        };

        const response = await chatbotService.processMessage(
          chatRequest,
          parsedUserId,
        );

        const responseData = {
          success: true,
          reply: response.message.content,
          suggestions: response.suggestions,
          session: response.session,
          redirect: response.message.metadata?.redirect,
        };

        const nextResp = NextResponse.json(responseData);

        // If this message triggers an admin redirect, set the unlock cookie
        if (response.message.metadata?.redirect === "/dashboard/admin") {
          nextResp.cookies.set("isAdminUnlocked", "true", {
            httpOnly: false, // Accessible by client to check
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 3600, // 1 hour
          });
        }

        return nextResp;
      }
    }

    // Fallback for anonymous users or missing userId
    const system = `You are Smart Campus AI Assistant for Smart Campus University. Provide direct, specific answers in ${lang === "ar" ? "Arabic" : "English"} about university life, courses, schedules, and academic matters. Never use generic phrases like "I understand you're asking about..." or "I can help you with...". Start with the direct answer immediately.`;

    const completion = await openai!.chat.completions.create({
      model: process.env.OPENAI_MODEL || "meta-llama/llama-3.3-8b-instruct",
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || "1000"),
      temperature: 0.7,
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      generateOfflineResponse(message, lang || "en");

    return NextResponse.json({
      success: true,
      reply,
      suggestions: [
        "What are my classes today?",
        "Show my attendance status",
        "Course information",
        "Help with assignments",
      ],
    });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      success: true,
      reply:
        "I'm having trouble processing your request right now. Please try again later.",
      suggestions: ["Try again"],
      error: errorMessage,
    });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
