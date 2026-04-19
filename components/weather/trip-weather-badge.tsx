"use client";

import { useEffect, useState } from "react";
import { useWeatherStore, isWithinForecastWindow } from "@/lib/stores/weather-store";
import type { DailyWeather } from "@/lib/weather";
import { wmoIcon, wmoLabel } from "@/lib/weather";

interface TripWeatherBadgeProps {
  plannedDate: string;       // "YYYY-MM-DD"
  location?: string;         // Ausflugsziel-Stadt
  /** "compact" = nur Icon+Temp in einer Zeile, "full" = Icon + Label + Temps */
  variant?: "compact" | "full";
}

export function TripWeatherBadge({
  plannedDate,
  location,
  variant = "compact",
}: TripWeatherBadgeProps) {
  const { fetchForLocation, getDailyForDate, getDailyForLocationAndDate, city: homeCity } =
    useWeatherStore();

  const [weather, setWeather] = useState<DailyWeather | null | undefined>(undefined);
  // undefined = laden, null = nicht verfügbar, DailyWeather = Daten vorhanden

  useEffect(() => {
    if (!plannedDate || !isWithinForecastWindow(plannedDate)) {
      setWeather(null);
      return;
    }

    const targetCity = location?.trim() || homeCity;
    if (!targetCity) {
      setWeather(null);
      return;
    }

    // Heimat-Standort → direkt aus dem Store
    if (!location?.trim() || location.trim().toLowerCase() === homeCity.toLowerCase()) {
      const w = getDailyForDate(plannedDate);
      setWeather(w ?? null);
      return;
    }

    // Anderen Ort → aus Cache oder neu laden
    const cached = getDailyForLocationAndDate(targetCity, plannedDate);
    if (cached) {
      setWeather(cached);
      return;
    }

    setWeather(undefined); // Ladeindikator
    fetchForLocation(targetCity).then((daily) => {
      const w = daily?.find((d) => d.date === plannedDate);
      setWeather(w ?? null);
    });
  }, [
    plannedDate,
    location,
    homeCity,
    fetchForLocation,
    getDailyForDate,
    getDailyForLocationAndDate,
  ]);

  // Datum liegt außerhalb des Forecast-Fensters (> 14 Tage oder Vergangenheit)
  if (!isWithinForecastWindow(plannedDate)) return null;

  // Lädt
  if (weather === undefined) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground animate-pulse">
        🌡️ Lade…
      </span>
    );
  }

  // Keine Daten
  if (weather === null) return null;

  if (variant === "full") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-sky-50 border border-sky-100 px-3 py-2">
        <span className="text-2xl">{wmoIcon(weather.weatherCode)}</span>
        <div>
          <p className="text-sm font-medium text-sky-800">{wmoLabel(weather.weatherCode)}</p>
          <p className="text-xs text-sky-600 tabular-nums">
            {weather.tempMax}° / {weather.tempMin}°
            {weather.precipitationSum > 0 && ` · 🌧 ${weather.precipitationSum} mm`}
          </p>
        </div>
      </div>
    );
  }

  // compact
  return (
    <span
      className="inline-flex items-center gap-1 text-sm"
      title={`${wmoLabel(weather.weatherCode)} · ${weather.tempMax}° / ${weather.tempMin}°`}
    >
      {wmoIcon(weather.weatherCode)}
      <span className="text-xs text-muted-foreground tabular-nums">
        {weather.tempMax}° / {weather.tempMin}°
      </span>
    </span>
  );
}
