import { wmoIcon, wmoLabel } from "@/lib/weather";
import { cn } from "@/lib/utils";

interface WeatherIconProps {
  code: number;
  tempMax?: number;
  tempMin?: number;
  /** "xs" = nur Emoji, "sm" = Emoji + Temps, "md" = größer */
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function WeatherIcon({
  code,
  tempMax,
  tempMin,
  size = "sm",
  className,
}: WeatherIconProps) {
  const icon  = wmoIcon(code);
  const label = wmoLabel(code);

  const emojiCls = size === "xs" ? "text-sm" : size === "sm" ? "text-base" : "text-2xl";
  const tempCls  = size === "md" ? "text-xs" : "text-[10px]";

  return (
    <div
      className={cn("flex flex-col items-center leading-none", className)}
      title={label}
    >
      <span className={emojiCls} aria-label={label}>
        {icon}
      </span>
      {size !== "xs" && (tempMax !== undefined || tempMin !== undefined) && (
        <span className={cn(tempCls, "text-muted-foreground tabular-nums mt-0.5")}>
          {tempMax !== undefined && (
            <span className="font-medium text-foreground">{tempMax}°</span>
          )}
          {tempMax !== undefined && tempMin !== undefined && (
            <span className="text-muted-foreground/60"> {tempMin}°</span>
          )}
          {tempMin !== undefined && tempMax === undefined && (
            <span>{tempMin}°</span>
          )}
        </span>
      )}
    </div>
  );
}
