// pi2pi — network transport (cross-device, HTTP broker)
// Connects to the pi2pi-server running on any reachable host.

import type { Agent, CommsTransport, PendingMessage } from "./types.ts";

export function createNetTransport(serverUrl: string): CommsTransport {
  const base = serverUrl.replace(/\/$/, "");

  async function req<T>(
    method: string,
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`pi2pi server error ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  return {
    async connect(name: string, _previousId?: string): Promise<string> {
      const { agentId } = await req<{ agentId: string }>("POST", "/connect", { name });
      return agentId;
    },

    async disconnect(): Promise<void> {
      // handled in index.ts with the stored agentId
    },

    async listAgents(): Promise<Agent[]> {
      return req<Agent[]>("GET", "/agents");
    },

    async send(toAgentId: string, prompt: string): Promise<string> {
      const { messageId } = await req<{ messageId: string }>("POST", "/send", {
        toAgentId,
        prompt,
      });
      return messageId;
    },

    async awaitResponse(
      messageId: string,
      timeoutMs = 60_000,
    ): Promise<string> {
      const { response } = await req<{ response: string }>(
        "GET",
        `/await/${messageId}?timeout=${timeoutMs}`
      );
      return response;
    },

    async pollResponse(messageId: string): Promise<string | null> {
      const { ready, response } = await req<{ ready: boolean; response?: string }>(
        "GET",
        `/poll/${messageId}`
      );
      return ready ? (response ?? null) : null;
    },

    async pollIncoming(agentId: string): Promise<PendingMessage | null> {
      const { message } = await req<{ message: PendingMessage | null }>(
        "GET",
        `/incoming/${agentId}`
      );
      return message;
    },

    async respondTo(messageId: string, response: string): Promise<void> {
      await req("POST", "/respond", { messageId, response });
    },
  };
}

export async function netDisconnect(serverUrl: string, agentId: string) {
  const base = serverUrl.replace(/\/$/, "");
  await fetch(`${base}/connect`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId }),
  }).catch(() => {});
}
