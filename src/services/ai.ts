export type AIAnswer = {
  text: string;
};

export interface AIProvider {
  ask(question: string): Promise<AIAnswer>;
  oneLiner?(text: string): Promise<string | null>;
}

export class GeminiProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async ask(question: string): Promise<AIAnswer> {
    const url = new URL(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    );
    url.searchParams.set("key", this.apiKey);

    const prompt = [
      "Ты интервью-ассистент для фронтенд-разработчика.",
      "Отвечай по-русски, кратко и структурировано.",
      "Если не уверен — так и скажи.",
      "Максимум 1200 символов.",
      "Примеры кода добавляй только если их явно попросили.",
      "Вопрос:",
      question
    ].join("\n");

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.2
        }
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${text}`);
    }

    const data = (await res.json()) as any;
    const text =
      data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ||
      "";

    return { text: text.trim() || "Не удалось получить ответ." };
  }

  async oneLiner(text: string): Promise<string | null> {
    const url = new URL(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    );
    url.searchParams.set("key", this.apiKey);

    const prompt = [
      "Сформулируй одну короткую фразу для собеседования на русском.",
      "Не более 120 символов.",
      "Текст:",
      text
    ].join("\n");

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 80,
          temperature: 0.3
        }
      })
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as any;
    const responseText =
      data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ||
      "";

    const trimmed = responseText.trim();
    return trimmed ? trimmed.slice(0, 120) : null;
  }
}
