# 22 — MCP Integration Setup (Figma · GitHub · Jira)

> **One file, fully reproducible.** This is the ONLY MCP artifact committed to the repo. Hand this file to
> Claude Code after cloning and it will recreate the **exact same** MCP setup automatically and optimally.
> The generated config + secret files are **git-ignored** (they hold tokens) — only this guide is shared.

---

## How this works (the contract)
- **Committed:** this `22-mcp-integration-setup.md` only.
- **Git-ignored (never committed):** `.mcp.json`, `mcp.secrets.env`, `.claude/settings.local.json`, `.env.mcp`.
- **On clone:** open Claude Code in the repo, say *"Set up MCP from `docs/Setup plan/22-mcp-integration-setup.md`"*.
  Claude follows the **AGENT INSTRUCTIONS** below: collects tokens → writes the git-ignored config →
  ensures `.gitignore` → verifies. Result is identical on every machine.
- **Scope choice:** use **local scope** (`claude mcp add --scope local …`) or a **git-ignored `.mcp.json`** so
  no token ever lands in version control.

---

## Prerequisites (tokens — get once, paste when asked)
| Service | Secret | How to get it | Min scope |
|---|---|---|---|
| **Figma** | `FIGMA_API_KEY` | figma.com → Settings → Security → *Personal access tokens* | File read |
| **GitHub** | `GITHUB_PERSONAL_ACCESS_TOKEN` | github.com → Settings → Developer settings → *Fine-grained PAT* | repo, issues, PR |
| **Jira/Atlassian** | OAuth (recommended) **or** `JIRA_URL` + `JIRA_EMAIL` + `JIRA_API_TOKEN` | id.atlassian.com → *API tokens* | Jira read/write |

> HUPC Figma file key: `nJXFzS6MzrFXQmcZcmMT4i` (reference for Figma tools).

---

## AGENT INSTRUCTIONS (Claude: execute these steps in order)

**Step 1 — Collect secrets.** Ask the user for the tokens above (or read them from `mcp.secrets.env` if it
already exists). Never echo full tokens back. Write them to a git-ignored `mcp.secrets.env`:
```ini
# mcp.secrets.env  (GIT-IGNORED — never commit)
FIGMA_API_KEY=...
GITHUB_PERSONAL_ACCESS_TOKEN=...
# Jira (only if NOT using OAuth):
JIRA_URL=https://<your-domain>.atlassian.net
JIRA_EMAIL=...
JIRA_API_TOKEN=...
```

**Step 2 — Ensure `.gitignore`** contains (append if missing, dedupe):
```gitignore
# MCP setup — keep secrets/config out of git
.mcp.json
mcp.secrets.env
.env.mcp
.claude/settings.local.json
```

**Step 3 — Register the three MCP servers** (prefer `--scope local` so nothing is committed). Load the env
from `mcp.secrets.env` first, then run:

```bash
set -a; . ./mcp.secrets.env; set +a

# Figma — Framelink Figma MCP (stdio)
claude mcp add figma --scope local \
  --env FIGMA_API_KEY="$FIGMA_API_KEY" \
  -- npx -y figma-developer-mcp --stdio

# GitHub — official remote MCP (OAuth/PAT, recommended)
claude mcp add --transport http github --scope local \
  --header "Authorization: Bearer $GITHUB_PERSONAL_ACCESS_TOKEN" \
  https://api.githubcopilot.com/mcp/

# Jira/Atlassian — official remote MCP (OAuth; Claude will prompt to authorize in browser)
claude mcp add --transport sse atlassian --scope local https://mcp.atlassian.com/v1/sse
```

**Fallbacks** (use only if a remote server is unavailable):
```bash
# GitHub local server (Docker) instead of remote:
claude mcp add github --scope local --env GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN" \
  -- docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server

# Jira via mcp-atlassian (token auth) instead of OAuth:
claude mcp add jira --scope local \
  --env JIRA_URL="$JIRA_URL" --env JIRA_USERNAME="$JIRA_EMAIL" --env JIRA_API_TOKEN="$JIRA_API_TOKEN" \
  -- uvx mcp-atlassian
```

**Alternative — git-ignored `.mcp.json`** (if you prefer file config over CLI). Write this file (it is
git-ignored per Step 2). Tokens are injected from the environment via `${VAR}` expansion:
```json
{
  "mcpServers": {
    "figma":     { "command": "npx", "args": ["-y","figma-developer-mcp","--stdio"],
                   "env": { "FIGMA_API_KEY": "${FIGMA_API_KEY}" } },
    "github":    { "type": "http", "url": "https://api.githubcopilot.com/mcp/",
                   "headers": { "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}" } },
    "atlassian": { "type": "sse", "url": "https://mcp.atlassian.com/v1/sse" }
  }
}
```

**Step 4 — Verify.** Run `claude mcp list` (all three should be ✓ connected). For OAuth servers
(Atlassian / GitHub remote), complete the browser authorization when prompted. Confirm tools load
(e.g. Figma `get_file`, GitHub `list_pull_requests`, Jira `searchJiraIssuesUsingJql`).

**Step 5 — Confirm hygiene.** Run `git status` and confirm `.mcp.json` / `mcp.secrets.env` are **ignored**
(not staged). Only this `.md` should ever be tracked.

---

## Re-setup on a fresh clone (the whole point)
1. Clone repo, open Claude Code in it.
2. Tell Claude: *"Set up MCP from docs/Setup plan/22-mcp-integration-setup.md."*
3. Paste tokens when asked → Claude runs Steps 1–5 → identical setup, secrets auto-ignored.

## Notes
- Same setup applies to **all four portals** (Admin / Provider / Patient / Website Widget) — this file is
  identical in each repo.
- Rotating a token: update `mcp.secrets.env` and re-run the relevant `claude mcp add` (or restart Claude).
- Remove a server: `claude mcp remove <name> --scope local`.
- Pin server package versions where supported for reproducibility; prefer OAuth remotes for GitHub/Jira to
  avoid long-lived PATs when possible.
