import { CATEGORY_LIST } from "@/lib/constants/categories";

// Placeholder until the dashboard shell lands in Phase 3.
export default function Home() {
  return (
    <main className="mx-auto max-w-[880px] px-4 py-8">
      <h1 className="text-[28px] font-bold tracking-[-0.02em]">Pulse</h1>
      <ul className="mt-6 divide-y divide-hairline rounded-xl bg-surface">
        {CATEGORY_LIST.map((category) => (
          <li key={category.key} className="flex items-center gap-3 px-4 py-3">
            <span
              className={`size-3 rounded-full ${category.dotClass}`}
              aria-hidden
            />
            <span>{category.label}</span>
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${category.softBgClass} ${category.textClass}`}
            >
              {category.key}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
