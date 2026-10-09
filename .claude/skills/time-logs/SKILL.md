---
name: time-logs
description: Generate time log entries for the t-dash daily report from the current Claude Code session (plus git history) and optionally add them to the t-dash database via its Supabase API, or list existing entries for a period (e.g. "list this week")
argument-hint: "[N entries, default 1] [post] [--short] [--date YYYY-MM-DD] [Nh] [project] [focus notes] | list [period] [project]"
disable-model-invocation: true
allowed-tools:
  - Bash(git log *)
  - Bash(git show *)
  - Bash(git diff *)
  - Bash(git status *)
  - Bash(git branch *)
  - Bash(git remote *)
  - Bash(gh pr view *)
  - Bash(${CLAUDE_SKILL_DIR}/scripts/tlogs.sh *)
---

# Time Log Generator (t-dash)

Turn this session's work into t-dash time log entries and, when asked, insert them into the `records` table — or list the entries already logged for a period. Invocation: `/time-logs $ARGUMENTS`. Today: !`date +%F`

## 0. Mode

Two modes share this skill:

- **List mode** — `$ARGUMENTS` contains `list`, "show", "what did I log", "how many hours" or similar: the user wants **existing** records, not new ones. Go straight to section 1a and stop; do not generate or post anything.
- **Generate mode** (default) — everything else: produce new entries from this session, as in sections 1–6 below.

## 1a. List mode

Resolve a date range from the wording (today is given above): "today" / no period → today..today; "yesterday" → that day; "this week" → Monday..today; "last week" → previous Mon..Sun; "this month" / "September" / no year → that calendar month; an explicit range or `YYYY-MM-DD..YYYY-MM-DD` → as given. If a project name is mentioned, resolve its id with `${CLAUDE_SKILL_DIR}/scripts/tlogs.sh projects` (match by title) and pass it through.

```bash
${CLAUDE_SKILL_DIR}/scripts/tlogs.sh list FROM TO [project_id]
```

This is read-only and needs no confirmation. Relay its output as-is (it is already grouped by date with per-project and overall totals) — do not recompute or re-sort it, and do not reformat it into a markdown table. If it reports no records, say so plainly. Never call `records` directly in this skill; `list` is the intended entry point for reading.

## 1. Arguments (generate mode)

| Setting | Detect | Default |
|---|---|---|
| **N** entries | bare integer ("2", "3 logs", "two entries"); `2h` / "2 hours" is hours, not a count | **1** |
| Post to DB | `post`, `--post`, "add", "save", "to db" | preview, then ask |
| Draft only | `--draft`, `--no-post` | never post |
| Stored description | `--short` = Shorter variant | Longer |
| Date | `--date YYYY-MM-DD`, "yesterday" | today |
| Hours | "1h", "2 hours", "1h each" | **1 per entry** |
| Project | a project name | auto (section 3) |
| Focus | leftover text | whole session |

**N is a hard requirement:** exactly N entries, never padded to a "nice" number. Fewer than N distinct activities → split only along real phases (implementation / review / QA / docs), else return fewer and say why in one line. More than N → keep the N most significant (merge related work when N = 1) and note in one line what was left out.

## 2. Gather context

Use the conversation already in your context as the primary source. Log only work that actually happened (changes made, PRs reviewed, tests run, issues investigated), not plans or discussion, and never the time-logs run itself.

- **Only if the conversation was compacted** (you see a summary instead of early turns) or you are unsure what happened earlier, run `${CLAUDE_SKILL_DIR}/scripts/tlogs.sh session ${CLAUDE_SESSION_ID}`: a compact timestamped digest of user messages, edits and commands, plus the session span. Skip it otherwise; it repeats what you already have.
- **Git, only if it adds facts you lack:** `git log --oneline -10`, `git diff --stat`, `git remote -v`; `gh pr view --json url,title,number` for a PR link.
- **Project:** run `${CLAUDE_SKILL_DIR}/scripts/tlogs.sh lookup [<link-or-git-remote> ...]` only when you will post. It also checks the current git folder name, like the UI's project auto-select. Rules: project link host+owner(+repo) → earlier record with the same host/owner → project title inside the link → project title inside the folder name. It prints one `MATCH` line per input (link results outrank the `[folder]` one) and the project list only if nothing resolved.

## 3. Entry fields

| Field | Rule |
|---|---|
| `title` | `/pull/N` → `PR #N`; `/issues/N` → `Issue #N`; Linear `/issue/KEY-N/…` → `KEY-N`; otherwise a 1-3 word label ("QA", "Landing Page"). |
| `description` | English, one verb-led sentence: what changed, where, how verified. **Longer** ≤ 200 chars, **Shorter** ≤ 100. No secrets. |
| `category` | one of `dev`, `review` (reviewing a PR), `qa`, `design`, `documentation`, `general`. |
| `time_spent` | user-given hours, else **1**. Never estimate up. |
| `date` | resolved date (`YYYY-MM-DD`); future dates are allowed. |
| `link` | PR/issue/ticket URL from the session or `gh`; `""` if none, never invented. |
| `project_id` | user-named project, else `lookup` (links first, then folder name). Unresolved or ambiguous → ask, listing the projects. |
| `tags` | `[]` |

## 4. Output

```
## Time Log Entries (Longer)
1. [190 chars] ...
## Time Log Entries (Shorter)
1. [88 chars] ...
## Ready to add
| # | Date | Project | Hrs | Category | Title | Link |
```

Add one line only if something needs the user's attention (project match rule, left-out work). After posting, the final reply must repeat the created rows (`Created #383 REA-683 · 1h · Purenutrition`) as its own text, not rely on earlier output.

## 5. Adding to the database

- **Post intent given:** that is the authorization. Show the table and post; ask only if the project is unresolved.
- **Otherwise:** after the preview, ask once with AskUserQuestion (add as shown / change something / don't add; include a project question if unresolved). **The dialog must be self-contained:** the terminal may collapse the text printed above it, so the user must be able to approve without seeing that text. Put the exact entries in the confirmation question itself (one line per entry: `date · project · hrs · category · title` plus the full stored description and link), and give the "add as shown" option a `preview` with the same rows. Never write a question that says only "add this entry?".

Post all entries in one request (atomic) via stdin:

```bash
${CLAUDE_SKILL_DIR}/scripts/tlogs.sh post - <<'JSON'
[{"title":"REA-683","description":"...","project_id":3,"category":"dev","date":"2026-09-19","time_spent":1,"link":"https://..."}]
JSON
```

The script validates fields and prints one JSON row per created record; `post --dry-run -` validates only. Reply with the ids: `Created #383 REA-683 · 1h · Purenutrition`. Update or delete records only when the user asks; to undo a post, `${CLAUDE_SKILL_DIR}/scripts/tlogs.sh delete <id>` for exactly the ids it returned.

## 6. Setup and failures

Credentials are in `${CLAUDE_SKILL_DIR}/.env` (`T_DASH_SUPABASE_URL`, `T_DASH_SUPABASE_ANON_KEY`, `T_DASH_EMAIL`, `T_DASH_PASSWORD`; same-named env vars override). Row-level security means the anon key alone sees nothing; the login is required.

- Never print, `cat` or echo the config, keys, tokens or password, and never put them on a command line.
- On "missing config" / "not signed in" (`tlogs.sh check` verifies), tell the user what to add and still show the entries.
- On an HTTP error from `post`, show it once and do not retry blindly; nothing was inserted.
