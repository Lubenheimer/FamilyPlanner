import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DailyWeather, HourlyWeather } from "@/lib/weather";
import { geocodeCity, fetchForecast } from "@/lib/weather";

const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 Stunden
const MAX_FORECAST_DAYS = 14;

// Gecachte Wetterdaten pro Stadt (Kleinschreibung als Key)
interface LocationCache {
  daily: DailyWeather[];
  fetchedAt: string;
}

interface WeatherState {
  // Heimat-Standort
  city: string;
  lat: number | null;
  lon: number | null;
  locationName: string;

  // Heimat-Forecast
  daily: DailyWeather[];
  hourly: HourlyWeather[];
  lastFetch: string | null;

  // Cache für andere Orte (z.B. Ausflugsziele)
  locationCache: Record<string, LocationCache>;

  // UI-Status
  loading: boolean;
  error: string | null;

  // Aktionen
  setLocation: (city: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  fetchForLocation: (city: string) => Promise<DailyWeather[] | null>;

  // Selektoren
  getDailyForDate: (dateStr: string) => DailyWeather | undefined;
  getHourlyForDate: (dateStr: string) => HourlyWeather[];
  dailyMap: () => Record<string, DailyWeather>;
  getDailyForLocationAndDate: (city: string, dateStr: string) => DailyWeather | undefined;
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
      locationCache: {},
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
        if (age < CACHE_TTL_MS) return;
        set({ loading: true, error: null });
        try {
          const { daily, hourly } = await fetchForecast(lat, lon);
          set({ daily, hourly, lastFetch: new Date().toISOString(), loading: false });
        } catch {
          set({ loading: false, error: "Wetter-Update fehlgeschlagen" });
        }
      },

      /** Wetter für einen beliebigen Ort holen (mit Cache) */
      fetchForLocation: async (city) => {
        const key = city.toLowerCase().trim();
        const cached = get().locationCache[key];

        // Cache noch frisch?
        if (cached) {
          const age = Date.now() - new Date(cached.fetchedAt).getTime();
          if (age < CACHE_TTL_MS) return cached.daily;
        }

        try {
          const geo = await geocodeCity(city);
          if (!geo) return null;
          const { daily } = await fetchForecast(geo.lat, geo.lon);
          set((s) => ({
            locationCache: {
              ...s.locationCache,
              [key]: { daily, fetchedAt: new Date().toISOString() },
            },
          }));
          return daily;
        } catch {
          return null;
        }
      },

      getDailyForDate: (dateStr) => get().daily.find((d) => d.date === dateStr),

      getHourlyForDate: (dateStr) =>
        get().hourly.filter((h) => h.time.startsWith(dateStr)),

      dailyMap: () =>
        Object.fromEntries(get().daily.map((d) => [d.date, d])),

      /** Wetter für einen Ausflugsort an einem bestimmten Tag (nur aus Cache) */
      getDailyForLocationAndDate: (city, dateStr) => {
        const key = city.toLowerCase().trim();
        return get().locationCache[key]?.daily.find((d) => d.date === dateStr);
      },
    }),
    { name: "family-planner:weather" },
  ),
);

/** Prüft ob ein Datum im 14-Tage-Forecast-Fenster liegt */
export function isWithinForecastWindow(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + MAX_FORECAST_DAYS);
  return date >= today && date <= maxDate;
}
