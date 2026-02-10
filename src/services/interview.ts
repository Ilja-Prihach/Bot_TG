import { promises as fs } from "fs";
import path from "path";
import { prisma } from "../db/client.js";
import { DateTime } from "luxon";

export type InterviewQuestion = {
  id: string;
  topic: string;
  question: string;
  answer: string;
  tags?: string[];
};

const QUESTIONS_DIR = path.resolve(process.cwd(), "data", "questions");
let cachedQuestions: InterviewQuestion[] | null = null;

async function loadQuestions(): Promise<InterviewQuestion[]> {
  if (cachedQuestions) return cachedQuestions;
  const questions: InterviewQuestion[] = [];
  const entries = await fs.readdir(QUESTIONS_DIR);
  const files = entries.filter((entry) => entry.endsWith(".json"));

  for (const file of files) {
    const raw = await fs.readFile(path.join(QUESTIONS_DIR, file), "utf-8");
    const parsed = JSON.parse(raw) as InterviewQuestion[];
    questions.push(...parsed);
  }

  cachedQuestions = questions;
  return questions;
}

function pickRandom<T>(items: T[], count: number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

const PRIMARY_TOPIC_COUNTS: Record<string, number> = {
  react: 2,
  next: 2,
  fundamentals: 2,
  javascript: 2
};

const DEFAULT_OTHER_TOPIC_COUNT = 1;

export async function getQuestionsForUser(userId: number): Promise<InterviewQuestion[]> {
  const questions = await loadQuestions();
  if (questions.length === 0) return [];

  const since = DateTime.now().minus({ days: 7 }).toJSDate();
  const recent = await prisma.sentQuestion.findMany({
    where: { userId, sentAt: { gte: since } },
    select: { questionId: true }
  });
  const recentIds = new Set(recent.map((r) => r.questionId));
  const usedIds = new Set<string>();

  const byTopic = new Map<string, InterviewQuestion[]>();
  for (const q of questions) {
    if (!byTopic.has(q.topic)) byTopic.set(q.topic, []);
    byTopic.get(q.topic)?.push(q);
  }

  const selected: InterviewQuestion[] = [];

  const pickFromTopic = (topic: string, count: number) => {
    const pool = byTopic.get(topic) ?? [];
    if (pool.length === 0 || count <= 0) return;

    const fresh = pool.filter((q) => !recentIds.has(q.id) && !usedIds.has(q.id));
    const pickedFresh = pickRandom(fresh, Math.min(count, fresh.length));
    for (const q of pickedFresh) {
      selected.push(q);
      usedIds.add(q.id);
    }

    const remaining = count - pickedFresh.length;
    if (remaining > 0) {
      const fallback = pool.filter((q) => !usedIds.has(q.id));
      const pickedFallback = pickRandom(fallback, Math.min(remaining, fallback.length));
      for (const q of pickedFallback) {
        selected.push(q);
        usedIds.add(q.id);
      }
    }
  };

  for (const [topic, count] of Object.entries(PRIMARY_TOPIC_COUNTS)) {
    pickFromTopic(topic, count);
  }

  for (const topic of byTopic.keys()) {
    if (PRIMARY_TOPIC_COUNTS[topic]) continue;
    pickFromTopic(topic, DEFAULT_OTHER_TOPIC_COUNT);
  }

  return selected;
}

export async function recordQuestionsSent(
  userId: number,
  questionIds: string[]
): Promise<void> {
  if (questionIds.length === 0) return;
  await prisma.sentQuestion.createMany({
    data: questionIds.map((questionId) => ({ userId, questionId }))
  });
}
