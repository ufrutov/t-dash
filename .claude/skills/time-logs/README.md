# time-logs skill

Claude Code skill that turns a coding session into t-dash time log entries and, on request, inserts them into the `records` table through the Supabase REST API.

```
/time-logs                 # 1 entry, preview, then asks before adding
/time-logs 2 post          # 2 entries, added to the DB after showing them
/time-logs 1 2h --short    # 1 entry, 2 hours, stores the Shorter description
```

Defaults: 1 entry, 1 hour per entry, today's date. The project is resolved from the entry's link or the git folder name (like the UI's auto-select); otherwise it asks.

## Setup

1. Make the skill available to Claude Code:
   - **Only inside this repo:** nothing to do; `.claude/skills/` is picked up automatically.
   - **In every project:** copy or symlink this folder to `~/.claude/skills/time-logs`.
2. `cp .env.example .env && chmod 600 .env`, then fill it in (`.env` is git-ignored).
3. Verify: `.claude/skills/time-logs/scripts/tlogs.sh check`

The anon key alone sees nothing (row-level security), so the login is required. A signed-in token is cached in `~/.cache/t-dash/access-token.json` (mode 600).

Requires `bash`, `curl` and `jq`.

## Helper commands (`scripts/tlogs.sh`)

`check`, `projects`, `records [FROM] [TO]`, `lookup [URL...]`, `post [--dry-run] FILE|-`, `delete ID`, `session [SESSION_ID]`. Run it without arguments for usage.
