import { Bot } from "grammy";
import { registerHandlers } from "./handlers.js";
import { WeatherService } from "../services/weather.js";
import { AIProvider } from "../services/ai.js";

export function createBot(
  token: string,
  weatherService: WeatherService,
  aiProvider: AIProvider
): Bot {
  const bot = new Bot(token);
  registerHandlers(bot, { weatherService, aiProvider });
  return bot;
}
