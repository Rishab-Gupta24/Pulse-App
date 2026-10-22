"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isTomorrow,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import TaskActionSheet, { type TaskActionTarget } from "@/components/calendar/TaskActionSheet";
import BlueFlame from "@/components/shared/BlueFlame";
import AddTaskForm from "@/components/tasks/AddTaskForm";
import TaskItem from "@/components/tasks/TaskItem";
import { useDailyLogs } from "@/hooks/useStreaks";
import { useTaskCounts } from "@/hooks/useTaskCounts";
import { useTasks } from "@/hooks/useTasks";
import { useTaskTemplates } from "@/hooks/useTaskTemplates";
import {
  formatDayHeading,
  fromLocalDateString,
  toLocalDateString,
  WEEKDAYS,
  type Weekday,
} from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import type { Task, TaskTemplate } from "@/types/database";

const WEEK = { weekStartsOn: 1 } as const;
const sectionHeaderClass =
  "text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary";

const noopSubscribe = () => () => {};

/** Month calendar: won days, unfinished days, upcoming (incl. repeating) tasks. */
export default function CalendarView() {
  // Device-clock dates: render only in the browser (see StreakLine).
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return <div aria-hidden className="h-96 rounded-2xl bg-surface" />;
  return <CalendarContent />;
}

/** "Today" / "Yesterday" / "Tomorrow", else "Upcoming" or "Past day". */
function relativeLabel(date: string, todayKey: string): string {
  const heading = formatDayHeading(date);
  if (heading === "Today" || heading === "Yesterday") return heading;
  if (isTomorrow(fromLocalDateString(date))) return "Tomorrow";
  return date > todayKey ? "Upcoming" : "Past day";
}

function templatesOn(templates: TaskTemplate[], date: Date) {
  const day = date.getDay() as Weekday;
  return templates.filter((t) => t.weekdays.includes(day));
}

