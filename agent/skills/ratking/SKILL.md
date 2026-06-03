---
name: ratking
description: Use this skill when you need to communicate with a peer Pi coding agent — to delegate a task, ask a question, sync data between machines, or coordinate work across agents. Activate when the user asks you to "talk to", "send to", "ask", "ping", or "coordinate with" another agent, or when you need information that a peer agent has access to.
---

# ratking — Peer-to-Peer Agent Communication

You have tools that let you send messages to other Pi coding agents and receive their replies. Agents are equals — there is no orchestrator. Any agent can initiate communication.

## Your Tools

| Tool | What It Does |
|---|---|
| `list_agents` | See who is in the pool (get their ids and names) |
| `send_to_agent` | Send a prompt to a peer; returns a `messageId` immediately |
| `await_response` | Block until the peer replies (default 60s timeout) |
| `poll_response` | Non-blocking check — returns response or null |

## Standard Workflow

```
1. list_agents        → confirm peer is online, get their id
2. send_to_agent      → send your prompt, save the messageId
3. await_response     → wait for peer's reply
4. (repeat as needed)
```

## Example: Ask a peer for data

```
1. Call list_agents — find "prod" agent with id "abc-123..."
2. Call send_to_agent { toAgentId: "abc-123...", prompt: "Please give me the schema of the users table with all PII fields redacted" }
   → returns messageId "msg-xyz..."
3. Call await_response { messageId: "msg-xyz..." }
   → peer returns: "users(id, email_hash, created_at, plan_tier)"
4. Use that information locally
```

## Rules

- **Always call `list_agents` first** — never guess an agentId.
- **Never send raw PII** in your prompt. If you need sensitive data from a peer, instruct it to redact/anonymise before returning.
- **Include enough context** in your prompt for the peer to act autonomously. The peer's LLM does not see your conversation history.
- **Define a clear end state** — tell the peer what "done" looks like to prevent loops.
- **Use `poll_response`** when you want to continue doing local work while waiting; use `await_response` when you must have the answer before proceeding.
- **Increase `timeoutMs`** for long-running peer tasks (e.g., 120000 for 2 minutes).

## Connection Setup (human)

The user must connect the agent to the pool before these tools work:

```
/jcoms              — connect + list peers (auto-names this agent)
/jcoms name prod    — set this agent's display name to "prod"
/jcoms disconnect   — leave the pool
/jcoms ping <id>    — test round-trip to a specific agent
```

## When Things Go Wrong

- **"not connected to pool"** — ask the user to run `/jcoms` first
- **`await_response` timeout** — the peer may be busy or offline; try `poll_response` later or ask the user to check the peer's terminal
- **"agent not found"** — call `list_agents` again; the peer may have reconnected with a new id
