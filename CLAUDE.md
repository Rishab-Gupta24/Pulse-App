# Project Rules

## Output
- Be concise. Lead with the answer or the change; skip preambles and recaps.
- Don't paste whole files back. Reference `file_path:line` instead.
- Show only the relevant part of command output or logs.

## Code Changes
- Make surgical diffs: change only what the task requires. No drive-by refactors, renames, or reformatting.
- Match the surrounding code's style, naming, and comment density.
- Read a file before editing it. Re-read only if the edit failed or the file may have changed.
- Don't add dependencies without a clear need. Say why when you add one.
- Don't create docs or README files unless asked.

## Tools
- Prefer Glob/Grep/Read over shell commands for search and file reads.
- Batch independent tool calls in one turn.
- Use Context7 for library/API docs instead of guessing from memory.
- Use Playwright only for browser checks that matter; close browsers when done.

## Security
- Never commit or print secrets: API keys, tokens, passwords, `.env` contents.
- Keep secrets in environment variables or an ignored `.env` file, never in source or `.mcp.json`.
- Validate and sanitize all external input (user input, files, API responses).
- Use parameterized queries; never build SQL or shell commands from raw strings.
- Don't disable TLS verification, auth checks, or CSRF/XSS protections, even temporarily.
- Don't run downloaded or untrusted scripts without review.
- Ask before destructive actions: deleting data, force-pushing, overwriting uncommitted work.
