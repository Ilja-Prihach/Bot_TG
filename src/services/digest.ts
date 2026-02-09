import { DateTime } from "luxon";
import { WeatherService } from "./weather.js";
import { getQuestionsForUser, recordQuestionsSent } from "./interview.js";
import { prisma } from "../db/client.js";

export async function buildDailyDigest(
  userId: number,
  city: string,
  timezone: string,
  weatherService: WeatherService
): Promise<string> {
  const now = DateTime.now().setZone(timezone);
  const header = `\uD83D\uDCC5 ${now.toFormat("dd LLL yyyy")}, ${city}`;

  let weatherLine = "Погода: нет данных.";
  try {
    const weather = await weatherService.getCurrent(city);
    const precip =
      weather.precipitationMm != null
        ? `, осадки ~${weather.precipitationMm} мм`
        : "";
    weatherLine = `\u2600\uFE0F ${weather.description}, ${Math.round(
      weather.temp
    )}°C (ощущается как ${Math.round(weather.feelsLike)}°C)${precip}`;
  } catch (error) {
    console.warn("Weather error", error);
  }

  const questions = await getQuestionsForUser(userId);
  await recordQuestionsSent(
    userId,
    questions.map((q) => q.id)
  );

  const questionLines: string[] = [];
  for (const q of questions) {
    questionLines.push(`\n\u2753 ${q.question}`);
    questionLines.push(`\u2705 ${q.answer}`);

  }

  return [header, weatherLine, ...questionLines].join("\n");
}

export async function markDigestSent(userId: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastDigestAt: new Date() }
  });
}
