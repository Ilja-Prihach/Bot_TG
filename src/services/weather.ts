export type WeatherSummary = {
  description: string;
  temp: number;
  feelsLike: number;
  precipitationMm?: number;
};

export class WeatherService {
  constructor(private apiKey: string) {}

  async getCurrent(city: string): Promise<WeatherSummary> {
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("q", city);
    url.searchParams.set("appid", this.apiKey);
    url.searchParams.set("units", "metric");
    url.searchParams.set("lang", "ru");

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Weather API error: ${res.status} ${text}`);
    }
    const data = (await res.json()) as any;

    const description = data.weather?.[0]?.description || "нет данных";
    const temp = Number(data.main?.temp ?? 0);
    const feelsLike = Number(data.main?.feels_like ?? temp);
    const precipitationMm =
      Number(data.rain?.["1h"] ?? data.snow?.["1h"]) || undefined;

    return { description, temp, feelsLike, precipitationMm };
  }
}
