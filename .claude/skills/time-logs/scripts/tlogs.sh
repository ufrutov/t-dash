#!/usr/bin/env bash
# Helper for the time-logs skill: talks to the t-dash Supabase REST API and
# digests Claude Code session transcripts. Never prints credentials.
#
# Usage:
#   tlogs.sh check                       verify config + connectivity
#   tlogs.sh projects                    list projects (id, title, link)
#   tlogs.sh records [FROM] [TO]         list records as TSV (default: last 7 days)
#   tlogs.sh list FROM TO [project_id]   human-readable listing for a period, grouped by date, with totals
#   tlogs.sh lookup [URL...]             resolve the project from URLs / git remote + current folder name
#   tlogs.sh post [--dry-run] FILE|-     insert one record (object) or many (array); --dry-run validates only
#   tlogs.sh delete ID                   delete exactly one record by id (only on user request)
#   tlogs.sh session [SESSION_ID]        compact digest of a session transcript
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/.." && pwd)"
CONFIG_FILE="${T_DASH_CONFIG:-$SKILL_DIR/.env}"
CATEGORIES='["general","dev","design","qa","review","documentation"]'

die() { echo "tlogs: $*" >&2; exit 1; }

load_config() {
  if [[ -z "${T_DASH_SUPABASE_URL:-}" || -z "${T_DASH_SUPABASE_ANON_KEY:-}" ]]; then
    [[ -f "$CONFIG_FILE" ]] && { set -a; . "$CONFIG_FILE"; set +a; }
  fi
  [[ -n "${T_DASH_SUPABASE_URL:-}" && -n "${T_DASH_SUPABASE_ANON_KEY:-}" ]] ||
    die "missing config. Create $CONFIG_FILE with:
  T_DASH_SUPABASE_URL=https://<project>.supabase.co
  T_DASH_SUPABASE_ANON_KEY=<anon key>   (same values as VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in t-dash/.env)
  T_DASH_EMAIL=<t-dash login email>
  T_DASH_PASSWORD=<t-dash login password>"
  T_DASH_SUPABASE_URL="${T_DASH_SUPABASE_URL%/}"
}

TOKEN_CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/t-dash/access-token.json"

# Row-level security needs the signed-in user's JWT (the anon key alone sees nothing).
# Order: T_DASH_ACCESS_TOKEN -> cached token -> password login with T_DASH_EMAIL/T_DASH_PASSWORD.
access_token() {
  if [[ -n "${T_DASH_ACCESS_TOKEN:-}" ]]; then printf '%s' "$T_DASH_ACCESS_TOKEN"; return; fi
  if [[ -f "$TOKEN_CACHE" ]] && jq -e --argjson now "$(date +%s)" '.expires_at > $now + 60' "$TOKEN_CACHE" >/dev/null 2>&1; then
    jq -r .access_token "$TOKEN_CACHE"; return
  fi
  if [[ -n "${T_DASH_EMAIL:-}" && -n "${T_DASH_PASSWORD:-}" ]]; then
    local resp
    resp=$(jq -n --arg e "$T_DASH_EMAIL" --arg p "$T_DASH_PASSWORD" '{email:$e,password:$p}' |
      curl -sS -X POST "$T_DASH_SUPABASE_URL/auth/v1/token?grant_type=password" \
        --config <(printf 'header = "apikey: %s"\n' "$T_DASH_SUPABASE_ANON_KEY") \
        -H 'Content-Type: application/json' --data-binary @-)
    jq -e '.access_token' <<<"$resp" >/dev/null 2>&1 ||
      die "login failed: $(jq -r '.msg // .error_description // .error // "unknown error"' <<<"$resp")"
    (umask 077; mkdir -p "$(dirname "$TOKEN_CACHE")"; jq '{access_token, expires_at}' <<<"$resp" >"$TOKEN_CACHE")
    jq -r .access_token <<<"$resp"; return
  fi
  # No user credentials: fall back to the anon key (reads will be empty under RLS).
  printf '%s' "$T_DASH_SUPABASE_ANON_KEY"
}

