# MCP Integration Setup (Figma · GitHub · Jira)

> Generic foundation doc. Copied verbatim into every project's `project-setup/mcp-integration.md`.
> **One file, fully reproducible.** This is the only MCP artifact committed to the repo. Hand it to the agent after cloning and it recreates the exact same MCP setup. The generated config + secret files are git-ignored (they hold tokens) — only this guide is shared.

## The contract

- **Committed:** this doc only.
- **Git-ignored (never committed):** `.mcp.json`, `mcp.secrets.env`, `.claude/settings.local.json`, `.env.mcp`.
- **On clone:** open the agent in the repo and say *"Set up MCP from `project-setup/mcp-integration.md`."* It collects tokens → writes the git-ignored config → ensures `.gitignore` → verifies. Identical on every machine.
- **Scope:** use **local scope** (`--scope local`) or a git-ignored `.mcp.json` so no token ever lands in version control.

## Prerequisites (tokens — get once, paste when asked)

| Service | Secret | How to get it | Min scope |
|---|---|---|---|
| Figma | `FIGMA_API_KEY` | figma.com → Settings → Security → personal access tokens | file read |
| GitHub | `GITHUB_PERSONAL_ACCESS_TOKEN` | github.com → Developer settings → fine-grained PAT | repo, issues, PR |
| Jira/Atlassian | OAuth (recommended) **or** `JIRA_URL` + `JIRA_EMAIL` + `JIRA_API_TOKEN` | id.atlassian.com → API tokens | Jira read/write |

## Agent instructions (execute in order)

**Step 1 — Collect secrets.** Ask for the tokens (or read an existing `mcp.secrets.env`). Never echo full tokens. Write them to a git-ignored `mcp.secrets.env`:

```ini
# mcp.secrets.env  (GIT-IGNORED — never commit)
FIGMA_API_KEY=...
GITHUB_PERSONAL_ACCESS_TOKEN=...
# Jira (only if NOT using OAuth):
JIRA_URL=https://<your-domain>.atlassian.net
JIRA_EMAIL=...
JIRA_API_TOKEN=...
```

**Step 2 — Ensure `.gitignore`** contains (append if missing):

```gitignore
# MCP setup — keep secrets/config out of git
.mcp.json
mcp.secrets.env
.env.mcp
.claude/settings.local.json
```

**Step 3 — Register the servers** (prefer `--scope local`). Load env first:

```bash
set -a; . ./mcp.secrets.env; set +a

# Figma — Framelink Figma MCP (stdio)
claude mcp add figma --scope local \
  --env FIGMA_API_KEY="$FIGMA_API_KEY" \
  -- npx -y figma-developer-mcp --stdio

# GitHub — official remote MCP
claude mcp add --transport http github --scope local \
  --header "Authorization: Bearer $GITHUB_PERSONAL_ACCESS_TOKEN" \
  https://api.githubcopilot.com/mcp/

# Jira/Atlassian — official remote MCP (OAuth; authorize in browser when prompted)
claude mcp add --transport sse atlassian --scope local https://mcp.atlassian.com/v1/sse
```

**Fallbacks** (only if a remote server is unavailable): GitHub local server via Docker (`ghcr.io/github/github-mcp-server`); Jira via `uvx mcp-atlassian` with token auth.

**Alternative — git-ignored `.mcp.json`** (file config instead of CLI; tokens via `${VAR}` expansion):

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

**Step 4 — Verify.** `claude mcp list` (all should be ✓ connected). Complete browser OAuth for Atlassian/GitHub when prompted. Confirm tools load.

**Step 5 — Confirm hygiene.** `git status` shows `.mcp.json` / `mcp.secrets.env` ignored (not staged). Only this `.md` is tracked.

## Re-setup on a fresh clone

1. Clone, open the agent in the repo.
2. *"Set up MCP from `project-setup/mcp-integration.md`."*
3. Paste tokens when asked → identical setup, secrets auto-ignored.

## Notes

- Rotating a token: update `mcp.secrets.env` and re-run the relevant `claude mcp add` (or restart the agent).
- Remove a server: `claude mcp remove <name> --scope local`.
- Pin server package versions where supported; prefer OAuth remotes over long-lived PATs.

## Adapt per project (from SRS/MOM)

- Include only the integrations this project actually uses (drop Figma if there are no designs, etc.).
- Record the project's Figma file key / Jira project key here for the agent to reference.
