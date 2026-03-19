# pi Personal Configuration Layer

A personal configuration layer for the [pi coding agent](https://github.com/mariozechner/pi) by mariozechner. This directory (`~/.pi/agent/`) provides a full multi-agent orchestration system: custom agent definitions, global extensions, rules injection, skills, and model configuration.

---

## Table of Contents

- [Structure](#structure)
- [Extensions](#extensions)
- [Agents](#agents)
- [Teams](#teams)
- [Agent Chains](#agent-chains)
- [Skills](#skills)
- [Rules](#rules)
- [Settings](#settings)

---

## Structure

```
~/.pi/agent/
├── settings.json           # Global pi settings (model, theme, packages)
├── models.json             # Custom model provider definitions
├── agents/                 # Agent definition files (.md) + orchestration config
│   ├── teams.yaml          # Named team compositions
│   ├── agent-chain.yaml    # Sequential multi-agent pipeline chains
│   └── *.md                # Individual agent definitions
├── extensions/             # Active global pi extensions (TypeScript)
│   ├── ask-user-question/  # Registers askUserQuestion tool globally
│   │   └── index.ts
│   ├── agent-team.ts       # Dispatcher orchestrator with live grid dashboard
│   └── pi-rules.ts         # Injects rules/*.md into every agent system prompt
├── bin/                    # Bundled binaries: fd, rg (ripgrep) for Windows + Mac
├── rules/
│   └── system-prompt.md    # Global rules appended to all agent prompts
├── skills/
│   ├── ideation/           # Structured ideation workflow (SKILL.md + examples)
│   └── execute-spec/       # Spec execution orchestrator skill
└── sessions/               # Auto-saved pi session JSONL files
```

---

## Extensions

### `agent-team.ts`

The core orchestrator. Registers a `dispatch_agent` tool that routes tasks to named agents or teams.

**What it does:**

- Loads agent definitions from `agents/*.md` (and `.claude/agents/`, `.pi/agents/`, `~/.pi/agent/agents/`)
- Parses `teams.yaml` to compose named teams of agents
- Spawns `pi --mode json -p` subprocesses for each task, streaming JSON events
- Persists agent sessions across invocations (each agent gets its own `.json` session file)
- Displays a live grid widget above the editor showing status (idle / running / done / error), elapsed time, and last output seen
- Supports slash commands: `/agents-team`, `/agents-list`, `/agents-grid <n>`
- On session start: wipes old agent sessions, locks the main agent's tools to `["dispatch_agent", "askUserQuestion"]`, and auto-selects the first defined team
- Optional tmux integration: opens a split pane tailing agent logs when `$TMUX` is set

### `ask-user-question/index.ts`

Registers an `askUserQuestion` tool globally so any agent can prompt the user mid-task.

- **Multiple-choice mode:** uses `ctx.ui.select` when an `options` array is provided
- **Free-text mode:** uses `ctx.ui.input` when no options are given
- **Non-interactive fallback:** returns a graceful message when `ctx.hasUI === false`
- Dismiss/escape handling returns a `"user dismissed"` message so the model can continue safely

### `pi-rules.ts`

On session start, scans `rules/` recursively for `.md` files. Before each agent run, appends the list of rule file paths to the system prompt and instructs the agent to `read` them before acting.

---

## Agents

### Development Pipeline

| Agent | Key Tools | Role |
|---|---|---|
| `scout` | read, grep, find, ls, askUserQuestion | Confidence-gated codebase exploration; produces structured context maps |
| `planner` | read, grep, find, ls | Read-only analysis and implementation planning |
| `builder` | read, write, edit, bash | Implements code changes from a plan |
| `reviewer` | read, grep, find, ls, bash | Spec-aware code review with severity-ranked findings |
| `conventions-analyst` | read, grep, find, ls | Reverse-engineers codebase patterns into a conventions reference |
| `greenfield-web` | read, grep, find, ls, bash, write | Scaffolds Astro + Vue + Tailwind projects |

### Documentation and Discovery

| Agent | Key Tools | Role |
|---|---|---|
| `documenter` | read, write, edit, grep, find, ls | README and inline documentation generation |
| `scheduler` | read, grep, find, ls, write | Prioritized task checklist from project artifacts |
| `browser` | read, bash | Browser automation via playwright-cli |

### Agent Construction and Research

| Agent | Key Tools | Role |
|---|---|---|
| `agent-builder` | read, grep, find, ls, bash, write | Builds agent `.md` files from source material |
| `agent-researcher` | read, grep, find, ls, bash, write | Iterative agent improvement loop (hypothesis, modify, test, score) |

### Business and Strategy

| Agent | Key Tools | Role |
|---|---|---|
| `brand-strategist` | read, grep, find, ls, write | Brand identity and positioning |
| `personal-brand-strategist` | read, grep, find, ls, write | Personal brand development |
| `ad-strategist` | read, grep, find, ls, write | Paid media and advertising strategy |
| `sales-coach` | read, grep, find, ls, write | Sales process and enablement |
| `distribution-strategist` | read, grep, find, ls, write | Market entry and distribution planning |
| `trade-marketer` | read, grep, find, ls, write | Trade marketing programs and sell materials |
| `consumer-marketer` | read, grep, find, ls, write | Consumer marketing and launch campaigns |
| `financial-modeler` | read, bash, write | Financial modeling and investor materials |
| `regulatory-specialist` | read, grep, find, ls, write | Regulatory roadmaps and compliance |
| `product-developer` | read, grep, find, ls, write | Product strategy and development |
| `awards-strategist` | read, grep, find, ls, write | Competition and awards program strategy |
| `venture-coach` | read, grep, find, ls, write | Startup and venture advisory |
| `prd-writer` | read, write, grep, find, ls | Product requirements document generation |

### Domain Specialists

| Agent | Key Tools | Role |
|---|---|---|
| `negotiator` | read | Principled negotiation advisor (read-only) |
| `ideation-facilitator` | read, write, grep, find, ls | Structured ideation sessions using the ideation skill |
| `spec-writer` | read, write, grep, find, ls | Writes implementation specs from requirements |
| `debater` | read | Steelmanning and debate partner |
| `market-researcher` | read, bash | Web research and market analysis |
| `seo-analyst` | read, bash | SEO audit and content analysis |
| `copywriter` | read, write, grep, find, ls | Marketing copy generation |
| `email-writer` | read, write | Professional email drafting |
| `ui-designer` | read, grep, find, ls, bash, write | UI design and component scaffolding |
| `wcag-auditor` | read, grep, find, ls, bash | Accessibility audit and WCAG compliance |

### Utilities

| Agent | Key Tools | Role |
|---|---|---|
| `bash-specialist` | read, bash | Safe bash scripting (dry-run first) |
| `git-manager` | read, bash, write | Git operations and PR management |
| `test-runner` | read, bash | Test execution and failure triage |
| `context-compressor` | read, grep, find, ls | Summarizes large codebases for context windows |

---

## Teams

Teams are defined in `agents/teams.yaml`. The `agent-team` extension auto-selects the first defined team on session start. The dispatcher (main agent) is locked to `dispatch_agent` and `askUserQuestion` only during team sessions.

| Team | Agents |
|---|---|
| `info` | scout, browser, documenter, reviewer, negotiator, agent-builder, agent-researcher |
| `base` | scout |
| `plan` | scout, planner, documenter |
| `next` | scout, browser, scheduler |
| `ads` | scout, negotiator, ad-strategist, sales-coach |
| `brand` | scout, browser, negotiator, ad-strategist, brand-strategist, personal-brand-strategist, documenter, sales-coach |
| `full` | scout, conventions-analyst, planner, builder, reviewer, documenter, scheduler, ad-strategist, negotiator, browser |
| `plan-build` | scout, conventions-analyst, planner, greenfield-web, ui-designer, builder, reviewer, wcag-auditor |
| `business` | scout, browser, regulatory-specialist, brand-strategist, financial-modeler, distribution-strategist, trade-marketer, consumer-marketer |

---

## Agent Chains

Chains are defined in `agents/agent-chain.yaml`. Each chain is a sequential pipeline where each step's output is passed as `$INPUT` to the next step. `$ORIGINAL` always refers to the initial user prompt.

| Chain | Description | Steps |
|---|---|---|
| `build` | Plan, build, and review a feature | planner, builder, reviewer |
| `refactor` | Analyze, refactor, and verify | planner, builder, reviewer |
| `review-only` | Deep code review | reviewer |
| `full-launch` | Complete go-to-market (regulatory, brand, distribution, marketing, financials) | regulatory-specialist, brand-strategist, financial-modeler, distribution-strategist, trade-marketer, consumer-marketer |
| `brand-and-business` | Brand identity, financials, and distribution strategy | brand-strategist, financial-modeler, distribution-strategist |
| `regulatory-and-compliance` | Full regulatory roadmap and labeling compliance | regulatory-specialist, brand-strategist |
| `product-to-brand` | From liquid concept to brand identity | product-developer, brand-strategist, trade-marketer |
| `marketing-blitz` | Complete marketing package (trade, consumer, awards, launch) | brand-strategist, trade-marketer, consumer-marketer, awards-strategist |
| `investor-package` | Everything needed to pitch investors or secure funding | brand-strategist, financial-modeler, distribution-strategist |
| `distribution-deep-dive` | Market selection, distributor strategy, and account targeting | brand-strategist, distribution-strategist, trade-marketer |

---

## Skills

Skills are located in `skills/` and are loaded by agents that reference them. Each skill directory contains a `SKILL.md` defining the facilitation methodology, plus reference materials and worked examples.

### `ideation/`

Full ideation workflow. Provides a structured facilitation methodology for transforming raw brain dumps or dictated thoughts into organized implementation artifacts. Produces contracts and specs written to `./docs/ideation/{project-name}/`.

### `execute-spec/`

Orchestrates spec execution across agents. Defines how to decompose a spec into sections and assign each section to the appropriate builder agent.

---

## Rules

`rules/system-prompt.md` is injected into every agent's system prompt via the `pi-rules` extension. Rules currently enforce:

- Greeting convention
- Working directory discipline (always start from and search the current directory)
- Banned character sequences (emdash, endash, double hyphens as sentence punctuation)

---

## Settings

**`settings.json`:**

| Key | Value |
|---|---|
| `defaultModel` | `claude-sonnet-4-6` |
| `defaultProvider` | `anthropic` |
| `defaultThinkingLevel` | `minimal` |
| `theme` | `dark` |
| `hideThinkingBlock` | `false` |
| Global npm packages | `pi-vitals`, `pi-peon-ping`, `@aliou/pi-guardrails` |

**`models.json`:** Custom model provider definitions for local models (ollama, etc.).
