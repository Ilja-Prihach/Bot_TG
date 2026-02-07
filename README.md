# Telegram Interview Digest Bot

Personal Telegram bot that sends a daily digest with weather + interview Q&A, handles on-demand weather, and answers questions via Gemini.

## Features
- Daily digest with weather and 3 interview questions
- Commands for weather, interview questions, and AI answers
- SQLite storage via Prisma
- Per-user time and timezone support

## Requirements
- Node.js 20+
- Telegram bot token
- OpenWeatherMap API key
- Google Gemini API key (free tier)

## Setup
```bash
npm install
cp .env.example .env
```

Fill `.env` with your keys.

Initialize the database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

Run in dev mode:
```bash
npm run dev
```

Build and start:
```bash
npm run build
npm run start
```

## Commands
- `/start` — register and show help
- `/help` — list commands
- `/setcity <city>` — set city
- `/settime <HH:MM>` — set daily digest time
- `/on` — enable daily digest
- `/off` — disable daily digest
- `/weather` — show current weather
- `/interview` — send 3 random questions
- `/ask <question>` — ask AI

## Data
Interview questions live in `data/questions.json`. Add your own and keep the same schema (id, topic, question, answer, optional tags).

## Notes
- Timezone defaults to `Europe/Minsk`. You can update it manually in the DB if needed.
- `AI_DIGEST_LINE=false` disables extra AI one-liners in the daily digest.
