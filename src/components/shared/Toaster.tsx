"use client";

import { useToast } from "@/hooks/useToast";

/** Solid toast stack; sits above the iPhone tab bar and inside the laptop workspace. */
export default function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(104px+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 md:bottom-6 md:left-60"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-hairline bg-surface py-1 pl-4 pr-1 text-[15px] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          <span className="flex-1 py-2">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                dismiss(toast.id);
              }}
              className="min-h-11 rounded-xl px-3 font-semibold text-blue"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
