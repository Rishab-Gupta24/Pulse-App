"use client";

import { WEEKDAYS, type Weekday } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

const PRESETS: { label: string; days: Weekday[] }[] = [
  { label: "Every Day", days: [0, 1, 2, 3, 4, 5, 6] },
  { label: "Weekdays", days: [1, 2, 3, 4, 5] },
  { label: "Weekends", days: [0, 6] },
];

const sameSet = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((d) => b.includes(d));

/** Multi-select Monday–Sunday chips plus quick presets for repeating tasks. */
export default function WeekdayPicker({
  value,
  onChange,
  className,
}: {
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
  className?: string;
}) {
  const toggle = (day: Weekday) =>
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Full-bleed by 4px so 7 chips keep a ~44px hit area inside a padded card. */}
      <div role="group" aria-label="Repeat on" className="-mx-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map(({ value: day, short, label }) => {
          const selected = value.includes(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={selected}
              aria-label={label}
              onClick={() => toggle(day)}
              className={cn(
                "flex min-h-11 items-center justify-center rounded-full text-[13px] font-semibold",
                selected ? "bg-accent-fill text-white" : "bg-subtle text-secondary",
              )}
            >
              {short}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            aria-pressed={sameSet(value, preset.days)}
            onClick={() => onChange(preset.days)}
            className={cn(
              "min-h-11 rounded-full px-3 text-xs font-medium",
              sameSet(value, preset.days) ? "bg-accent-fill text-white" : "bg-subtle text-secondary",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
