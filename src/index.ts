import { loadEnv } from "./utils/env.js";
import { prisma } from "./db/client.js";
import { WeatherService } from "./services/weather.js";
import { createBot } from "./bot/index.js";
import cron from "node-cron";
import { DateTime } from "luxon";
import { buildDailyDigest, markDigestSent } from "./services/digest.js";

const env = loadEnv();

const weatherService = new WeatherService(env.WEATHER_API_KEY);
const bot = createBot(env.TELEGRAM_BOT_TOKEN, weatherService);

async function processDigestTick() {
  const users = await prisma.user.findMany({
    where: { enabledDailyDigest: true, dailyTime: { not: null } }
  });

  for (const user of users) {
    if (!user.city || !user.dailyTime) continue;

    const now = DateTime.now().setZone(user.timezone || "Europe/Minsk");
    if (!now.isValid) continue;

    const nowTime = now.toFormat("HH:mm");
    if (nowTime !== user.dailyTime) continue;

    if (user.lastDigestAt) {
      const last = DateTime.fromJSDate(user.lastDigestAt).setZone(
        user.timezone || "Europe/Minsk"
      );
      if (last.isValid && last.toISODate() === now.toISODate()) {
        continue;
      }
    }

    try {
      const message = await buildDailyDigest(
        user.id,
        user.city,
        user.timezone || "Europe/Minsk",
        weatherService
      );
      await bot.api.sendMessage(Number(user.chatId), message);
      await markDigestSent(user.id);
    } catch (error) {
      console.warn("Digest error", error);
    }
  }
}

const cronTask = cron.schedule("* * * * *", () => {
  processDigestTick().catch((error) => {
    console.warn("Digest tick error", error);
  });
});

bot.start({ onStart: () => console.log("Bot started") });

const shutdown = async () => {
  console.log("Shutting down...");
  cronTask.stop();
  bot.stop();
  await prisma.$disconnect();
  process.exit(0);
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
