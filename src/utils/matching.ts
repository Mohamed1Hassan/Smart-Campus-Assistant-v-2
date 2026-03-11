import {
  predefinedResponses,
  predefinedKeys,
} from "../data/predefinedResponses";
import kb from "../data/knowledgeBase.json";

interface KBEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  language: string;
  tags: string[];
  confidence: number;
}

interface PredefinedMatch {
  key: string;
  response: string | string[];
  score: number;
}

// Basic similarity without external deps (fallback). We will also install string-similarity.
export function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export function normalize(text: string): string {
  return text.toLowerCase().trim();
}

export function findKBMatch(text: string): KBEntry | null {
  const normalized = normalize(text);
  const kbData = kb as KBEntry[];
  for (const entry of kbData) {
    const keywords = entry.question.toLowerCase().split("|");
    if (keywords.some((kw) => normalized.includes(kw))) {
      return entry;
    }
  }
  return null;
}

export function basicSimilarity(a: string, b: string): number {
  const s1 = normalize(a);
  const s2 = normalize(b);
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  const set1 = new Set(s1.split(/\s+/));
  const set2 = new Set(s2.split(/\s+/));
  let overlap = 0;
  set1.forEach((w) => {
    if (set2.has(w)) overlap += 1;
  });
  const denom = Math.max(set1.size, set2.size);
  return denom ? overlap / denom : 0;
}

export function findPredefinedMatch(text: string): PredefinedMatch | null {
  const target = normalize(text);
  let best: { key: string | null; score: number } = { key: null, score: 0 };
  for (const key of predefinedKeys) {
    const score = basicSimilarity(target, key);
    if (score > best.score) best = { key, score };
  }
  if (best.key && best.score >= 0.5) {
    return {
      key: best.key,
      response: (predefinedResponses as Record<string, string | string[]>)[
        best.key
      ],
      score: best.score,
    };
  }
  return null;
}
