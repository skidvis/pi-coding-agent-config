# .pi — Personal pi Agent Configuration

Personal configuration layer for [pi](https://github.com/mariozechner/pi), a CLI coding agent by Mario Zechner. This config transforms pi from a single assistant into a dispatcher-based multi-agent system: a main orchestrator routes tasks to specialized subagents, each with its own tool permissions, system prompt, and persistent session.

## Table of Contents

- [How It Works](#how-it-works)
- [Orchestrator Modes](#orchestrator-modes)
- [Directory Structure](#directory-structure)
- [Agent Definition Format](#agent-definition-format)
- [Named Teams](#named-teams)
- [Agent Roster](#agent-roster)
- [Extensions](#extensions)
- [Global Rules](#global-rules)
- [Skills](#skills)
- [Adding Agents and Teams](#adding-agents-and-teams)
- [Dependencies](#dependencies)

---

## How It Works

The main pi session becomes a pure dispatcher. It has no direct codebase tools (`read`, `write`, `grep`, etc.). All work flows through the `dispatch_agent` tool, which spawns subagents as `pi --mode json` subprocesses.

Each subagent:

- Runs with its own tool set defined in its `.md` frontmatter
- Persists its session as a `.json` file in `.pi/agent-sessions/` for cross-invocation memory
- Streams output back to the orchestrator in real time

The orchestrator renders a live grid widget in the terminal showing each agent's status (idle / running / done / error), elapsed time, and last line of output. If `$TMUX` is set, a split pane opens to tail the live log.

---

## Orchestrator Modes

Two plugins are available. Load one via `PI_PLUGINS`:

### Agent Team (`plugins/agent-team.ts`)

General-purpose dispatcher. Loads agent definitions from `.md` files, reads named team compositions from `agents/teams.yaml`, and presents a team-selector on boot. Only members of the active team are available for dispatch.

```bash
PI_PLUGINS=agent-team pi
```

Commands:

| Command | Description |
|---|---|
| `/agents-team` | Switch the active team |
| `/agents-list` | List loaded agents and their current status |
| `/agents-grid <1-6>` | Set the grid column count |

### Coordinator (`plugins/coordinator.ts`)

Workflow-enforcing orchestrator. Hardcodes a 3-agent team (Researcher, Implementer, Verifier) and enforces a four-phase workflow for every non-trivial task:

1. **Research** — dispatches researchers in parallel to investigate from multiple angles; each writes findings to `.pi/scratchpad/`
2. **Synthesis** — the coordinator personally reads all research outputs and writes an implementation spec to `.pi/scratchpad/`
3. **Implementation** — dispatches implementers serially per file set, referencing the spec
4. **Verification** — dispatches a different agent to prove the changes work

The scratchpad is wiped at the start of each session. Files follow the naming convention `research-<topic>.md`, `spec-<topic>.md`, `verify-<topic>.md`.

```bash
PI_PLUGINS=coordinator pi
```

---

## Directory Structure

```
~/.pi/
├── .gitignore
├── README.md
├── bin/
│   ├── fd                      # Bundled fd binary
│   └── rg                      # Bundled ripgrep binary
└── agent/
    ├── settings.json            # Default model, packages, theme, skills
    ├── models.json              # Custom model providers (Ollama)
    ├── auth.json                # API keys (gitignored)
    ├── run-history.jsonl        # Session history (gitignored)
    ├── extensions/
    │   ├── pi-rules.ts          # Injects rules/*.md into every agent system prompt
    │   └── plugin-loader.ts     # Loads plugins via PI_PLUGINS env var
    ├── plugins/
    │   ├── agent-team.ts        # Agent Team orchestrator
    │   └── coordinator.ts       # Coordinator orchestrator
    ├── agents/
    │   ├── teams.yaml           # Named team compositions
    │   └── *.md                 # 35+ agent definition files
    ├── rules/
    │   └── system-prompt.md     # Global rules injected into all agents
    └── sessions/                # Pi session storage (gitignored)
```

Runtime directories (gitignored, created automatically):

- `.pi/agent-sessions/` — subagent session JSON files (wiped on each session start)
- `.pi/scratchpad/` — coordinator shared working memory (wiped on each session start)

---

## Agent Definition Format

Each agent is a Markdown file with YAML frontmatter. Place it in `agents/`. It will be auto-discovered on the next session with no registration step required.

```markdown
---
name: kebab-case-name
description: One sentence describing the agent's role and scope.
tools: read,grep,find,ls
thinking: high
---

# Agent Name: Role

Full system prompt...
```

The `tools` field controls what the subagent subprocess is allowed to call. Common values: `read,grep,find,ls` (read-only), `read,write,edit,bash` (full access).

`thinking` is optional. Valid values: `low`, `minimal`, `high`.

Agent definitions are scanned from these directories in order:

1. `{cwd}/agents/`
2. `{cwd}/.claude/agents/`
3. `{cwd}/.pi/agents/`
4. `~/.pi/agent/agents/` (global)

The first file with a given `name` wins.

---

## Named Teams

Teams are defined in `agents/teams.yaml`. Each entry is a team name mapped to a list of agent names.

```yaml
plan:
  - scout
  - planner
  - documenter
```

The Agent Team plugin selects the first team on boot. Use `/agents-team` to switch.

### Available Teams

| Team | Members |
|---|---|
| `base` | scout |
| `info` | scout, browser, documenter, reviewer, negotiator, agent-builder, agent-researcher |
| `plan` | scout, planner, documenter |
| `next` | scout, browser, scheduler |
| `ads` | scout, negotiator, ad-strategist, sales-coach |
| `plan-build` | scout, conventions-analyst, planner, greenfield-web, brownfield-planner, ui-designer, builder, reviewer, wcag-auditor |
| `full` | scout, conventions-analyst, planner, builder, reviewer, documenter, scheduler, ad-strategist, negotiator, browser |
| `brand` | scout, browser, negotiator, ad-strategist, brand-strategist, personal-brand-strategist, documenter, sales-coach, linkedin-coach, brand-psychologist, storybrand |
| `business` | scout, browser, regulatory-specialist, brand-strategist, financial-modeler, distribution-strategist, trade-marketer, consumer-marketer |

---

## Extensions

Two extensions load automatically from `extensions/` on every pi session.

### `pi-rules.ts`

Scans `rules/*.md` and appends a list of rule file paths to every agent's system prompt. This enforces global conventions across all agents without duplicating content.

### `plugin-loader.ts`

Reads the `PI_PLUGINS` environment variable and dynamically loads the named plugins from `plugins/`.

```bash
# Load a single plugin
PI_PLUGINS=agent-team pi

# Load multiple plugins
PI_PLUGINS=agent-team,my-plugin pi
```

Each plugin must export a default function that accepts the `ExtensionAPI`. The loader resolves plugins as either `plugins/<name>.ts` or `plugins/<name>/index.ts`.

---

## Global Rules

Edit `rules/system-prompt.md`. The `pi-rules.ts` extension appends its path to every agent's system prompt automatically. Changes take effect on the next session start; no other configuration is needed.

Current global rules:

- Always start in the current working directory
- No emdash, endash, or double-hyphen in any output

---

## Skills

The following npm skills are installed via `settings.json`:

| Skill | Role |
|---|---|
| `pi-vitals` | System health metrics |
| `pi-peon-ping` | Basic connectivity check |
| `@aliou/pi-guardrails` | Safety guardrails |
| `pi-ask-user-question` | Structured user prompts from agents |
| `pi-subagents` | Subagent utilities |
| `pi-updater` | Auto-update support |

---

## Adding Agents and Teams

### Add an agent

Create a `.md` file in `agent/agents/` using the [frontmatter format](#agent-definition-format). The file is auto-discovered on the next session.

### Add a team

Append an entry to `agent/agents/teams.yaml`:

```yaml
my-team:
  - scout
  - builder
  - reviewer
```

Switch to it during a session with `/agents-team`.

---

## Dependencies

| Dependency | Role |
|---|---|
| [`@mariozechner/pi-coding-agent`](https://github.com/mariozechner/pi) | Base CLI and SDK |
| `@mariozechner/pi-tui` | Terminal UI library (live grid dashboard) |
| `@sinclair/typebox` | Runtime JSON schema validation for tool parameters |
| Anthropic Claude (`claude-sonnet-4-6`) | Default model |
| Ollama | Optional local model backend (configured in `models.json`) |
| Node.js `child_process` | Spawns subagents as `pi --mode json` subprocesses |