# curl wrapper: auth headers go through a config fd so tokens never show in `ps`.
api() {
  local method="$1" path="$2" token; shift 2
  token=$(access_token)
  curl -sS --fail-with-body -X "$method" "$T_DASH_SUPABASE_URL/rest/v1/$path" \
    --config <(printf 'header = "apikey: %s"\nheader = "Authorization: Bearer %s"\n' \
      "$T_DASH_SUPABASE_ANON_KEY" "$token") \
    -H 'Content-Type: application/json' "$@"
}

cmd_check() {
  load_config
  local n; n=$(api GET 'projects?select=id' | jq length)
  [[ "$n" -gt 0 ]] || die "connected, but 0 projects visible: not signed in. Add T_DASH_EMAIL and T_DASH_PASSWORD to $CONFIG_FILE"
  echo "ok: $T_DASH_SUPABASE_URL reachable, $n projects visible"
}

cmd_projects() {
  load_config
  api GET 'projects?select=id,title,subtitle,link&order=title.asc' | jq -c '.[]'
}

cmd_records() {
  load_config
  local from="${1:-$(date -d '7 days ago' +%F)}" to="${2:-$(date +%F)}"
  api GET "records?select=id,date,project_id,time_spent,title,category,link,description&date=gte.$from&date=lte.$to&order=date.desc,id.desc" |
    jq -r '.[] | [.id, .date, .project_id, "\(.time_spent)h", .category, .title, (.description | if length > 80 then .[0:80] + "…" else . end)] | @tsv'
}

# Human-readable listing of existing records for a period: joins project titles,
# groups by date, and totals by day / project / overall. Read-only.
cmd_list() {
  load_config
  [[ "${2:-}" ]] || die "usage: tlogs.sh list FROM TO [project_id]"
  local from="$1" to="$2"
  local project_id="${3:-}"
  local filter="date=gte.$from&date=lte.$to"
  [[ -n "$project_id" ]] && filter="$filter&project_id=eq.$project_id"
  local projects records
  projects=$(api GET 'projects?select=id,title')
  records=$(api GET "records?select=id,date,project_id,time_spent,category,title,link,description&${filter}&order=date.desc,id.asc")
  jq -rn --argjson P "$projects" --argjson R "$records" --arg from "$from" --arg to "$to" '
    (reduce $P[] as $p ({}; .[$p.id | tostring] = $p.title)) as $names
    | def pname: $names[.project_id | tostring] // "project \(.project_id)";
    if ($R | length) == 0 then "No records between \($from) and \($to)."
    else
      ( $R | group_by(.date) | sort_by(.[0].date) | reverse[]
        | "## \(.[0].date)  (\([.[].time_spent] | add)h)",
          (.[] | "- [\(.id)] " + pname + "  ·  \(.time_spent)h  ·  \(.category)  ·  \(.title)"
                + (if .link != "" then "  ·  \(.link)" else "" end)),
          "" ),
      "By project:",
      ( $R | group_by(.project_id)
        | map({name: (.[0] | pname), hours: ([.[].time_spent] | add)})
        | sort_by(-.hours)[] | "  \(.name): \(.hours)h" ),
      "",
      "TOTAL \($from)..\($to): \([$R[].time_spent] | add)h across \($R | length) entries"
    end
  '
}

