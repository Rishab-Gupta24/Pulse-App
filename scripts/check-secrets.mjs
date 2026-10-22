// Blocks secrets from being committed, so the repo is safe to keep public.
//   node scripts/check-secrets.mjs        -> scans staged files (pre-commit hook)
//   node scripts/check-secrets.mjs --all  -> scans every tracked file
// No dependencies; git is invoked with argument arrays (never a shell string).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const scanAll = process.argv.includes("--all");

/** Env files hold real values; only the blank template may be committed. */
const FORBIDDEN_FILE = /(^|\/)\.env(\..+)?$/;
const ALLOWED_FILES = new Set([".env.example"]);

/** Files that legitimately contain long hashes or this script's own patterns. */
const SKIP_CONTENT = [/^package-lock\.json$/, /^scripts\/check-secrets\.mjs$/, /^\.design-rules\//];

const PATTERNS = [
  ["Supabase secret key", /sb_secret_[A-Za-z0-9_-]{10,}/],
  ["Supabase publishable key (keep it in .env, not in code)", /sb_publishable_[A-Za-z0-9_-]{10,}/],
  ["JWT (legacy Supabase anon/service_role key?)", /eyJhbGciOi[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ["Private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["GitHub token", /\b(ghp|gho|ghu|ghs)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Stripe live key", /\b(sk|rk)_live_[A-Za-z0-9]{10,}/],
  ["Vercel token", /\bvercel_[A-Za-z0-9]{20,}/i],
  [
    "Hard-coded credential",
    /\b(api[_-]?key|secret|password|passwd|access[_-]?token|service[_-]?role)\b\s*[:=]\s*["'][^"'\s]{12,}["']/i,
  ],
];

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

const files = (scanAll
  ? git(["ls-files"])
  : git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"])
)
  .split("\n")
  .map((f) => f.trim())
  .filter(Boolean);

const problems = [];

for (const file of files) {
  if (FORBIDDEN_FILE.test(file) && !ALLOWED_FILES.has(file)) {
    problems.push(`${file}: env files must not be committed (use .env.local, which is git-ignored)`);
    continue;
  }
  if (SKIP_CONTENT.some((re) => re.test(file))) continue;

  let text;
  try {
    // Staged content for the hook, so a fix that isn't staged yet doesn't pass.
    text = scanAll ? readFileSync(file, "utf8") : git(["show", `:${file}`]);
  } catch {
    continue; // deleted or unreadable
  }
  if (text.includes("\u0000")) continue; // binary

  text.split("\n").forEach((line, index) => {
    for (const [label, pattern] of PATTERNS) {
      if (pattern.test(line)) problems.push(`${file}:${index + 1}: ${label}`);
    }
  });
}

if (problems.length > 0) {
  console.error("\nSecret check failed — remove these before committing:\n");
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error(
    "\nPut values in .env.local (git-ignored) and in Vercel's Environment Variables.\n" +
      "If a real secret was already pushed, rotate it in its dashboard: removing it from git does not revoke it.\n",
  );
  process.exit(1);
}

console.log(`Secret check passed (${files.length} file${files.length === 1 ? "" : "s"} scanned).`);
