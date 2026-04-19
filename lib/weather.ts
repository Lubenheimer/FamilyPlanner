// ─── Typen ────────────────────────────────────────────────────────────────────

export interface DailyWeather {
  date: string;           // "YYYY-MM-DD"
  weatherCode: number;    // WMO-Code
  tempMax: number;        // °C gerundet
  tempMin: number;
  precipitationSum: number; // mm
}

export interface HourlyWeather {
  time: string;           // "YYYY-MM-DDTHH:00"
  temp: number;
  weatherCode: number;
}

// ─── WMO Weather Interpretation Codes ─────────────────────────────────────────

export function wmoIcon(code: number): string {
  if (code === 0)            return "☀️";
  if (code <= 2)             return "🌤️";
  if (code === 3)            return "☁️";
  if (code <= 48)            return "🌫️";
  if (code <= 55)            return "🌦️";
  if (code <= 65)            return "🌧️";
  if (code <= 67)            return "🌨️";
  if (code <= 77)            return "❄️";
  if (code <= 82)            return "🌦️";
  if (code <= 86)            return "🌨️";
  if (code <= 99)            return "⛈️";
  return "🌡️";
}

export function wmoLabel(code: number): string {
  if (code === 0)            return "Sonnig";
  if (code <= 2)             return "Heiter";
  if (code === 3)            return "Bewölkt";
  if (code <= 48)            return "Neblig";
  if (code <= 55)            return "Nieselregen";
  if (code <= 65)            return "Regen";
  if (code <= 67)            return "Eisregen";
  if (code <= 77)            return "Schnee";
  if (code <= 82)            return "Regenschauer";
  if (code <= 86)            return "Schneeschauer";
  if (code <= 99)            return "Gewitter";
  return "Unbekannt";
}

// ─── Open-Meteo API ────────────────────────────────────────────────────────────

export async function geocodeCity(
  city: string,
): Promise<{ lat: number; lon: number; name: string } | null> {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(city)}&count=1&language=de&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.results?.length) return null;
  const r = data.results[0];
  return { lat: r.latitude, lon: r.longitude, name: r.name };
}

export async function fetchForecast(
  lat: number,
  lon: number,
): Promise<{ daily: DailyWeather[]; hourly: HourlyWeather[] }> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "daily",
    "weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum",
  );
  url.searchParams.set("hourly", "temperature_2m,weathercode");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "14");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const data = await res.json();

  const daily: DailyWeather[] = (data.daily.time as string[]).map(
    (date: string, i: number) => ({
      date,
      weatherCode: data.daily.weathercode[i] ?? 0,
      tempMax: Math.round(data.daily.temperature_2m_max[i] ?? 0),
      tempMin: Math.round(data.daily.temperature_2m_min[i] ?? 0),
      precipitationSum: data.daily.precipitation_sum[i] ?? 0,
    }),
  );

  const hourly: HourlyWeather[] = (data.hourly.time as string[]).map(
    (time: string, i: number) => ({
      time,
      temp: Math.round(data.hourly.temperature_2m[i] ?? 0),
      weatherCode: data.hourly.weathercode[i] ?? 0,
    }),
  );

  return { daily, hourly };
}
