# Product Requirements Document (PRD): Pulse — Daily Task & Expense Tracker

## 1. Product Overview
**Pulse** is a minimalist, cross-platform personal productivity and finance application that combines a **Daily Task Tracker** and a **Daily Expense Tracker** under a single unified color-categorization system and dual-streak engine. It runs seamlessly on **iPhone** (as an installable Progressive Web App with native iOS feel) and **Laptop** (desktop web), synchronizing data in real time across devices.

---

## 2. Problems Solved
1. **App Fragmentation:** Users typically switch between complex todo apps (Notion, Todoist) and bloated finance trackers (Splitwise, Mint) just to answer two simple daily questions: *"Did I finish what I planned today?"* and *"Did I stay within my budget today?"*
2. **Cognitive Overload & "Vibecoded" Clutter:** Most modern productivity apps suffer from visual bloat—neon gradients, complex nested menus, and unnecessary charts that create friction for quick 5-second logging on a phone.
3. **Disconnected Life Categories:** How you spend your time (tasks) and how you spend your money (expenses) belong to the same life pillars (Health/Fitness, Study/Work, Eating/Food), yet rarely share the same visual taxonomy.
4. **Lack of Immediate Daily Accountability:** Monthly budgets fail because users only realize they overspent at the end of the month. Tying a daily budget to a daily streak creates immediate micro-accountability alongside daily task completion.

---

## 3. Core Features

### 3.1 Unified Color Categorization System
A single set of solid, semantic color categories shared across **both** Tasks and Expenses. One color can be reused infinitely across both modules:
- **RED (`#FF3B30`):** Health / Fitness (e.g., Task: *"Gym session"*, Expense: *"Protein powder"*)
- **BLUE (`#007AFF`):** Study / Work (e.g., Task: *"Complete CS assignment"*, Expense: *"Reference book / Stationery"*)
- **GREEN (`#34C759`):** Eating / Food (e.g., Task: *"Meal prep"*, Expense: *"Lunch / Groceries"*)
- **AMBER (`#FF9500`):** Personal / Essentials (extensible default for misc items like transport or utilities)

### 3.2 Daily Task Tracker
- **Create Task:** Input task title + select 1 category color pill. Defaults to today's date.
- **Complete Task:** Single tap checkbox toggles completion state immediately.
- **Delete Task:** Swipe-to-delete on iPhone or click delete icon on Laptop.
- **Filter by Color:** Tap any color pill at the top of the view to filter tasks by category, or view "All".

### 3.3 Multi-Horizon Expense & Budget Tracker
- **Budget Configuration:** User defines three explicit budget caps:
  1. **Monthly Budget** (e.g., $500 / month)
  2. **Weekly Budget** (e.g., $120 / week)
  3. **Daily Budget** (e.g., $15 / day)
- **Log Expense:** Enter amount, short label, and select a category color (Red, Blue, Green, Amber).
- **Delete Expense:** Remove mistyped or cancelled expenses with immediate budget recalculation.
- **Live Remaining Balances:** Clean horizontal progress bars showing spent vs. remaining allowance for **Today**, **This Week**, and **This Month**.

### 3.4 Dual Streak Engine
- **Task Streak (🔥 Tasks):**
  - Increments by `+1` for every consecutive calendar day where **100% of tasks created for that day are marked complete** (requires at least 1 task scheduled for that day).
  - Resets to `0` at midnight (local timezone) if any task remains incomplete.
- **Budget Streak (🛡️ Budget):**
  - Increments by `+1` for every consecutive calendar day where `Total Daily Expenses <= Daily Budget`.
  - Resets to `0` immediately if daily spending exceeds the set Daily Budget.

### 3.5 Cross-Platform Sync (iPhone + Laptop)
- **Instant Cloud Sync:** Adding a task on the laptop reflects on the iPhone within milliseconds via WebSockets/Realtime database replication.
- **Offline-First Optimistic UI:** Toggling a task or logging coffee on iPhone with poor signal updates the UI in `0ms` and syncs in the background once connectivity returns.

---

## 4. Core User Flows
1. **Morning Setup (Laptop or iPhone):** User opens the app, checks their current **Task Streak** and **Budget Streak** in the top header, and adds 3–5 categorized tasks for the day.
2. **On-the-Go Logging (iPhone):** User buys lunch, opens the app from the iPhone Home Screen, taps the `+` action, enters the amount, selects **GREEN (Eating/Food)**, and sees their remaining **Day / Week / Month** budget update immediately.
3. **End-of-Day Review:** User checks off their final task. Once all tasks are complete and daily spending is `<= Day Budget`, both streaks lock in for the day.

---

## 5. Non-Goals (Out of Scope for v1)
- No bank account / SMS auto-scraping integrations (manual entry keeps awareness high and architecture simple).
- No complex recurring subtasks, Gantt charts, or multi-user shared workspaces.
- No multi-currency conversion engine (single user-selected currency symbol).
