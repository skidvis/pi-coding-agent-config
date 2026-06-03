// ratking — Pi coding agent extension
// Bidirectional peer-to-peer agent communication.
//
// Install: copy this directory to ~/.pi/agent/extensions/ratking/
// Usage:
//   Local (same machine):  pi
//   Network (cross-device): pi --comms-mode net --comms-server http://HOST:4242
//   List peers:             /rats
//   Disconnect:             /rats disconnect

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { createLocalTransport, patchSenderFields, removeAgent } from "./comms.ts";
import { createNetTransport, netDisconnect } from "./comms-net.ts";
import type { CommsTransport, PendingMessage } from "./types.ts";

// ─── State ────────────────────────────────────────────────────────────────────

let transport: CommsTransport | null = null;
let agentId: string | null = null;
let agentName: string = "Pinky";
let commsMode: "local" | "net" = "local";
let serverUrl: string = "http://localhost:4242";

// Incoming message currently being processed by this agent's LLM
let pendingIncoming: PendingMessage | null = null;
// Resolve function waiting for the LLM to finish responding to pendingIncoming
let pendingResponseResolve: ((text: string) => void) | null = null;

// Poll interval handle
let pollHandle: ReturnType<typeof setInterval> | null = null;

const AGENT_NAMES = [
  "Pinky",
  "Brain",
  "Remy",
  "Splinter",
  "Rizzo",
  "Ratty",
  "Templeton",
  "Rattrap",
  "Nicodemus",
  "SilasGreenback",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractAssistantText(messages: unknown[]): string {
  // Walk message array in reverse to find last assistant text
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i] as { role?: string; content?: unknown };
    if (m?.role === "assistant") {
      const c = m.content;
      if (typeof c === "string") return c;
      if (Array.isArray(c)) {
        return c
          .filter((b: { type?: string; text?: string }) => b?.type === "text")
          .map((b: { text?: string }) => b?.text ?? "")
          .join("\n")
          .trim();
      }
    }
  }
  return "";
}

function selectAgentName(existingCount: number): string {
  const name = AGENT_NAMES[existingCount];
  if (name) return name;
  return `agent-${existingCount + 1}`;
}

