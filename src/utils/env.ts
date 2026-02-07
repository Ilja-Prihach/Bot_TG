import "dotenv/config";

export type Env = {
  TELEGRAM_BOT_TOKEN: string;
  WEATHER_API_KEY: string;
  GEMINI_API_KEY: string;
  DATABASE_URL: string;
  AI_DIGEST_LINE: boolean;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function loadEnv(): Env {
  return {
    TELEGRAM_BOT_TOKEN: requireEnv("TELEGRAM_BOT_TOKEN"),
    WEATHER_API_KEY: requireEnv("WEATHER_API_KEY"),
    GEMINI_API_KEY: requireEnv("GEMINI_API_KEY"),
    DATABASE_URL: requireEnv("DATABASE_URL"),
    AI_DIGEST_LINE: (process.env.AI_DIGEST_LINE || "").toLowerCase() === "true"
  };
}
