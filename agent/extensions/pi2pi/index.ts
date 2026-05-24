// pi2pi — Pi coding agent extension
// Bidirectional peer-to-peer agent communication.
//
// Install: copy this directory to ~/.pi/agent/extensions/pi2pi/
// Usage:
//   Local (same machine):  pi
//   Network (cross-device): pi --comms-mode net --comms-server http://HOST:4242
//   Name this agent:        /jcoms name prod
//   List peers:             /jcoms
//   Disconnect:             /jcoms disconnect

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { createLocalTransport, patchSenderFields, removeAgent } from "./comms.ts";
import { createNetTransport, netDisconnect } from "./comms-net.ts";
import type { CommsTransport, PendingMessage } from "./types.ts";

// ─── State ────────────────────────────────────────────────────────────────────

let transport: CommsTransport | null = null;
let agentId: string | null = null;
let agentName: string = "agent";
let commsMode: "local" | "net" = "local";
let serverUrl: string = "http://localhost:4242";

// Incoming message currently being processed by this agent's LLM
let pendingIncoming: PendingMessage | null = null;
// Resolve function waiting for the LLM to finish responding to pendingIncoming
let pendingResponseResolve: ((text: string) => void) | null = null;

// Poll interval handle
let pollHandle: ReturnType<typeof setInterval> | null = null;

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