// ─── Extension factory ────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // ── Flags ──────────────────────────────────────────────────────────────────

  pi.registerFlag("comms-mode", {
    description: "ratking transport: 'local' (same machine) or 'net' (HTTP broker)",
    type: "string",
    default: "local",
  });

  pi.registerFlag("comms-server", {
    description: "Broker URL for net mode (e.g. http://mac-mini.local:4242)",
    type: "string",
    default: "http://localhost:4242",
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  pi.on("session_start", async (_event, ctx) => {
    commsMode = (pi.getFlag("comms-mode") as "local" | "net") ?? "local";
    serverUrl = (pi.getFlag("comms-server") as string) ?? "http://localhost:4242";

    transport = commsMode === "net"
      ? createNetTransport(serverUrl)
      : createLocalTransport();

    try {
      const existingAgents = await transport.listAgents();
      agentName = selectAgentName(existingAgents.length);
      agentId = await transport.connect(agentName);
      pi.setSessionName(`ratking:${agentName}`);
      ctx.ui.setStatus(
        "ratking",
        `ratking: ${agentName} [${commsMode}] ✓ connected (id: ${agentId.slice(0, 8)})`
      );
      ctx.ui.notify(
        `ratking: autojoined as "${agentName}" (id: ${agentId})`,
        "info"
      );
      startPolling(ctx as Parameters<typeof startPolling>[0]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      ctx.ui.setStatus("ratking", `ratking: ${agentName} [${commsMode}] (not connected)`);
      ctx.ui.notify(`ratking: autojoin failed: ${message}`, "warning");
    }
  });

  pi.on("session_shutdown", async (_event, _ctx) => {
    stopPolling();
    if (agentId) {
      if (commsMode === "net") {
        await netDisconnect(serverUrl, agentId);
      } else {
        removeAgent(agentId);
      }
      agentId = null;
    }
  });

  // Capture LLM response when processing an incoming peer message
  pi.on("agent_end", async (event, _ctx) => {
    if (pendingResponseResolve && pendingIncoming) {
      const text = extractAssistantText(
        (event as { messages?: unknown[] }).messages ?? []
      );
      pendingResponseResolve(text || "(no response)");
      pendingResponseResolve = null;
      pendingIncoming = null;
    }
  });

  // ── Polling ────────────────────────────────────────────────────────────────

  function startPolling(ctx: { ui: { notify: (msg: string, level: string) => void }; isIdle: () => boolean }) {
    if (pollHandle) return;
    pollHandle = setInterval(async () => {
      if (!transport || !agentId) return;
      // Don't interrupt the agent while it's already responding
      if (!ctx.isIdle() || pendingIncoming) return;

      try {
        const msg = await transport.pollIncoming(agentId);
        if (!msg) return;

        pendingIncoming = msg;
        ctx.ui.notify(
          `ratking: message from [${msg.fromAgentName}]: ${msg.prompt.slice(0, 60)}${msg.prompt.length > 60 ? "…" : ""}`,
          "info"
        );

        // Feed the incoming prompt to the LLM, capture the reply
        const reply = await new Promise<string>((resolve) => {
          pendingResponseResolve = resolve;
          pi.sendUserMessage(
            `[ratking message from peer "${msg.fromAgentName}"]\n${msg.prompt}`,
            { deliverAs: "followUp" }
          );
        });

        await transport.respondTo(msg.id, reply);
      } catch (err) {
        // Silently swallow poll errors — network hiccup, etc.
        const message = err instanceof Error ? err.message : String(err);
        if (!message.includes("timeout")) {
          ctx.ui.notify(`ratking poll error: ${message}`, "warning");
        }
      }
    }, 2000);
  }

  function stopPolling() {
    if (pollHandle) {
      clearInterval(pollHandle);
      pollHandle = null;
    }
  }

  // ── /rats command ──────────────────────────────────────────────────────────

  pi.registerCommand("rats", {
    description: "ratking pool control. Usage: /rats [N] | disconnect | ping <agentId>",
    handler: async (args, ctx) => {
      const argv = (args ?? "").trim().split(/\s+/).filter(Boolean);

      // /rats disconnect
      if (argv[0] === "disconnect") {
        stopPolling();
        if (agentId) {
          if (commsMode === "net") await netDisconnect(serverUrl, agentId);
          else removeAgent(agentId);
          agentId = null;
          ctx.ui.setStatus("ratking", `ratking: ${agentName} [${commsMode}] (not connected)`);
          ctx.ui.notify("ratking: disconnected from pool", "info");
        } else {
          ctx.ui.notify("ratking: not connected", "warning");
        }
        return;
      }

      // /rats ping <agentId>
      if (argv[0] === "ping" && argv[1]) {
        if (!transport || !agentId) {
          ctx.ui.notify("ratking: not connected — run /rats first", "warning");
          return;
        }
        const msgId = await transport.send(argv[1], "ping");
        // Patch sender fields for local transport
        if (commsMode === "local") {
          patchSenderFields(msgId, agentId, agentName);
        }
        ctx.ui.notify(`ratking: ping sent (msgId: ${msgId.slice(0, 8)})`, "info");
        try {
          const reply = await transport.awaitResponse(msgId, 10_000);
          ctx.ui.notify(`ratking: pong from peer: ${reply.slice(0, 80)}`, "info");
        } catch {
          ctx.ui.notify("ratking: ping timeout — peer may not be listening", "warning");
        }
        return;
      }

      // /rats or /rats <N> — connect / list
      if (!transport) {
        ctx.ui.notify("ratking: transport not initialised — reload pi", "error");
        return;
      }

      if (!agentId) {
        const existingAgents = await transport.listAgents();
        agentName = selectAgentName(existingAgents.length);
        agentId = await transport.connect(agentName);
        pi.setSessionName(`ratking:${agentName}`);
        ctx.ui.setStatus(
          "ratking",
          `ratking: ${agentName} [${commsMode}] ✓ connected (id: ${agentId.slice(0, 8)})`
        );
        ctx.ui.notify(
          `ratking: connected as "${agentName}" (id: ${agentId})`,
          "info"
        );
        startPolling(ctx as Parameters<typeof startPolling>[0]);
      }

      const agents = await transport.listAgents();
      if (agents.length === 0) {
        ctx.ui.notify("ratking: no agents in pool (you are alone)", "info");
      } else {
        const lines = agents.map(
          (a) =>
            `  ${a.name}${a.id === agentId ? " (you)" : ""} — id: ${a.id.slice(0, 8)}`
        );
        ctx.ui.notify(
          `ratking: ${agents.length} agent(s) in pool:\n${lines.join("\n")}`,
          "info"
        );
      }
    },
  });

  // ── Custom LLM-callable tools ───────────────────────────────────────────────

  pi.registerTool({
    name: "list_agents",
    label: "List ratking Agents",
    description:
      "List all agents currently connected to the ratking communication pool. Returns each agent's id, name, and connection timestamp.",
    promptSnippet: "List peers in the ratking communication pool",
    promptGuidelines: [
      "Use list_agents before send_to_agent to confirm the target peer is online and to retrieve their id.",
    ],
    parameters: Type.Object({}),

    async execute(_id, _params, _signal, _onUpdate, _ctx) {
      if (!transport || !agentId) {
        throw new Error(
          "ratking: not connected to pool. Ask the user to run /rats first."
        );
      }
      const agents = await transport.listAgents();
      const rows = agents.map((a) => ({
        id: a.id,
        name: a.name,
        isMe: a.id === agentId,
        connectedAt: new Date(a.connectedAt).toISOString(),
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
        details: { agents: rows },
      };
    },
  });

  pi.registerTool({
    name: "send_to_agent",
    label: "Send to Peer Agent",
    description:
      "Send a prompt to a peer agent in the ratking pool. Returns a messageId immediately — the peer agent will process the prompt autonomously. Follow up with await_response to get their reply.",
    promptSnippet: "Send a prompt to a peer ratking agent and get a messageId back",
    promptGuidelines: [
      "Use send_to_agent to ask a peer agent a question or delegate a task. Always call list_agents first to get the peer's id. Save the returned messageId to pass to await_response.",
      "Never include raw PII in a send_to_agent prompt — instruct the peer to strip or redact sensitive data before returning it.",
    ],
    parameters: Type.Object({
      toAgentId: Type.String({ description: "The target agent's id (from list_agents)" }),
      prompt: Type.String({ description: "The prompt or question to send to the peer agent" }),
    }),

    async execute(_id, params, _signal, _onUpdate, _ctx) {
      if (!transport || !agentId) {
        throw new Error(
          "ratking: not connected to pool. Ask the user to run /rats first."
        );
      }
      const agents = await transport.listAgents();
      const target = agents.find((a) => a.id === params.toAgentId);
      if (!target) {
        throw new Error(
          `ratking: agent ${params.toAgentId} not found in pool. Call list_agents to check.`
        );
      }

      const msgId = await transport.send(params.toAgentId, params.prompt);
      // Patch sender metadata (local transport stores blank sender until here)
      if (commsMode === "local") {
        patchSenderFields(msgId, agentId, agentName);
      }

      return {
        content: [
          {
            type: "text",
            text: `Message sent to "${target.name}" (messageId: ${msgId}). Call await_response with this messageId to get their reply.`,
          },
        ],
        details: { messageId: msgId, toAgent: target.name },
      };
    },
  });

  pi.registerTool({
    name: "await_response",
    label: "Await Peer Response",
    description:
      "Wait for a peer agent to respond to a previously sent message. Blocks until the response arrives or the timeout elapses. Use poll_response for non-blocking checks.",
    promptSnippet: "Wait (blocking) for a peer agent's response to a sent message",
    promptGuidelines: [
      "Use await_response after send_to_agent. Pass the messageId returned by send_to_agent. Default timeout is 60 seconds — increase for slow tasks.",
    ],
    parameters: Type.Object({
      messageId: Type.String({ description: "The messageId returned by send_to_agent" }),
      timeoutMs: Type.Optional(
        Type.Number({ description: "How long to wait in milliseconds (default 60000)" })
      ),
    }),

    async execute(_id, params, signal, _onUpdate, _ctx) {
      if (!transport) {
        throw new Error("ratking: not connected to pool.");
      }
      // Respect abort signal via a race
      const timeout = params.timeoutMs ?? 60_000;
      const responsePromise = transport.awaitResponse(params.messageId, timeout);

      if (signal) {
        return Promise.race([
          responsePromise.then((text) => ({
            content: [{ type: "text", text }],
            details: { response: text, messageId: params.messageId },
          })),
          new Promise<never>((_, reject) => {
            signal.addEventListener("abort", () =>
              reject(new Error("ratking: await_response aborted"))
            );
          }),
        ]);
      }

      const text = await responsePromise;
      return {
        content: [{ type: "text", text }],
        details: { response: text, messageId: params.messageId },
      };
    },
  });

  pi.registerTool({
    name: "poll_response",
    label: "Poll Peer Response",
    description:
      "Check non-blocking whether a peer agent has responded to a sent message. Returns the response if ready, or null if still pending. Use await_response to block instead.",
    promptSnippet: "Non-blocking check for a peer agent's response",
    parameters: Type.Object({
      messageId: Type.String({ description: "The messageId returned by send_to_agent" }),
    }),

    async execute(_id, params, _signal, _onUpdate, _ctx) {
      if (!transport) {
        throw new Error("ratking: not connected to pool.");
      }
      const response = await transport.pollResponse(params.messageId);
      if (response === null) {
        return {
          content: [{ type: "text", text: "Response not ready yet." }],
          details: { ready: false, messageId: params.messageId },
        };
      }
      return {
        content: [{ type: "text", text: response }],
        details: { ready: true, response, messageId: params.messageId },
      };
    },
  });
}
