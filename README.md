# pi agent config

Personal configuration layer for [pi](https://github.com/mariozechner/pi), a CLI-based coding agent by Mario Zechner. Rather than using pi as a single assistant, this config turns it into a **dispatcher** that routes tasks to specialized subagents, each with its own tool permissions, system prompt, and persistent session.

## Table of Contents

- [How It Works](#how-it-works)
- [Structure](#structure)
- [Agent Definition Format](#agent-definition-format)
- [Teams](#teams)
- [Included Agents](#included-agents)
- [Adding a New Agent](#adding-a-new-agent)
- [Adding a New Team](#adding-a-new-team)
- [Global Rules](#global-rules)
- [Dependencies](#dependencies)

---

## How It Works

### Dispatcher (agent-team.ts)

When pi loads, the main agent becomes a pure dispatcher:

1. Scans agent `.md` files from `agents/`, `.claude/agents/`, `.pi/agents/`, and `~/.pi/agent/agents/`
2. Parses `teams.yaml` for named group compositions
3. Locks the main agent's tools to only `dispatch_agent` and `askUserQuestion`
4. Renders a live grid widget showing each agent's status (idle / running / done / error), elapsed time, and last output
5. Each `dispatch_agent` call spawns a `pi --mode json` subprocess with the target agent's tools and prompt
6. Agent sessions persist as `.json` files for cross-invocation memory
7. Optionally opens a tmux split pane tailing the live log

### Global Rules (pi-rules.ts)

Scans `rules/*.md` and appends each file path to every agent's system prompt. This enforces global conventions across all agents without duplication.

---

## Structure

```
~/.pi/
├── .gitignore
├── bin/
│   ├── fd                    # Bundled fd binary
│   └── rg                    # Bundled ripgrep binary
└── agent/
    ├── README.md
    ├── settings.json         # Global pi settings
    ├── models.json           # Custom model provider definitions (Ollama)
    ├── auth.json             # API keys (gitignored)
    ├── run-history.jsonl     # Session history (gitignored)
    ├── extensions/
    │   ├── agent-team.ts     # Dispatcher orchestrator with live grid dashboard
    │   └── pi-rules.ts       # Injects rules/*.md into every agent system prompt
    ├── agents/
    │   ├── teams.yaml        # Named team compositions
    │   └── *.md              # 25+ individual agent definitions
    ├── rules/
    │   └── system-prompt.md  # Global rules injected into all agents
    └── skills/
```

---

## Agent Definition Format

Each agent is a Markdown file with YAML frontmatter:

```markdown
---
name: kebab-case-name
description: One sentence describing the agent
tools: read,grep,find,ls
thinking: high  # optional
---

# Agent Name: Role

{Full system prompt...}
```

Place the file in `agents/`. It will be auto-discovered on the next pi session.

---

## Teams

Named team compositions are defined in `agents/teams.yaml`. A team is a named list of agent names. Example teams include `dev`, `brand`, and `info`.

To add a team, append an entry to `teams.yaml` with a name and a list of agent names.

---

## Included Agents

| Agent | Description |
|---|---|
| `browser` | Browser automation via playwright-cli. |
| `builder` | Implements code from a plan (read, write, edit, bash). |
| `conventions-analyst` | Reverse-engineers codebase patterns into a conventions reference. |
| `documenter` | README and inline documentation. |
| `greenfield-web` | Scaffolds Astro + Vue + Tailwind projects from scratch. |
| `planner` | Read-only analysis. Answers implementation questions by reading code. |
| `reviewer` | Spec-aware code review via git diff. Structured findings (critical / high / medium / low). |
| `scout` | Confidence-scored codebase exploration. 5-dimension readiness gate before implementation. Read-only. |
| `ui-designer` | UI design and component scaffolding. |
| `wcag-auditor` | WCAG accessibility audit. |

---

## Adding a New Agent

Create a `.md` file in `agents/` using the [frontmatter format](#agent-definition-format). The file will be auto-discovered on the next pi session. No registration step required.

---

## Adding a New Team

Add an entry to `agents/teams.yaml`:

```yaml
- name: my-team
  agents:
    - scout
    - builder
    - reviewer
```

---

## Global Rules

Edit `rules/system-prompt.md`. Changes propagate automatically to all agents via `pi-rules.ts` on the next session.

---

## Dependencies

| Dependency | Role |
|---|---|
| [`@mariozechner/pi-coding-agent`](https://github.com/mariozechner/pi) | Base CLI and SDK |
| `@mariozechner/pi-tui` | Terminal UI library (live grid dashboard) |
| `@sinclair/typebox` | Runtime JSON schema validation |
| Anthropic Claude | Default model: `claude-sonnet-4-6` |
| Ollama | Optional local model backend (configured in `models.json`) |
| `pi-vitals` | Skill |
| `pi-peon-ping` | Skill |
| `@aliou/pi-guardrails` | Skill |
| `pi-ask-user-question` | Skill |
| `@nicknisi/pi-ideation` | Skill |
| `pi-subagents` | Skill |
