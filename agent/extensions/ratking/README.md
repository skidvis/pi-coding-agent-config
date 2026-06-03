# ratking

`ratking` is a Pi coding agent extension that lets multiple Pi sessions communicate with each other. Agents join a shared communication pool, list peers, send prompts to other agents, and wait for replies.

The extension supports two transports:

- `local`: same-machine communication through a file-backed store in `/tmp/ratking`.
- `net`: cross-device communication through an HTTP broker.

## Behavior

The extension autojoins the communication pool when a Pi session starts. You do not need to run a command before the LLM tools can use the pool.

Agent names are assigned automatically:

- The first joined agent is named `Pinky`.
- The second joined agent is named `Brain`.
- Additional agents use famous rat names before generic names: `Remy`, `Splinter`, `Rizzo`, `Ratty`, `Templeton`, `Rattrap`, `Nicodemus`, and `SilasGreenback`.
- After those names are used, additional agents are named `agent-11`, `agent-12`, and so on.

Manual agent naming is intentionally disabled so agent names always follow this sequence.

## Installation

Place this directory in one of Pi's extension locations, for example:

```text
~/.pi/agent/extensions/ratking/
```

The extension entry point is `index.ts`, and `package.json` declares it under `pi.extensions`.

## Usage

Start Pi normally for same-machine communication:

```sh
pi
```

On startup, the extension connects automatically and shows the connected agent name in the Pi status UI.

### Slash Command

The extension registers the `/rats` command.

List connected agents:

```text
/rats
```

Disconnect this session from the pool:

```text
/rats disconnect
```

Ping another connected agent by ID:

```text
/rats ping <agentId>
```

Agent IDs are shown by `/rats` and by the `list_agents` tool.

## Network Mode

Use network mode when agents are running on different devices and can reach the same ratking HTTP broker:

```sh
pi --comms-mode net --comms-server http://HOST:4242
```

Replace `HOST` with the host or IP address running the broker.

The extension does not start the broker itself. The broker must already be available at the configured `--comms-server` URL.

## LLM Tools

The extension also registers tools that the Pi agent can call:

- `list_agents`: returns connected agent IDs, names, and connection timestamps.
- `send_to_agent`: sends a prompt to a target agent and returns a message ID.
- `await_response`: waits for a response to a previously sent message.
- `poll_response`: checks whether a response is ready without blocking.

A typical flow is:

1. Call `list_agents` to find the target peer.
2. Call `send_to_agent` with the peer's `agentId` and a prompt.
3. Call `await_response` with the returned `messageId`, or use `poll_response` for non-blocking checks.

## Notes

- Local transport stores state under `/tmp/ratking`.
- The extension removes this session's agent entry on shutdown.
- Incoming peer messages are delivered to the local Pi agent as follow-up user messages, and the assistant's response is sent back to the peer.