// ─── Extension factory ────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // ── Flags ──────────────────────────────────────────────────────────────────

  pi.registerFlag("comms-mode", {
    description: "pi2pi transport: 'local' (same machine) or 'net' (HTTP broker)",
    type: "string",
    default: "local",
  });

  pi.registerFlag("comms-server", {
    description: "Broker URL for net mode (e.g. http://mac-mini.local:4242)",
    type: "string",
    default: "http://localhost:4242",
  });

  pi.registerFlag("comms-name", {
    description: "Agent display name for the pi2pi pool",
    type: "string",
    default: "",
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  pi.on("session_start", async (_event, ctx) => {
    commsMode = (pi.getFlag("comms-mode") as "local" | "net") ?? "local";
    serverUrl = (pi.getFlag("comms-server") as string) ?? "http://localhost:4242";
    const flagName = (pi.getFlag("comms-name") as string) ?? "";

    // Restore name from persisted session entries
    for (const entry of ctx.sessionManager.getEntries()) {
      if (
        entry.type === "custom" &&
        (entry as { customType?: string }).customType === "pi2pi-state"
      ) {
        const data = (entry as { data?: { name?: string } }).data;
        if (data?.name) agentName = data.name;
      }
    }
    if (flagName) agentName = flagName;

    transport = commsMode === "net"
      ? createNetTransport(serverUrl)
      : createLocalTransport();

    ctx.ui.setStatus("pi2pi", `pi2pi: ${agentName} [${commsMode}] (not connected)`);
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
          `pi2pi: message from [${msg.fromAgentName}]: ${msg.prompt.slice(0, 60)}${msg.prompt.length > 60 ? "…" : ""}`,
          "info"
        );

        // Feed the incoming prompt to the LLM, capture the reply
        const reply = await new Promise<string>((resolve) => {
          pendingResponseResolve = resolve;
          pi.sendUserMessage(
            `[pi2pi message from peer "${msg.fromAgentName}"]\n${msg.prompt}`,
            { deliverAs: "followUp" }
          );
        });

        await transport.respondTo(msg.id, reply);
      } catch (err) {
        // Silently swallow poll errors — network hiccup, etc.
        const message = err instanceof Error ? err.message : String(err);
        if (!message.includes("timeout")) {
          ctx.ui.notify(`pi2pi poll error: ${message}`, "warning");
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

  // ── /jcoms command ─────────────────────────────────────────────────────────

  pi.registerCommand("jcoms", {
    description: "pi2pi pool control. Usage: /jcoms [N] | name <label> | disconnect | ping <agentId>",
    handler: async (args, ctx) => {
      const argv = (args ?? "").trim().split(/\s+/).filter(Boolean);

      // /jcoms disconnect
      if (argv[0] === "disconnect") {
        stopPolling();
        if (agentId) {
          if (commsMode === "net") await netDisconnect(serverUrl, agentId);
          else removeAgent(agentId);
          agentId = null;
          ctx.ui.setStatus("pi2pi", `pi2pi: ${agentName} [${commsMode}] (not connected)`);
          ctx.ui.notify("pi2pi: disconnected from pool", "info");
        } else {
          ctx.ui.notify("pi2pi: not connected", "warning");
        }
        return;
      }

      // /jcoms name <label>
      if (argv[0] === "name" && argv[1]) {
        agentName = argv.slice(1).join(" ");
        pi.appendEntry("pi2pi-state", { name: agentName });
        pi.setSessionName(`pi2pi:${agentName}`);
        ctx.ui.notify(`pi2pi: agent name set to "${agentName}"`, "info");
        // Reconnect with new name if already connected
        if (agentId && transport) {
          const oldId = agentId;
          if (commsMode === "net") await netDisconnect(serverUrl, oldId);
          else removeAgent(oldId);
          agentId = await transport.connect(agentName, oldId);
          ctx.ui.setStatus("pi2pi", `pi2pi: ${agentName} [${commsMode}] ✓ connected (id: ${agentId.slice(0, 8)})`);
        }
        return;
      }

      // /jcoms ping <agentId>
      if (argv[0] === "ping" && argv[1]) {
        if (!transport || !agentId) {
          ctx.ui.notify("pi2pi: not connected — run /jcoms first", "warning");
          return;
        }
        const msgId = await transport.send(argv[1], "ping");
        // Patch sender fields for local transport
        if (commsMode === "local") {
          patchSenderFields(msgId, agentId, agentName);
        }
        ctx.ui.notify(`pi2pi: ping sent (msgId: ${msgId.slice(0, 8)})`, "info");
        try {
          const reply = await transport.awaitResponse(msgId, 10_000);
          ctx.ui.notify(`pi2pi: pong from peer: ${reply.slice(0, 80)}`, "info");
        } catch {
          ctx.ui.notify("pi2pi: ping timeout — peer may not be listening", "warning");
        }
        return;
      }

      // /jcoms or /jcoms <N> — connect / list
      if (!transport) {
        ctx.ui.notify("pi2pi: transport not initialised — reload pi", "error");
        return;
      }

      if (!agentId) {
        agentId = await transport.connect(agentName);
        pi.setSessionName(`pi2pi:${agentName}`);
        ctx.ui.setStatus(
          "pi2pi",
          `pi2pi: ${agentName} [${commsMode}] ✓ connected (id: ${agentId.slice(0, 8)})`
        );
        ctx.ui.notify(
          `pi2pi: connected as "${agentName}" (id: ${agentId})`,
          "info"
        );
        startPolling(ctx as Parameters<typeof startPolling>[0]);
      }

      const agents = await transport.listAgents();
      if (agents.length === 0) {
        ctx.ui.notify("pi2pi: no agents in pool (you are alone)", "info");
      } else {
        const lines = agents.map(
          (a) =>
            `  ${a.name}${a.id === agentId ? " (you)" : ""} — id: ${a.id.slice(0, 8)}`
        );
        ctx.ui.notify(
          `pi2pi: ${agents.length} agent(s) in pool:\n${lines.join("\n")}`,
          "info"
        );
      }
    },
  });

  // ── Custom LLM-callable tools ───────────────────────────────────────────────

  pi.registerTool({
    name: "list_agents",
    label: "List Pi2Pi Agents",
    description:
      "List all agents currently connected to the pi2pi communication pool. Returns each agent's id, name, and connection timestamp.",
    promptSnippet: "List peers in the pi2pi communication pool",
    promptGuidelines: [
      "Use list_agents before send_to_agent to confirm the target peer is online and to retrieve their id.",
    ],
    parameters: Type.Object({}),

    async execute(_id, _params, _signal, _onUpdate, _ctx) {
      if (!transport || !agentId) {
        throw new Error(
          "pi2pi: not connected to pool. Ask the user to run /jcoms first."
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
      "Send a prompt to a peer agent in the pi2pi pool. Returns a messageId immediately — the peer agent will process the prompt autonomously. Follow up with await_response to get their reply.",
    promptSnippet: "Send a prompt to a peer pi2pi agent and get a messageId back",
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
          "pi2pi: not connected to pool. Ask the user to run /jcoms first."
        );
      }
      const agents = await transport.listAgents();
      const target = agents.find((a) => a.id === params.toAgentId);
      if (!target) {
        throw new Error(
          `pi2pi: agent ${params.toAgentId} not found in pool. Call list_agents to check.`
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
        throw new Error("pi2pi: not connected to pool.");
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
              reject(new Error("pi2pi: await_response aborted"))
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
        throw new Error("pi2pi: not connected to pool.");
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