function CalendarContent() {
  const todayKey = toLocalDateString();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(todayKey);

  const gridStart = startOfWeek(startOfMonth(month), WEEK);
  const gridEnd = endOfWeek(endOfMonth(month), WEEK);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const startKey = toLocalDateString(gridStart);
  const endKey = toLocalDateString(gridEnd);

  const logs = useDailyLogs(startKey, endKey);
  const { counts, claimed } = useTaskCounts(startKey, endKey);
  const { templates } = useTaskTemplates();
  const [editing, setEditing] = useState(false);

  /** Future days: actual tasks + repeats that will be created on that day. */
  function upcomingCount(date: Date, key: string) {
    const projected = templatesOn(templates, date).filter(
      (t) => !claimed.has(`${t.id}:${key}`),
    ).length;
    return (counts.get(key)?.total ?? 0) + projected;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-2">
        {/* Laptop: edit mode toggle just above the calendar's top-right corner.
            iPhone uses long-press on a task instead. */}
        <div className="hidden justify-end md:flex">
          <button
            type="button"
            aria-pressed={editing}
            onClick={() => setEditing((e) => !e)}
            className={cn(
              "group flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-colors duration-200",
              editing
                ? "bg-accent-fill text-white"
                : "bg-surface text-secondary hover:bg-subtle hover:text-accent focus-visible:text-accent",
            )}
          >
            <Pencil
              size={16}
              strokeWidth={1.75}
              aria-hidden
              className={cn(
                "transition-transform duration-200",
                !editing &&
                  "motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:-rotate-12 motion-safe:group-hover:scale-125",
              )}
            />
            {editing ? "Done Editing" : "Edit Tasks"}
          </button>
        </div>

        <section aria-label="Calendar" className="flex flex-col gap-3 rounded-2xl bg-surface p-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              className="flex size-11 items-center justify-center rounded-full text-accent"
            >
              <ChevronLeft size={22} strokeWidth={1.75} aria-hidden />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-semibold">{format(month, "MMMM yyyy")}</h2>
              {!isSameMonth(month, new Date()) && (
                <button
                  type="button"
                  onClick={() => {
                    setMonth(startOfMonth(new Date()));
                    setSelected(todayKey);
                  }}
                  className="min-h-11 rounded-full px-3 text-[13px] font-semibold text-accent"
                >
                  Today
                </button>
              )}
            </div>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="flex size-11 items-center justify-center rounded-full text-accent"
            >
              <ChevronRight size={22} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
  
          <div className="grid grid-cols-7 text-center" aria-hidden>
            {WEEKDAYS.map((d) => (
              <span key={d.value} className="text-xs font-medium text-secondary">
                {d.short}
              </span>
            ))}
          </div>
  
          <div role="grid" aria-label={format(month, "MMMM yyyy")} className="grid grid-cols-7 gap-y-1">
            {days.map((date) => {
              const key = toLocalDateString(date);
              const inMonth = isSameMonth(date, month);
              const isToday = key === todayKey;
              const isSelected = key === selected;
              const past = key <= todayKey;
              const log = logs.get(key);
              const count = counts.get(key);
              const upcoming = past ? 0 : upcomingCount(date, key);
  
              let status = "";
              if (past && log?.task_day_won) status = "all tasks done";
              else if (past && count && count.total > 0) status = `${count.done} of ${count.total} done`;
              else if (upcoming > 0) status = `${upcoming} planned`;
  
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  aria-selected={isSelected}
                  aria-label={`${format(date, "EEEE, MMMM d")}${status ? `, ${status}` : ""}`}
                  onClick={() => setSelected(key)}
                  className={cn(
                    "mx-auto flex min-h-12 w-11 flex-col items-center justify-start gap-0.5 rounded-xl pt-1.5",
                    isSelected ? "bg-accent-fill text-white" : isToday && "ring-2 ring-inset ring-accent",
                    !inMonth && !isSelected && "opacity-40",
                  )}
                >
                  <span className="text-[15px] font-medium tabular-nums">{format(date, "d")}</span>
                  <span className="flex h-3.5 items-center">
                    {past && log?.task_day_won ? (
                      <BlueFlame
                        size={14}
                        className={isSelected ? "text-white" : "text-accent"}
                        coreClass="fill-[var(--flame-core)]"
                      />
                    ) : past && count && count.total > 0 ? (
                      <span
                        className={cn(
                          "size-1.5 rounded-full border",
                          isSelected ? "border-white" : "border-secondary",
                        )}
                      />
                    ) : upcoming > 0 ? (
                      <span className="text-[10px] font-semibold tabular-nums">{upcoming}</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
  
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-2 text-xs text-secondary">
            <span className="inline-flex items-center gap-1">
              <BlueFlame size={12} className="text-accent" /> All done
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full border border-secondary" /> Unfinished
            </span>
            <span>Number = tasks planned</span>
          </p>
        </section>
      </div>

      <DayPanel
        key={selected}
        date={selected}
        todayKey={todayKey}
        templates={templates}
        claimed={claimed}
        editing={editing}
      />
    </div>
  );
}


function DayPanel({
  date,
  todayKey,
  templates,
  claimed,
  editing,
}: {
  date: string;
  todayKey: string;
  templates: TaskTemplate[];
  /** `${templateId}:${date}` pairs that already have a copy or were removed. */
  claimed: Set<string>;
  /** Laptop edit mode: show a pencil on each editable task. */
  editing: boolean;
}) {
  const { tasks, isLoading, addTask, editDay, editAllDays, deleteDay, deleteAllRepeats } =
    useTasks(date);
  const [target, setTarget] = useState<TaskActionTarget | null>(null);
  const closeSheet = useCallback(() => setTarget(null), []);
  const isPast = date < todayKey;
  const isToday = date === todayKey;
  const isFuture = date > todayKey;
  const dayDate = fromLocalDateString(date);

  // Repeats that will appear on this future day (no copy yet and not removed).
  const projected: { task: Task; template: TaskTemplate }[] = isFuture
    ? templatesOn(templates, dayDate)
        .filter(
          (t) => !claimed.has(`${t.id}:${date}`) && !tasks.some((task) => task.template_id === t.id),
        )
        .map((template) => ({
          template,
          task: {
            id: `projected-${template.id}`,
            user_id: "",
            title: template.title,
            note: template.note,
            category: template.category,
            is_completed: false,
            task_date: date,
            template_id: template.id,
            created_at: null,
          },
        }))
    : [];

  const templateById = new Map(templates.map((t) => [t.id, t]));
  const empty = !isLoading && tasks.length === 0 && projected.length === 0;
  // Past days are read-only; today and future days can be edited.
  const open = isPast ? undefined : (t: TaskActionTarget) => setTarget(t);

  return (
    <section aria-label={`Tasks for ${format(dayDate, "EEEE, MMMM d")}`} className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className={sectionHeaderClass}>{relativeLabel(date, todayKey)}</h2>
          <p className="text-[17px] font-semibold">{format(dayDate, "EEEE, MMMM d")}</p>
        </div>
        {isToday && (
          <Link href="/" className="flex min-h-11 items-center rounded-full px-3 text-[15px] font-semibold text-accent">
            Open Today
          </Link>
        )}
      </div>

      {isLoading ? (
        <p className="rounded-xl bg-surface px-4 py-6 text-[15px] text-secondary">Loading…</p>
      ) : empty ? (
        <p className="rounded-xl bg-surface px-4 py-6 text-[15px] text-secondary">
          {isPast ? "No tasks on this day." : "Nothing planned yet."}
        </p>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-xl">
          {tasks.map((task) => {
            const template = task.template_id ? templateById.get(task.template_id) : undefined;
            return (
              <TaskItem
                key={task.id}
                task={task}
                template={template}
                editing={editing && Boolean(open)}
                onOpenActions={open && (() => open({ task, template, stored: true }))}
              />
            );
          })}
          {projected.map(({ task, template }) => (
            <TaskItem
              key={task.id}
              task={task}
              template={template}
              editing={editing && Boolean(open)}
              onOpenActions={open && (() => open({ task, template, stored: false }))}
            />
          ))}
        </ul>
      )}

      {!isPast && !empty && (
        <p className="text-[13px] text-secondary">
          <span className="md:hidden">Long-press a task to edit or delete it.</span>
          <span className="hidden md:inline">
            Use Edit Tasks above the calendar, or right-click a task, to edit or delete it.
          </span>
        </p>
      )}

      {isFuture && (
        <>
          <h3 className={sectionHeaderClass}>Add to {format(dayDate, "EEE, MMM d")}</h3>
          <AddTaskForm onAdd={addTask} submitLabel="Add Task" />
        </>
      )}
      {isPast && <p className="text-[13px] text-secondary">Past days are read-only.</p>}

      {target && (
        <TaskActionSheet
          target={target}
          dayLabel={format(dayDate, "EEEE, MMMM d")}
          onClose={closeSheet}
          onEditDay={(fields) => editDay(target.task, target.stored, fields)}
          onEditAll={(fields) =>
            target.template ? editAllDays(target.template.id, fields) : false
          }
          onDeleteDay={() => deleteDay(target.task, target.stored)}
          onDeleteAll={() => target.template && deleteAllRepeats(target.template.id)}
        />
      )}
    </section>
  );
}
