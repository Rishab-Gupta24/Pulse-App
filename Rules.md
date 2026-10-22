# Engineering & Design Rulebook (`Rules.md`)

> **CRITICAL FOR AI AGENTS & DEVELOPERS:** Read this file and `design.md` before writing or modifying any code. Every pull request or AI generation must strictly comply with these rules.

---

## 1. Strict Requirements (What To Do)
1. **Single Shared Category Taxonomy:** Tasks and Expenses MUST share the exact same category constants (`RED`, `BLUE`, `GREEN`, `AMBER`) defined in `src/lib/constants/categories.ts`. Never duplicate color definitions across components.
2. **Optimistic UI for All Actions:** Adding, completing, or deleting a task/expense MUST update the UI immediately (<16ms) before the network request finishes. Roll back with a clear toast message only if the Supabase mutation fails.
3. **Local Timezone Date Boundaries:** Always pass the client's local `YYYY-MM-DD` string when creating or querying daily tasks, daily expenses, and streaks. Never rely on UTC server timestamps (`NOW()`) to determine a user's calendar day.
4. **Apple HIG Touch Targets:** Every interactive button, checkbox, delete icon, and color filter pill MUST have a minimum hit target of `44x44px` on mobile viewports.
5. **Tabular Numbers for All Metrics:** All currency amounts, budget remaining balances, percentages, and streak counters MUST apply `font-variant-numeric: tabular-nums` (`tabular-nums` in Tailwind) so digits align vertically and never jitter when updated.
6. **Liquid Glass Isolation:** Apply translucent blur (`backdrop-filter`) ONLY on the floating navigation chrome (Bottom Tab Bar on iPhone, Sidebar/Header on Laptop) and modal overlays. Content cards and list rows MUST remain solid opaque surfaces.
7. **Strict TypeScript:** `strict: true` must remain enabled. No `any` types (`@typescript-eslint/no-explicit-any` is an error).

---

## 2. Prohibited Practices (What To Avoid)
1. **NO "Vibecoded" Aesthetics:**
   - **PROHIBITED:** Linear, radial, or mesh gradients on backgrounds, buttons, cards, or text (`bg-gradient-to-*`, `from-purple-500 to-indigo-600`, neon glowing box shadows, animated aurora backgrounds).
   - **REQUIRED:** Flat, solid, high-contrast semantic surfaces and plain Apple system accent colors.
2. **NO Stacked Glass (Glass-on-Glass):**
   - **PROHIBITED:** Placing a blurred `backdrop-filter` card inside or directly on top of another blurred container (violates Apple Liquid Glass HIG and causes GPU frame drops on iPhone).
3. **NO Color-Only Meaning:**
   - **PROHIBITED:** Displaying a colored dot without its corresponding text label or `aria-label` (e.g., always pair `#FF3B30` with `"Health"` or accessible text).
4. **NO Unbounded Queries:**
   - **PROHIBITED:** Fetching the entire historical `tasks` or `expenses` table on load. Always scope queries to the active date/month range.
5. **NO Browser `alert()` or `confirm()`:**
   - **PROHIBITED:** Using native blocking JS dialogs. Use immediate delete with an "Undo" toast or inline confirmation.
6. **NO App-Level Theme Toggle Clutter (Optional):**
   - Respect system appearance (`prefers-color-scheme: light / dark`) automatically using CSS variables without hardcoding hex values inside JSX components.

---

## 3. Approved vs. Prohibited Libraries

| Category | Approved Libraries | Prohibited Libraries | Reason |
| :--- | :--- | :--- | :--- |
| **Framework** | `next` (App Router), `react`, `react-dom` | Create React App, Vite SPA without SSR/PWA, Remix | Unified PWA + routing simplicity |
| **Styling** | `tailwindcss`, `clsx`, `tailwind-merge` | `styled-components`, `@emotion/*`, Material UI (`@mui/*`), Chakra UI | Runtime CSS-in-JS hurts mobile performance; Material UI violates Apple HIG |
| **Backend & Sync** | `@supabase/supabase-js`, `@supabase/ssr` | Firebase, custom Express/Socket.io server, Prisma (client-side) | Supabase provides built-in Postgres + Realtime WebSockets with minimal boilerplate |
| **State / Fetching** | `@tanstack/react-query`, `zustand` | Redux Toolkit, MobX, Apollo Client | Lightweight optimistic updates & cache invalidation |
| **Icons** | `lucide-react` (or native SF Symbols on iOS) | FontAwesome, Heroicons mixed with Material Icons | Must maintain one consistent icon weight across the entire app |
| **Dates** | `date-fns` (or native `Intl.DateTimeFormat`) | `moment.js` | `moment.js` is deprecated and heavy |
| **Animation** | CSS transitions / `framer-motion` (strictly for layout/sheet springs) | `gsap`, `three.js`, Lottie confetti | Keep motion brief, interruptible, and functional |
| **Charts** | Native HTML/CSS solid progress bars | `chart.js`, `recharts`, `d3` | 3 simple horizontal budget bars are cleaner and faster than heavy charting libraries |
