import { KnowledgeBaseItem, CourseContext } from "../types/chatbot.types";
import prisma from "@/lib/db";
import fs from "fs/promises";
import path from "path";

interface RawKnowledgeItem {
  id?: string;
  question?: string;
  pattern?: string;
  answer?: string;
  response?: string;
  language?: string;
  tags?: string[];
  confidence?: number;
}

export class KnowledgeBaseService {
  private prisma = prisma;
  private knowledgeBase: Map<string, KnowledgeBaseItem[]> = new Map();
  private courseContexts: Map<number, CourseContext> = new Map();

  constructor() {
    this.initializeKnowledgeBase();
  }

  /**
   * Initialize knowledge base from files and database
   */
  private async initializeKnowledgeBase(): Promise<void> {
    try {
      // Load from JSON files
      await this.loadKnowledgeFromFiles();

      // Load course contexts
      await this.loadCourseContexts();

      console.log("Knowledge base initialized successfully");
    } catch (error) {
      console.error("Error initializing knowledge base:", error);
    }
  }

  /**
   * Load knowledge base from JSON files
   */
  private async loadKnowledgeFromFiles(): Promise<void> {
    try {
      const knowledgeBasePath = path.join(
        process.cwd(),
        "src/data/knowledgeBase.json",
      );
      const studentKBPath = path.join(process.cwd(), "src/data/studentKB.json");

      // Load main knowledge base
      try {
        const knowledgeBaseData = await fs.readFile(knowledgeBasePath, "utf-8");
        const kbItems = JSON.parse(knowledgeBaseData);
        this.processKnowledgeBaseItems(kbItems, "general");
      } catch {
        console.log("Main knowledge base file not found, using defaults");
        this.loadDefaultKnowledgeBase();
      }

      // Load student-specific knowledge base
      try {
        const studentKBData = await fs.readFile(studentKBPath, "utf-8");
        const studentKBItems = JSON.parse(studentKBData);
        this.processKnowledgeBaseItems(studentKBItems, "student");
      } catch {
        console.log("Student knowledge base file not found, using defaults");
      }
    } catch (error) {
      console.error("Error loading knowledge base files:", error);
      this.loadDefaultKnowledgeBase();
    }
  }

  /**
   * Process knowledge base items
   */
  private processKnowledgeBaseItems(
    items: RawKnowledgeItem[],
    category: string,
  ): void {
    items.forEach((item, index) => {
      const kbItem: KnowledgeBaseItem = {
        id: item.id || `${category}_${index}`,
        question: item.question || item.pattern || "",
        answer: item.answer || item.response || "",
        category,
        language: item.language || "en",
        tags: item.tags || [],
        confidence: item.confidence || 0.8,
        lastUpdated: new Date(),
      };

      const key = `${category}_${kbItem.language}`;
      if (!this.knowledgeBase.has(key)) {
        this.knowledgeBase.set(key, []);
      }
      this.knowledgeBase.get(key)!.push(kbItem);
    });
  }

  /**
   * Load default knowledge base
   */
  private loadDefaultKnowledgeBase(): void {
    const defaultKB = [
      {
        id: "greeting_en",
        question: "hello|hi|hey|good morning|good afternoon|good evening",
        answer: "Hello! I'm your AI assistant. How can I help you today?",
        category: "general",
        language: "en",
        tags: ["greeting", "welcome"],
        confidence: 0.95,
      },
      {
        id: "greeting_ar",
        question: "مرحبا|السلام عليكم|أهلا|صباح الخير|مساء الخير",
        answer: "مرحبا! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟",
        category: "general",
        language: "ar",
        tags: ["greeting", "welcome"],
        confidence: 0.95,
      },
      {
        id: "course_info_en",
        question: "course|subject|class|مادة|كورس",
        answer:
          "I can help you with course information. Please specify which course you're asking about.",
        category: "course",
        language: "en",
        tags: ["course", "information"],
        confidence: 0.8,
      },
      {
        id: "schedule_en",
        question: "schedule|time|when|جدول|وقت|متى",
        answer:
          "I can help you with your schedule. Check your schedule section for detailed information.",
        category: "schedule",
        language: "en",
        tags: ["schedule", "time"],
        confidence: 0.8,
      },
      {
        id: "attendance_en",
        question: "attendance|present|absent|حضور|غياب",
        answer:
          "I can help you with attendance information. Use the attendance section to view your records.",
        category: "attendance",
        language: "en",
        tags: ["attendance", "presence"],
        confidence: 0.8,
      },
    ];

    this.processKnowledgeBaseItems(defaultKB, "default");
  }

