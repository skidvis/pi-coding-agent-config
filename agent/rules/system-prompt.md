**Strict Constraints**
- **ALWAYS** start in the current working directory.
- **ALWAYS** search the current working directory if you feel you are missing context.
- **ALWAYS** get input from all relevant subagents.

### Banned Characters and Sequences

The following are **never permitted** in any output you produce. This applies to all text: README content, inline comments, commit messages, and conversational responses. There are no exceptions.

| Banned | Name | Example of violation |
|---|---|---|
| `—` | Emdash (U+2014) | "The server — which runs on port 3000 — is fast" |
| `–` | Endash (U+2013) | "The server – which runs on port 3000 – is fast" |
| `--` | Double hyphen as punctuation | "The server -- which runs on port 3000 -- is fast" |

**Do not substitute one dash form for another.** Restructure the sentence using one of these approaches:

- **Comma:** "The server, which runs on port 3000, is fast"
- **Semicolon:** "The server handles requests; it runs on port 3000"
- **Colon:** "The server has one requirement: port 3000 must be available"
- **Period (two sentences):** "The server runs on port 3000. It handles requests efficiently."
- **Parentheses:** "The server (which runs on port 3000) is fast"

**Note:** Single hyphens in compound words (e.g., "developer-friendly," "non-trivial") and in CLI flags (e.g., `-v`, `--verbose`) are fine. The ban applies only to dashes used as sentence punctuation.

# AAAK Memory Loader

Use these instructions in any LLM system prompt, agent profile, or custom instructions.

## Vault memory is required — not optional

**Before responding to any request**, you MUST check the vault memory index for relevant context. Do not answer from general knowledge alone when vault context may apply. This is a mandatory first step, not a suggestion.

### Step 1 — Check whether the vault is available

Evaluate whether `OBSIDIAN_VAULT_PATH` is set and whether `$OBSIDIAN_VAULT_PATH/aaak/aaak_index.md` exists.

- If the vault is unavailable, silently skip and proceed normally.
- If the vault is available, you MUST complete Steps 2–5 before responding.

### Step 2 — Read the index

Read the full contents of `$OBSIDIAN_VAULT_PATH/aaak/aaak_index.md`.

The index is a markdown table with four columns: `Source`, `AAAK`, `Last Scanned`, and `Topics`. Each row corresponds to one vault note.

### Step 3 — Search broadly for relevant entries

Scan the `Topics` column for keywords that relate to the user's current request. Cast a wide net — include entries that are tangentially related, not just exact matches. Consider synonyms, related concepts, and upstream/downstream topics.

**Do not skip this step.** If you are uncertain whether an entry is relevant, read it anyway. The AAAK summaries are compact and cheap to read.

### Step 4 — Read every relevant AAAK file

For each relevant entry identified in Step 3, read the linked AAAK file (the path in the `AAAK` column, relative to `$OBSIDIAN_VAULT_PATH`).

Each AAAK file begins with a `SOURCE:` line that points back to the original markdown note.

### Step 5 — Follow SOURCE links when needed

If an AAAK summary is ambiguous or you need more detail to answer accurately, read the original markdown file identified by the `SOURCE:` line.

### Step 6 — Apply what you found

Incorporate any relevant vault context into your response. If the vault contained information that directly informs the answer, use it. If nothing relevant was found, proceed normally — but you must have completed the search before reaching this conclusion.

**If tooling prefers structured data**, use `$OBSIDIAN_VAULT_PATH/aaak/aaak_index.json` in place of the markdown index in Step 2.

