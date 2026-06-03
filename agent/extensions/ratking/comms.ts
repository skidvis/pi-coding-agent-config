// ratking — local transport (single device, file-based shared queue)
// All agents on the same machine share /tmp/ratking/ as a message store.

import type { Agent, CommsTransport, PendingMessage } from "./types.ts";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const STORE_DIR = "/tmp/ratking";
const AGENTS_FILE = join(STORE_DIR, "agents.json");
const MESSAGES_FILE = join(STORE_DIR, "messages.json");

function ensureStore() {
  if (!existsSync(STORE_DIR)) mkdirSync(STORE_DIR, { recursive: true });
  if (!existsSync(AGENTS_FILE)) writeFileSync(AGENTS_FILE, "[]", "utf8");
  if (!existsSync(MESSAGES_FILE)) writeFileSync(MESSAGES_FILE, "[]", "utf8");
}

function readAgents(): Agent[] {
  try { return JSON.parse(readFileSync(AGENTS_FILE, "utf8")); }
  catch { return []; }
}

function writeAgents(agents: Agent[]) {
  writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2), "utf8");
}

function readMessages(): PendingMessage[] {
  try { return JSON.parse(readFileSync(MESSAGES_FILE, "utf8")); }
  catch { return []; }
}

function writeMessages(msgs: PendingMessage[]) {
  writeFileSync(MESSAGES_FILE, JSON.stringify(msgs, null, 2), "utf8");
}

export function createLocalTransport(): CommsTransport {
  ensureStore();

  return {
    async connect(name: string, previousId?: string): Promise<string> {
      const agents = readAgents();
      // Only remove THIS agent's own previous entry (by id), never by name.
      // Removing by name would evict other agents that happen to share the same name.
      const filtered = previousId
        ? agents.filter((a) => a.id !== previousId)
        : agents;
      const id = randomUUID();
      filtered.push({ id, name, connectedAt: Date.now() });
      writeAgents(filtered);
      return id;
    },

    async disconnect(): Promise<void> {
      // Caller passes agentId via closure in index.ts — handled there
    },

    async listAgents(): Promise<Agent[]> {
      return readAgents();
    },

    async send(toAgentId: string, prompt: string): Promise<string> {
      const msgs = readMessages();
      const id = randomUUID();
      msgs.push({
        id,
        fromAgentId: "",   // filled in by index.ts
        fromAgentName: "", // filled in by index.ts
        toAgentId,
        prompt,
        sentAt: Date.now(),
      });
      writeMessages(msgs);
      return id;
    },

    async awaitResponse(messageId: string, timeoutMs = 60_000): Promise<string> {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const msgs = readMessages();
        const msg = msgs.find((m) => m.id === messageId);
        if (msg?.response !== undefined) return msg.response;
        await new Promise((r) => setTimeout(r, 500));
      }
      throw new Error(`ratking: timeout waiting for response to message ${messageId}`);
    },

    async pollResponse(messageId: string): Promise<string | null> {
      const msgs = readMessages();
      const msg = msgs.find((m) => m.id === messageId);
      return msg?.response ?? null;
    },

    async pollIncoming(agentId: string): Promise<PendingMessage | null> {
      const msgs = readMessages();
      const incoming = msgs.find((m) => m.toAgentId === agentId && m.response === undefined);
      return incoming ?? null;
    },

    async respondTo(messageId: string, response: string): Promise<void> {
      const msgs = readMessages();
      const msg = msgs.find((m) => m.id === messageId);
      if (msg) {
        msg.response = response;
        msg.respondedAt = Date.now();
        writeMessages(msgs);
      }
    },
  };
}

// Helper used by index.ts to patch sender fields after connect()
export function patchSenderFields(
  messageId: string,
  fromAgentId: string,
  fromAgentName: string
) {
  const msgs = readMessages();
  const msg = msgs.find((m) => m.id === messageId);
  if (msg) {
    msg.fromAgentId = fromAgentId;
    msg.fromAgentName = fromAgentName;
    writeMessages(msgs);
  }
}

export function removeAgent(agentId: string) {
  const agents = readAgents().filter((a) => a.id !== agentId);
  writeAgents(agents);
  // Clean up messages to/from this agent that are unresponded
  const msgs = readMessages().filter(
    (m) =>
      !(m.toAgentId === agentId && m.response === undefined) &&
      !(m.fromAgentId === agentId && m.response === undefined)
  );
  writeMessages(msgs);
}
