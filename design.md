# Design System & HIG Specification (`design.md`)

> **Reference Standard:** Grounded in [`dickwu/apple-design-skill`](https://github.com/dickwu/apple-design-skill.git) (Apple Human Interface Guidelines + curated `liquid-glass.md` & `materials.md`).
> To install the design reviewer skill locally for Cursor or Claude Code:
> `npx skills add dickwu/apple-design-skill` or `git submodule add https://github.com/dickwu/apple-design-skill.git .design-rules`

---

## 1. Design Philosophy: Anti-Vibecode & Radical Simplicity
1. **Zero Gradients (Strict Plain Color Policy):**
   - Never use linear gradients, radial glows, mesh backgrounds, or purple-to-cyan AI tropes.
   - Every surface, button, badge, and progress bar uses a **100% flat, solid color**.
2. **One Screen, One Job:**
   - The user should understand their remaining daily budget, remaining tasks, and both streak counts within **2 seconds** of opening the app.
   - No decorative charts, pie graphs, avatars, or marketing banners inside the workspace.
3. **Structure Encodes Information:**
   - Hierarchy is achieved through **typography weight, whitespace, and alignment**—not heavy borders or drop shadows.

---

## 2. Liquid Glass Specification (`liquid-glass.md`)
Following Apple's Liquid Glass rules from `dickwu/apple-design-skill`:
- **Where Liquid Glass IS Used (Floating Functional Layer Only):**
  1. **iPhone Bottom Tab Bar** (floating pill bar pinned `16px` above safe-area bottom).
  2. **Laptop Sidebar / Top Sticky Streak Toolbar**.
  3. **Quick-Add Sheet / Modal Overlay**.
- **Where Liquid Glass is NEVER Used:**
  - **NEVER on content cards** (Task rows, Expense rows, Budget meters must sit on solid opaque surfaces for crisp 4.5:1+ contrast).
  - **NEVER stacked** (never place a blurred pill inside a blurred header).
  - **NEVER over-tinted** (do not tint the glass purple or blue; use neutral system translucency with a subtle `1px` specular inner border).

### CSS Implementation for Liquid Glass Chrome
```css
/* Apply ONLY to floating navigation bars and sheets */
.liquid-glass-chrome {
  background-color: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

@media (prefers-color-scheme: dark) {
  .liquid-glass-chrome {
    background-color: rgba(28, 28, 30, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }
}
```

---

## 3. Solid Color Palette (`color.md`)

### 3.1 Surface & Text Tokens (Plain Solid Colors)

| Token Role | Light Mode (Hex) | Dark Mode (Hex) | Usage |
| --- | --- | --- | --- |
| `--bg-canvas` | `#F2F2F7` | `#000000` | App root background (Apple System Grouped Background) |
| `--bg-surface` | `#FFFFFF` | `#1C1C1E` | Solid opaque task rows, expense rows, budget cards |
| `--bg-subtle` | `#E5E5EA` | `#2C2C2E` | Unfilled progress bar tracks, secondary pills |
| `--text-primary` | `#000000` | `#FFFFFF` | Task titles, expense amounts, headings |
| `--text-secondary` | `#636366` | `#98989D` | Timestamps, budget subtitles, empty states (light value darkened from `#6C6C70` for AA on `--bg-subtle`) |
| `--border-hairline` | `#C6C6C8` | `#38383A` | `1px` solid dividers between list items |
| `--accent` | `#0040DD` | `#409CFF` | UI accent text: active tab/sidebar item, Undo, focus ring (Apple increased-contrast blue) |
| `--accent-fill` | `#0060DF` | `#0060DF` | Primary button fill with white text (5.6:1) |
| `--danger` | `#D70015` | `#FF453A` | Error and over-budget text, Sign Out |

*Category colors (§3.2) are reserved for categories and budget-meter fills; UI accents and errors use the three tokens above so "one color means one thing" and all text passes WCAG AA (4.5:1).*

### 3.2 Shared Category Color Tokens (Tasks & Expenses)

*Rule: "One color means one thing." These exact solid colors are shared across Task tags and Expense tags.*

| Category Key | Meaning | Light Mode Solid | Dark Mode Solid | Soft Pill Tint (12% Opacity) |
| --- | --- | --- | --- | --- |
| **`RED`** | Health / Fitness | `#FF3B30` | `#FF453A` | `rgba(255, 59, 48, 0.12)` |
| **`BLUE`** | Study / Work | `#007AFF` | `#0A84FF` | `rgba(0, 122, 255, 0.12)` |
| **`GREEN`** | Eating / Food | `#34C759` | `#30D158` | `rgba(52, 199, 89, 0.12)` |
| **`AMBER`** | Personal / Other | `#FF9500` | `#FF9F0A` | `rgba(255, 149, 0, 0.12)` |

---

## 4. Typography & Hierarchy (`typography.md`)

- **Font Family:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif`
- **Numeric Discipline:** Apply `font-variant-numeric: tabular-nums` to all prices, budgets, and streak numbers.
- **Scale:**
  - **Screen Title:** `28px` (`1.75rem`), Bold (`700`), tracking `-0.02em`
  - **Section Header:** `13px` (`0.8125rem`), Semibold (`600`), Uppercase, tracking `0.04em`, `--text-secondary`
  - **Body / Task & Expense Row:** `17px` on iPhone / `15px` on Laptop, Regular (`400`), line-height `1.4`
  - **Metadata / Category Pill:** `12px` (`0.75rem`), Medium (`500`)

---

## 5. Layout & Platform Navigation (`layout.md`)

- **iPhone Layout (< 768px):**
  - Single-column vertical scroll (`max-width: 100%`, horizontal padding `16px`).
  - Top bar shows Today's Date + **🔥 Task Streak** and **🛡️ Budget Streak** pills.
  - Bottom floating **Liquid Glass Tab Bar** with 4 tabs: **Today**, **Calendar**, **Expenses**, **Settings**.
- **Laptop Layout (≥ 768px):**
  - Left **Liquid Glass Sidebar** (`240px` wide) containing navigation + live Streak counters.
  - Main workspace centered (`max-width: 880px`) using a clean 2-column grid on the "Today" view (Left Column: Daily Tasks; Right Column: Day/Week/Month Budget Meters + Daily Expenses).
- **Copywriting Rules (`writing.md`):**
  - Every button states the exact action in Title Case: `"Add Task"`, `"Log Expense"`, `"Save Budgets"`, `"Done Editing"`, `"Save Repeat"`, `"Stop Repeating"` (never `"Submit"` or `"OK"`).

---

## 6. Streak Line, Live Flame & Celebration (`motion.md`)

* **Streak Line card (Today, top):** solid `--bg-surface` card with a "STREAKS" header and a Tasks / Budget segmented toggle. Below it, **Current streak** and **Longest streak** (with trophy icon) as 34px bold `tabular-nums` figures, then a 7-day row (4 days back, today, 2 ahead), then "Total task/budget days: N".
  * Day circle states (40px): **won** = solid `--accent-fill` with a white live flame (Tasks) or shield (Budget); **today, not yet won** = 2px dashed `--accent` ring plus a small `--accent` triangle marker above; **missed** = 1.5px `--border-hairline` ring; **future** = solid `--bg-subtle`.
* **Live blue flame (`BlueFlame`):** two flat SVG shapes. The outer flame uses `currentColor`; the inner core uses `--flame-core` (`#9CC8FF`). The outer flame flickers (`scaleY` + `skewX`, 1.25s) and the core pulses out of phase (0.9s), both anchored at the base. No gradients, blur or glow.
* **All-done celebration:** shown only when the last task is ticked in view mode. A dimmed backdrop and a solid `--bg-surface` card (no glass) pop in, with three flat `--accent` rings bursting outward (staggered 180ms), an `--accent-fill` disc with a large live flame, "All Tasks Done" and the new streak. It closes itself after 2.6s, or on tap.
* **Reduced motion:** under `prefers-reduced-motion: reduce`, the flame is static, the rings are hidden, and the card appears instantly.

## 7. Calendar (`calendar`)

* Solid card with a month header (chevron buttons, "Today" shortcut when off-month) and a Monday-first 7-column grid of 44×48px day cells.
* Cell indicators: past/today **all done** → small blue flame; **unfinished** → small hollow ring; **future** → count of planned tasks (repeats included). Selected day = `--accent-fill` with white text; today = 2px inset `--accent` ring; days outside the month at 40% opacity.
* Day detail beside the grid on laptop (below it on iPhone): a relative label (Today / Tomorrow / Upcoming / Past day), the full date, and the task list. Future days add an "Add to <date>" form.

## 8. Edit Mode & Expense Scope

* **Edit / Done Editing** toggle in the Tasks header: an `--accent` text pill in view mode, a filled `--accent-fill` pill in edit mode. In edit mode, checkboxes are shown at 40% opacity (locked), and each row gets Repeat and Delete icon buttons (44px).
* **WeekdayPicker:** seven 44px round chips (M T W T F S S, filled `--accent-fill` when selected) plus Every Day / Weekdays / Weekends presets. Repeating rows show a small repeat icon and "Weekdays" / "Mon, Wed" text next to the category.
* **Expense "Counts toward":** a 3-segment control (Today / This Week / This Month) on a `--bg-subtle` track, with a one-line hint underneath. Non-daily expenses show a "Weekly" / "Monthly" chip in the list.
