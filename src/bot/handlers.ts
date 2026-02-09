import { Bot, Context } from "grammy";
import { prisma } from "../db/client.js";
import { parseTime } from "../utils/time.js";
import { WeatherService } from "../services/weather.js";
import { getQuestionsForUser, recordQuestionsSent } from "../services/interview.js";

export type BotDependencies = {
  weatherService: WeatherService;
};

async function ensureUser(chatId: string) {
  const existing = await prisma.user.findUnique({ where: { chatId } });
  if (existing) return existing;
  return prisma.user.create({ data: { chatId } });
}

function helpText(): string {
  return [
    "Доступные команды:",
    "/start — регистрация и помощь",
    "/help — список команд",
    "/setcity <город> — установить город",
    "/settime <HH:MM> — время ежедневного дайджеста",
    "/on — включить ежедневный дайджест",
    "/off — выключить ежедневный дайджест",
    "/weather — погода для сохраненного города",
    "/interview — вопросы с ответами"
  ].join("\n");
}

export function registerHandlers(bot: Bot<Context>, deps: BotDependencies) {
  bot.command("start", async (ctx) => {
    const chatId = String(ctx.chat?.id);
    await ensureUser(chatId);
    await ctx.reply("Привет! Бот готов к работе.\n" + helpText());
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(helpText());
  });

  bot.command("setcity", async (ctx) => {
    const chatId = String(ctx.chat?.id);
    const city = ctx.match?.toString().trim();
    if (!city) {
      await ctx.reply("Укажи город после команды, например: /setcity Berlin");
      return;
    }
    const user = await ensureUser(chatId);
    await prisma.user.update({ where: { id: user.id }, data: { city } });
    await ctx.reply(`Город сохранен: ${city}`);
  });

  bot.command("settime", async (ctx) => {
    const chatId = String(ctx.chat?.id);
    const raw = ctx.match?.toString().trim() || "";
    const time = parseTime(raw);
    if (!time) {
      await ctx.reply("Неверный формат. Пример: /settime 08:30");
      return;
    }
    const user = await ensureUser(chatId);
    await prisma.user.update({
      where: { id: user.id },
      data: { dailyTime: raw }
    });
    await ctx.reply(`Время дайджеста сохранено: ${raw}`);
  });

  bot.command("on", async (ctx) => {
    const chatId = String(ctx.chat?.id);
    const user = await ensureUser(chatId);
    await prisma.user.update({
      where: { id: user.id },
      data: { enabledDailyDigest: true }
    });
    await ctx.reply("Ежедневный дайджест включен.");
  });

  bot.command("off", async (ctx) => {
    const chatId = String(ctx.chat?.id);
    const user = await ensureUser(chatId);
    await prisma.user.update({
      where: { id: user.id },
      data: { enabledDailyDigest: false }
    });
    await ctx.reply("Ежедневный дайджест выключен.");
  });

  bot.command("weather", async (ctx) => {
    const chatId = String(ctx.chat?.id);
    const user = await ensureUser(chatId);
    if (!user.city) {
      await ctx.reply("Сначала установи город через /setcity");
      return;
    }
    try {
      const weather = await deps.weatherService.getCurrent(user.city);
      const precip =
        weather.precipitationMm != null
          ? `, осадки ~${weather.precipitationMm} мм`
          : "";
      await ctx.reply(
        `Погода сейчас в ${user.city}: ${weather.description}, ${Math.round(
          weather.temp
        )}°C (ощущается как ${Math.round(weather.feelsLike)}°C)${precip}`
      );
    } catch (error) {
      console.warn("Weather error", error);
      await ctx.reply("Не удалось получить погоду. Попробуй позже.");
    }
  });

  bot.command("interview", async (ctx) => {
    const chatId = String(ctx.chat?.id);
    const user = await ensureUser(chatId);
    const questions = await getQuestionsForUser(user.id);
    await recordQuestionsSent(
      user.id,
      questions.map((q) => q.id)
    );

    if (questions.length === 0) {
      await ctx.reply("Вопросы не найдены.");
      return;
    }

    const lines: string[] = [];
    for (const q of questions) {
      lines.push(`\n\u2753 ${q.question}`);
      lines.push(`\u2705 ${q.answer}`);
    }

    await ctx.reply(lines.join("\n").trim());
  });

  // AI integration removed for now.
}
