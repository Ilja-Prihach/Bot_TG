import { Bot } from "grammy";
import { registerHandlers } from "./handlers.js";
import { WeatherService } from "../services/weather.js";
export function createBot(token: string, weatherService: WeatherService): Bot {
  const bot = new Bot(token);
  registerHandlers(bot, { weatherService });
  return bot;
}
