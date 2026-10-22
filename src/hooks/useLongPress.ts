"use client";

import { useRef, type MouseEvent, type PointerEvent } from "react";

const HOLD_MS = 500;
const MOVE_TOLERANCE_PX = 10;

/**
 * Long-press (touch / pen / primary mouse button held ~0.5s) and right-click both
 * call `onLongPress`. Moving more than 10px cancels, so scrolling never triggers it.
 * Pass `null` to disable.
 */
export function useLongPress(onLongPress: (() => void) | null) {
  const timer = useRef<number | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
  };

  if (!onLongPress) return {};

  // Only a held press marks `fired`: its trailing click must be swallowed.
  // A right-click has no trailing click, so it must not set it.
  const fireFromHold = () => {
    fired.current = true;
    clear();
    onLongPress();
  };

  return {
    onPointerDown: (event: PointerEvent) => {
      fired.current = false; // every new gesture starts fresh, including right-clicks
      if (event.pointerType === "mouse" && event.button !== 0) return;
      origin.current = { x: event.clientX, y: event.clientY };
      timer.current = window.setTimeout(fireFromHold, HOLD_MS);
    },
    onPointerMove: (event: PointerEvent) => {
      if (!origin.current) return;
      const dx = event.clientX - origin.current.x;
      const dy = event.clientY - origin.current.y;
      if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) clear();
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    // Right-click on laptops; on Android a long-press also emits this — don't double-fire.
    onContextMenu: (event: MouseEvent) => {
      event.preventDefault();
      if (fired.current) return;
      clear();
      onLongPress();
    },
    // Swallow the click that follows a long-press so it doesn't also tap a control.
    onClickCapture: (event: MouseEvent) => {
      if (fired.current) {
        event.preventDefault();
        event.stopPropagation();
        fired.current = false;
      }
    },
  };
}
