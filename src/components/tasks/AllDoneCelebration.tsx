"use client";

import { useEffect } from "react";
import BlueFlame from "@/components/shared/BlueFlame";

const AUTO_CLOSE_MS = 2600;

/** Brief, dismissible "all tasks done" moment: flat blue rings + live flame. */
export default function AllDoneCelebration({
  open,
  streak,
  onClose,
}: {
  open: boolean;
  streak: number;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
    >
      <div className="animate-pop-in relative flex w-full max-w-xs flex-col items-center gap-2 overflow-hidden rounded-3xl bg-surface px-6 pb-6 pt-8 text-center">
        <div className="relative flex size-28 items-center justify-center">
          {[0, 1, 2].map((ring) => (
            <span
              key={ring}
              aria-hidden
              className="animate-ring-burst absolute inset-6 rounded-full border-2 border-accent"
              style={{ animationDelay: `${ring * 180}ms` }}
            />
          ))}
          <span className="relative flex size-20 items-center justify-center rounded-full bg-accent-fill text-white">
            <BlueFlame size={48} live coreClass="fill-[var(--flame-core)]" />
          </span>
        </div>
        <p className="text-[22px] font-bold tracking-[-0.02em]">All Tasks Done</p>
        <p className="text-[15px] tabular-nums text-secondary">
          Task streak: {streak} {streak === 1 ? "day" : "days"}
        </p>
      </div>
    </div>
  );
}
