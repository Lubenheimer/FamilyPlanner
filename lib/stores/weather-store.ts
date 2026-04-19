import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DailyWeather, HourlyWeather } from "@/lib/weather";
import { geocodeCity, fetchForecast } from "@/lib/weather";

const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 Stunden

interface WeatherState {
  // Standort
  city: string;
  lat: number | null;
  lon: number | null;
  locationName: string;

  // Forecast-Daten
  daily: DailyWeather[];
  hourly: HourlyWeather[];
  lastFetch: string | null;

  // UI-Status
  loading: boolean;
  error: string | null;

  // Aktionen
  setLocation: (city: string) => Promise<boolean>;
  refresh: () => Promise<void>;

  // Selektoren
  getDailyForDate: (dateStr: string) => DailyWeather | undefined;
  getHourlyForDate: (dateStr: string) => HourlyWeather[];
  dailyMap: () => Record<string, DailyWeather>;
}

export const useWeatherStore = create<WeatherState>()(
  persist(
    (set, get) => ({
      city: "",
      lat: null,
      lon: null,
      locationName: "",
      daily: [],
      hourly: [],
      lastFetch: null,
      loading: false,
      error: null,

      setLocation: async (city) => {
        set({ loading: true, error: null });
        try {
          const geo = await geocodeCity(city);
          if (!geo) {
            set({ loading: false, error: "Stadt nicht gefunden" });
            return false;
          }
          const { daily, hourly } = await fetchForecast(geo.lat, geo.lon);
          set({
            city,
            lat: geo.lat,
            lon: geo.lon,
            locationName: geo.name,
            daily,
            hourly,
            lastFetch: new Date().toISOString(),
            loading: false,
            error: null,
          });
          return true;
        } catch {
          set({ loading: false, error: "Wetter konnte nicht geladen werden" });
          return false;
        }
      },

      refresh: async () => {
        const { lat, lon, lastFetch } = get();
        if (!lat || !lon) return;
        const age = lastFetch ? Date.now() - new Date(lastFetch).getTime() : Infinity;
        if (age < CACHE_TTL_MS) return; // Cache noch frisch
        set({ loading: true, error: null });
        try {
          const { daily, hourly } = await fetchForecast(lat, lon);
          set({ daily, hourly, lastFetch: new Date().toISOString(), loading: false });
        } catch {
          set({ loading: false, error: "Wetter-Update fehlgeschlagen" });
        }
      },

      getDailyForDate: (dateStr) => get().daily.find((d) => d.date === dateStr),

      getHourlyForDate: (dateStr) =>
        get().hourly.filter((h) => h.time.startsWith(dateStr)),

      dailyMap: () =>
        Object.fromEntries(get().daily.map((d) => [d.date, d])),
    }),
    { name: "family-planner:weather" },
  ),
);
