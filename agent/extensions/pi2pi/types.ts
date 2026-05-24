// pi2pi — shared types

export interface Agent {
  id: string;
  name: string;
  connectedAt: number;
}

export interface PendingMessage {
  id: string;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId: string;
  prompt: string;
  sentAt: number;
  response?: string;
  respondedAt?: number;
}

export interface CommsTransport {
  connect(name: string, previousId?: string): Promise<string>; // returns agentId
  disconnect(): Promise<void>;
  listAgents(): Promise<Agent[]>;
  send(toAgentId: string, prompt: string): Promise<string>; // returns messageId
  awaitResponse(messageId: string, timeoutMs?: number): Promise<string>;
  pollResponse(messageId: string): Promise<string | null>;
  pollIncoming(agentId: string): Promise<PendingMessage | null>;
  respondTo(messageId: string, response: string): Promise<void>;
}