# Resolve the target project. Inputs: each URL / git remote given as an argument, plus
# the current git root's folder name. One MATCH line per input; the project list is
# printed only when nothing resolved. Rules, first hit wins (link results outrank folder):
#   1. project link matches host + owner (+ repo when the project link has one)
#   2. an earlier record whose link has the same host + owner (e.g. linear.app/<workspace>);
#      the history is read here and never printed
#   3. project title appears in the URL, or in the folder name (case-insensitive, letters
#      and digits only, like the UI's link -> project auto-select)
cmd_lookup() {
  load_config
  local projects hist dir
  projects=$(api GET 'projects?select=id,title,link')
  hist=$(api GET "records?select=project_id,link&link=not.is.null&date=gte.$(date -d '180 days ago' +%F)&order=date.desc,id.desc&limit=300")
  dir=$(basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")
  jq -rn --argjson P "$projects" --argjson H "$hist" --arg dir "$dir" \
    --arg urls "$(printf '%s\n' "$@")" '
    def seg: ascii_downcase
      | sub("^git@(?<h>[^:]+):"; "https://\(.h)/") | sub("^[a-z]+://"; "")
      | sub("[?#].*$"; "") | sub("\\.git$"; "") | sub("/+$"; "") | split("/");
    def norm: ascii_downcase | gsub("[^a-z0-9]"; "");
    ($urls | split("\n") | map(select(length > 0))) as $U
    | ($P | map(. + {s: ((.link // "") | seg)})) as $PS
    | ($H | map(select((.link // "") != "") | {project_id, s: (.link | seg)})) as $HS
    | def bytitle($x; $label):
        ([$P[] | . as $p | select(($x | norm) | contains($p.title | norm))]) as $t
        | if ($t | length) == 1 then {p: $t[0], rule: $label}
          elif ($t | length) > 1 then {amb: ($t | map(.title) | join(","))}
          else {} end;
      def resolve($u):
        ($u | seg) as $s
        | if ($s | length) < 2 then {}
          else ([$PS[] | select(.s[0] == $s[0] and .s[1] == $s[1]
                  and ((.s | length) < 3 or .s[2] == $s[2]))]) as $b
            | if ($b | length) == 1 then {p: $b[0], rule: "project link"}
              elif ($b | length) > 1 then {amb: ($b | map(.title) | join(","))}
              else ([$HS[] | select(.s[0] == $s[0] and .s[1] == $s[1])][0]) as $c
                | ([$P[] | select(.id == $c.project_id)][0]) as $hp
                | if $hp then {p: $hp, rule: "earlier record, same host/owner"}
                  else bytitle($u; "title in link") end
              end
          end;
      ([$U[] | {in: ., r: resolve(.)}]
        + [{in: "[folder] \($dir)", r: bytitle($dir; "title in folder name")}]) as $R
    | ($R[] | "MATCH\t\(.in)\t"
        + (if .r.p then "\(.r.p.id)\t\(.r.p.title)\t\(.r.rule)"
           elif .r.amb then "ambiguous\t\(.r.amb)"
           else "none" end)),
      (if ($R | map(select(.r.p)) | length) == 0
       then "PROJECTS", ($P | sort_by(.title)[] | "\(.id)\t\(.title)") else empty end)
  '
}

cmd_post() {
  local dry=0; [[ "${1:-}" == "--dry-run" ]] && { dry=1; shift; }
  [[ $dry -eq 1 ]] || load_config
  local src="${1:--}" body
  [[ "$src" == "-" ]] && body=$(cat) || body=$(cat "$src")
  # Normalize to an array, apply defaults, validate.
  body=$(jq -c --argjson cats "$CATEGORIES" '
    (if type == "array" then . else [.] end)
    | map({tags: [], link: "", description: ""} + .)
    | if length == 0 then error("no records to post") else . end
    | map(
        if (.title // "" | length) == 0 then error("title is required")
        elif (.project_id | type) != "number" then error("project_id must be a number: \(.title)")
        elif (.date | test("^\\d{4}-\\d{2}-\\d{2}$") | not) then error("date must be YYYY-MM-DD: \(.title)")
        elif (.time_spent | type) != "number" or .time_spent <= 0 then error("time_spent must be > 0: \(.title)")
        elif ([.category] | inside($cats) | not) then error("category must be one of \($cats): \(.title)")
        else {title, description, project_id, category, tags, date, time_spent, link} end)
  ' <<<"$body") || die "validation failed"
  if [[ $dry -eq 1 ]]; then jq -c '.[]' <<<"$body"; return; fi
  # One request = one transaction: either every record is created or none.
  api POST 'records?select=*' -H 'Prefer: return=representation' --data-binary "$body" | jq -c '.[]'
}

cmd_delete() {
  local id="${1:-}"
  [[ "$id" =~ ^[0-9]+$ ]] || die "usage: tlogs.sh delete <numeric record id>"
  load_config
  local out; out=$(api DELETE "records?id=eq.$id" -H 'Prefer: return=representation' | jq -c '.[]')
  [[ -n "$out" ]] || die "no record with id $id (nothing deleted)"
  echo "$out"
}

cmd_session() {
  local sid="${1:-${CLAUDE_SESSION_ID:-}}" file
  if [[ -n "$sid" ]]; then
    file=$(find "$HOME/.claude/projects" -maxdepth 2 -name "$sid.jsonl" -print -quit)
  fi
  # Fallback: newest transcript for the current directory.
  if [[ -z "${file:-}" ]]; then
    local dir="$HOME/.claude/projects/$(pwd | sed 's/[^A-Za-z0-9]/-/g')"
    file=$(ls -t "$dir"/*.jsonl 2>/dev/null | head -1 || true)
  fi
  [[ -n "${file:-}" && -f "$file" ]] || die "session transcript not found"
  # Compact by design: read-only lookups are dropped (they show exploration, not
  # output); long digests keep the first 15 and last 65 lines.
  local lines n max=80
  lines=$(jq -r '
    def clean: gsub("<system-reminder>[\\s\\S]*?</system-reminder>"; "")
             | gsub("<local-command-[a-z]+>[\\s\\S]*?</local-command-[a-z]+>"; "")
             | gsub("^\\s+|\\s+$"; "");
    def clip($n): if length > $n then .[0:$n] + "…" else . end;
    def oneline: gsub("\\s*\\n\\s*"; " ⏎ ");
    select((.type == "user" or .type == "assistant") and (.isMeta // false | not)) |
    (.timestamp // "")[0:19] as $t |
    (.message.content) as $c |
    if .type == "user" then
      (if ($c | type) == "string" then $c
       else ([$c[]? | select(.type == "text") | .text] | join("\n")) end)
      | clean | select(length > 0) | "\($t) USER: \(oneline | clip(300))"
    else
      $c[]? |
      if .type == "text" then
        (.text | clean | select(length > 0) | "\($t) CLAUDE: \(oneline | clip(160))")
      elif .type == "tool_use" then
        if (.name | test("^(Read|Grep|Glob|ToolSearch|WebFetch|WebSearch)$|^mcp__.*(search|find_related)$")) then empty
        else
          (.input as $i |
           (if .name == "Bash" then ($i.description // $i.command // "")
            elif (.name == "Edit" or .name == "Write" or .name == "NotebookEdit") then ($i.file_path // "")
            else ($i | tostring) end)
           | oneline | clip(120)) as $d
          | "\($t) TOOL \(.name): \($d)"
        end
      else empty end
    end
  ' "$file" 2>/dev/null) || die "could not parse transcript"
  n=$(grep -c '' <<<"$lines" || true)
  echo "# transcript: $file"
  if [[ $n -gt $max ]]; then
    head -n 15 <<<"$lines"; echo "… $((n - max)) lines omitted …"; tail -n $((max - 15)) <<<"$lines"
  else
    echo "$lines"
  fi
  echo "# span: $(jq -r 'select(.timestamp) | .timestamp' "$file" | sed -n '1p;$p' | paste -sd' ' | sed 's/ / → /')"
}

case "${1:-}" in
  check)    shift; cmd_check "$@" ;;
  projects) shift; cmd_projects "$@" ;;
  records)  shift; cmd_records "$@" ;;
  list)     shift; cmd_list "$@" ;;
  lookup)   shift; cmd_lookup "$@" ;;
  post)     shift; cmd_post "$@" ;;
  delete)   shift; cmd_delete "$@" ;;
  session)  shift; cmd_session "$@" ;;
  *) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