  /**
   * Load course contexts from database
   */
  private async loadCourseContexts(): Promise<void> {
    try {
      const courses = await this.prisma.course.findMany({
        include: {
          professor: true,
          schedules: true,
        },
      });

      courses.forEach((course) => {
        const context: CourseContext = {
          courseId: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          professorName: `${course.professor.firstName} ${course.professor.lastName}`,
          schedule: course.schedules,
          assignments: [], // Would be loaded from assignments table
          announcements: [], // Would be loaded from announcements
        };

        this.courseContexts.set(course.id, context);
      });

      console.log(`Loaded ${courses.length} course contexts`);
    } catch (error) {
      console.error("Error loading course contexts:", error);
    }
  }

  /**
   * Search knowledge base for relevant information
   */
  async searchKnowledge(
    query: string,
    language: string = "en",
    category?: string,
  ): Promise<KnowledgeBaseItem[]> {
    const results: KnowledgeBaseItem[] = [];
    const searchTerms = query.toLowerCase().split(" ");

    // Search in specific category and language
    const key = category ? `${category}_${language}` : null;
    const searchKeys = key
      ? [key]
      : Array.from(this.knowledgeBase.keys()).filter((k) =>
          k.endsWith(`_${language}`),
        );

    for (const searchKey of searchKeys) {
      const items = this.knowledgeBase.get(searchKey) || [];

      for (const item of items) {
        const score = this.calculateRelevanceScore(item, searchTerms);
        if (score > 0.3) {
          // Minimum relevance threshold
          results.push({ ...item, confidence: score });
        }
      }
    }

    // Sort by confidence score
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate relevance score for a knowledge base item
   */
  private calculateRelevanceScore(
    item: KnowledgeBaseItem,
    searchTerms: string[],
  ): number {
    let score = 0;
    const questionWords = item.question.toLowerCase().split(/\s+/);
    const answerWords = item.answer.toLowerCase().split(/\s+/);
    const allWords = [...questionWords, ...answerWords, ...item.tags];

    // Exact match bonus
    const fullQuery = searchTerms.join(" ");
    if (
      item.question.toLowerCase().includes(fullQuery) ||
      item.answer.toLowerCase().includes(fullQuery)
    ) {
      score += 0.5;
    }

    // Word matching
    for (const term of searchTerms) {
      if (allWords.some((word) => word.includes(term) || term.includes(word))) {
        score += 0.2;
      }
    }

    // Tag matching bonus
    for (const term of searchTerms) {
      if (item.tags.some((tag) => tag.toLowerCase().includes(term))) {
        score += 0.3;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Get course context by course ID
   */
  async getCourseContext(courseId: number): Promise<CourseContext | null> {
    return this.courseContexts.get(courseId) || null;
  }

  /**
   * Get course context by course code
   */
  async getCourseContextByCode(
    courseCode: string,
  ): Promise<CourseContext | null> {
    for (const context of this.courseContexts.values()) {
      if (context.courseCode.toLowerCase() === courseCode.toLowerCase()) {
        return context;
      }
    }
    return null;
  }

  /**
   * Get user's enrolled courses context
   */
  async getUserCoursesContext(userId: number): Promise<CourseContext[]> {
    try {
      const enrollments = await this.prisma.courseEnrollment.findMany({
        where: {
          studentId: userId,
          status: "ACTIVE",
        },
        include: {
          course: {
            include: {
              professor: true,
              schedules: true,
            },
          },
        },
      });

      return enrollments.map((enrollment) => {
        const course = enrollment.course;
        return {
          courseId: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          professorName: `${course.professor.firstName} ${course.professor.lastName}`,
          schedule: course.schedules,
          assignments: [], // Would be loaded from assignments
          announcements: [], // Would be loaded from announcements
        };
      });
    } catch (error) {
      console.error("Error getting user courses context:", error);
      return [];
    }
  }

  /**
   * Add new knowledge base item
   */
  async addKnowledgeItem(
    item: Omit<KnowledgeBaseItem, "id" | "lastUpdated">,
  ): Promise<KnowledgeBaseItem> {
    const newItem: KnowledgeBaseItem = {
      ...item,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastUpdated: new Date(),
    };

    const key = `${item.category}_${item.language}`;
    if (!this.knowledgeBase.has(key)) {
      this.knowledgeBase.set(key, []);
    }
    this.knowledgeBase.get(key)!.push(newItem);

    return newItem;
  }

  /**
   * Update knowledge base item
   */
  async updateKnowledgeItem(
    id: string,
    updates: Partial<Omit<KnowledgeBaseItem, "id" | "lastUpdated">>,
  ): Promise<KnowledgeBaseItem | null> {
    for (const [, items] of this.knowledgeBase.entries()) {
      const itemIndex = items.findIndex((item) => item.id === id);
      if (itemIndex !== -1) {
        items[itemIndex] = {
          ...items[itemIndex],
          ...updates,
          lastUpdated: new Date(),
        };
        return items[itemIndex];
      }
    }
    return null;
  }

  /**
   * Remove knowledge base item
   */
  async removeKnowledgeItem(id: string): Promise<boolean> {
    for (const [, items] of this.knowledgeBase.entries()) {
      const itemIndex = items.findIndex((item) => item.id === id);
      if (itemIndex !== -1) {
        items.splice(itemIndex, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Get FAQ items
   */
  async getFAQItems(
    language: string = "en",
    limit: number = 10,
  ): Promise<KnowledgeBaseItem[]> {
    const faqItems = await this.searchKnowledge("", language, "faq");
    return faqItems.slice(0, limit);
  }

  /**
   * Get popular questions
   */
  async getPopularQuestions(
    language: string = "en",
    limit: number = 5,
  ): Promise<KnowledgeBaseItem[]> {
    const popularItems = await this.searchKnowledge("", language);
    return popularItems.filter((item) => item.confidence > 0.7).slice(0, limit);
  }

  /**
   * Get suggestions based on user input
   */
  async getSuggestions(
    partialInput: string,
    language: string = "en",
    limit: number = 5,
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Get relevant knowledge base items
    const relevantItems = await this.searchKnowledge(partialInput, language);

    // Extract suggestions from relevant items
    for (const item of relevantItems.slice(0, limit)) {
      if (item.question && !suggestions.includes(item.question)) {
        suggestions.push(item.question);
      }
    }

    // Add default suggestions if not enough found
    if (suggestions.length < limit) {
      const defaultSuggestions = this.getDefaultSuggestions(language);
      for (const suggestion of defaultSuggestions) {
        if (!suggestions.includes(suggestion) && suggestions.length < limit) {
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions.slice(0, limit);
  }

  /**
   * Get default suggestions
   */
  public getDefaultSuggestions(language: string): string[] {
    const suggestions = {
      en: [
        "What are my classes today?",
        "Show my attendance status",
        "When is my next exam?",
        "Course information",
        "Help with assignments",
        "Schedule information",
        "Professor contact",
        "Academic calendar",
      ],
      ar: [
        "ما هي محاضراتي اليوم؟",
        "أظهر حالة حضوري",
        "متى امتحاني القادم؟",
        "معلومات المادة",
        "مساعدة في الواجبات",
        "معلومات الجدول",
        "اتصال الأستاذ",
        "التقويم الأكاديمي",
      ],
    };

    return (
      (suggestions as Record<string, string[]>)[language] || suggestions.en
    );
  }

  /**
   * Refresh knowledge base
   */
  async refreshKnowledgeBase(): Promise<void> {
    this.knowledgeBase.clear();
    this.courseContexts.clear();
    await this.initializeKnowledgeBase();
  }

  /**
   * Get knowledge base statistics
   */
  getKnowledgeBaseStats(): {
    totalItems: number;
    itemsByCategory: Record<string, number>;
    itemsByLanguage: Record<string, number>;
  } {
    const stats = {
      totalItems: 0,
      itemsByCategory: {} as Record<string, number>,
      itemsByLanguage: {} as Record<string, number>,
    };

    for (const [key, items] of this.knowledgeBase.entries()) {
      const [category, language] = key.split("_");

      stats.totalItems += items.length;
      stats.itemsByCategory[category] =
        (stats.itemsByCategory[category] || 0) + items.length;
      stats.itemsByLanguage[language] =
        (stats.itemsByLanguage[language] || 0) + items.length;
    }

    return stats;
  }
}

export const getKnowledgeBaseService = () => new KnowledgeBaseService();
export default KnowledgeBaseService;
