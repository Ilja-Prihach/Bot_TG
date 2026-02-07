import { promises as fs } from "fs";
import path from "path";
import { prisma } from "../db/client.js";
import { DateTime } from "luxon";

export type InterviewQuestion = {
  id: string;
  topic: string;
  level: "junior" | "middle" | "senior";
  question: string;
  answer: string;
  tags?: string[];
};

const QUESTIONS_PATH = path.resolve(process.cwd(), "data", "questions.json");
let cachedQuestions: InterviewQuestion[] | null = null;

async function loadQuestions(): Promise<InterviewQuestion[]> {
  if (cachedQuestions) return cachedQuestions;
  const raw = await fs.readFile(QUESTIONS_PATH, "utf-8");
  const data = JSON.parse(raw) as InterviewQuestion[];
  cachedQuestions = data;
  return data;
}

function pickRandom<T>(items: T[], count: number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export async function getQuestionsForUser(
  userId: number,
  count = 3
): Promise<InterviewQuestion[]> {
  const questions = await loadQuestions();
  if (questions.length === 0) return [];

  const since = DateTime.now().minus({ days: 7 }).toJSDate();
  const recent = await prisma.sentQuestion.findMany({
    where: { userId, sentAt: { gte: since } },
    select: { questionId: true }
  });
  const recentIds = new Set(recent.map((r) => r.questionId));
  const available = questions.filter((q) => !recentIds.has(q.id));
  const source = available.length >= count ? available : questions;
  return pickRandom(source, Math.min(count, source.length));
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
