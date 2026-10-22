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
- **View Mode vs. Edit Mode:** The Today list opens in **view mode**, where tasks can only be ticked done/undone. Tapping **Edit** enters **edit mode**, where tasks can be added, deleted and set to repeat, but completion is locked. **Done Editing** returns to view mode.
- **Create Task (edit mode):** Title + optional **note** (the task's "bio", e.g. *"1 hr workout"*, ≤ 200 chars) + 1 category color pill. Defaults to today's date.
- **Complete Task (view mode):** Single tap checkbox toggles completion state immediately.
- **Delete Task (edit mode):** Delete button on each row, with an Undo toast. For a repeating task this removes only that day's copy.
- **Filter by Color:** Tap any color pill at the top of the view to filter tasks by category, or view "All".
- **No Automatic Carry-Over:** Unfinished tasks do **not** roll over to the next day. Each day starts with only the tasks planned for it.
- **Repeating Tasks:** Any task can repeat on chosen weekdays (Monday–Sunday, with Every Day / Weekdays / Weekends presets). Set it when creating the task, from a row's Repeat button in edit mode, or with **Repeat Today's Tasks…** to copy all of today's one-off tasks to the selected days. Each repeating task is created automatically on its days. **Stop Repeating** ends future copies and keeps past ones.
- **All-Done Celebration:** Ticking off the last task of the day (in view mode) plays a short, dismissible animation (blue rings + live flame) showing the new Task Streak.

### 3.3 Multi-Horizon Expense & Budget Tracker
- **Budget Configuration:** User defines three explicit budget caps:
  1. **Monthly Budget** (e.g., $500 / month)
  2. **Weekly Budget** (e.g., $120 / week)
  3. **Daily Budget** (e.g., $15 / day)
- **Log Expense:** Enter amount, short label, and select a category color (Red, Blue, Green, Amber).
- **Budget Scope ("Counts toward"):** Each expense counts toward **Today** (default: day, week and month), **This Week** (week and month only) or **This Month** (month only). Example: detergent that lasts a month is logged once as a monthly expense instead of every day. Only "Today" expenses affect the daily budget and the Budget Streak.
- **Delete Expense:** Remove mistyped or cancelled expenses with immediate budget recalculation.
- **Live Remaining Balances:** Clean horizontal progress bars showing spent vs. remaining allowance for **Today**, **This Week**, and **This Month**.

### 3.4 Dual Streak Engine
- **Task Streak (🔥 Tasks):**
  - Increments by `+1` for every consecutive calendar day where **100% of tasks created for that day are marked complete** (requires at least 1 task scheduled for that day).
  - Resets to `0` at midnight (local timezone) if any task remains incomplete.
- **Budget Streak (🛡️ Budget):**
  - Increments by `+1` for every consecutive calendar day where `Total Daily Expenses <= Daily Budget` (only expenses that count toward "Today").
  - Resets to `0` immediately if daily spending exceeds the set Daily Budget.
- **Streak Line (Today screen):** A card showing **Current streak**, **Longest streak** and **total won days**, plus a 7-day line (4 days back, today marked, 2 ahead). Won days are filled blue circles with a **live, flickering blue flame** (Tasks) or a shield (Budget); today shows a dashed ring until won; missed days are empty rings; future days are grey. A Tasks / Budget toggle switches the metric.

### 3.6 Calendar
- **Month View:** Monday-first month grid. Past days show a blue flame when every task was done, or a ring when unfinished. Future days show how many tasks are planned, including repeating tasks.
- **Day Detail:** Tap a day to see its tasks. Past days are read-only. Today links back to the Today tab. Future days list their planned and repeating tasks, and one-off tasks (e.g. an appointment) can be added or deleted there.

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
- No subtasks, complex recurrence rules (only "repeat on these weekdays"), Gantt charts, or multi-user shared workspaces.
- No multi-currency conversion engine (single user-selected currency symbol).
