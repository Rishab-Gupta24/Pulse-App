import { cn } from "@/lib/utils/cn";

/**
 * Flat two-tone flame. `live` adds the flicker animation (paused under
 * prefers-reduced-motion). Outer shape uses currentColor; the core uses `coreClass`.
 */
export default function BlueFlame({
  size = 20,
  live = false,
  coreClass = "fill-[var(--accent)]",
  className,
}: {
  size?: number;
  live?: boolean;
  coreClass?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className={cn(live && "flame-live", className)}
    >
      <path
        className="flame-outer"
        fill="currentColor"
        d="M12.4 2c.5 3.1 3.6 5 4.7 8.2 1.3 3.8-.7 8.2-4.8 9.1-4.3.9-7.8-2.4-7.4-6.4.2-2.3 1.6-3.8 2.5-4.8.3 1.7 1 2.7 2.1 3.1-.6-3.5.9-7 2.9-9.2z"
      />
      <path
        className={cn("flame-core", coreClass)}
        d="M12.3 10.6c.3 1.6 2.1 2.6 2.3 4.4.3 2.1-1.2 3.7-3 3.7-1.9 0-3.2-1.6-2.9-3.4.2-1.1.9-1.8 1.4-2.3.1.8.5 1.4 1.1 1.6-.2-1.5.4-3 1.1-4z"
      />
    </svg>
  );
}
