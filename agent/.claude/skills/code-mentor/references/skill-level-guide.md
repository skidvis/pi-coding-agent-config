# Skill Level Calibration Guide

Use this reference when generating any artifact to calibrate depth and explanation style to the developer's experience level.

## The Four Levels

### Beginner

The developer is new to this stack, language, or programming in general. They need concepts explained from first principles. They may not know what questions to ask, so you need to anticipate their gaps.

**What to include:**

- Every non-obvious "why" — assume nothing is obvious
- Analogies for abstract concepts ("a JWT is like a signed permission slip")
- Fully annotated code examples (comment every meaningful line)
- Explicit terminal commands, including how to open a terminal
- Install links for every tool
- Verbose verification steps ("you should see exactly this output in your terminal")
- Recovery instructions for every common error
- Definitions for technical terms the first time they appear
- A "prerequisites" section that explains what they need to already know

**What to avoid:**

- "Just" (as in "just run `npm install`") — nothing is "just" to a beginner
- Unexplained acronyms
- Steps that combine multiple distinct actions
- "Obviously" or "clearly"

**Tone**: Patient, encouraging, thorough. Like explaining to a smart friend who's new to this.

---

### Intermediate

The developer has shipped projects before, knows the basics, but hits walls on harder problems. They understand foundational concepts and don't need analogies for standard patterns, but benefit from explanation for non-obvious choices and edge cases.

**What to include:**

- Brief rationale for architectural or pattern decisions
- Code examples with comments on the non-obvious parts
- Notable gotchas and common mistakes
- Verification steps (explicit, but concise)
- Prerequisites that are specific or non-standard
- Pointers to documentation for deeper exploration

**What to avoid:**

- Over-explaining standard patterns ("here's how a for loop works")
- Extremely verbose background sections for well-known concepts
- Skipping rationale for non-obvious decisions

**Tone**: Collegial, efficient. Like pair programming with a more experienced developer who respects your time.

---

### Senior

The developer has strong fundamentals and a track record. They want a clear roadmap and concise steps without hand-holding. They can look things up; they need direction.

**What to include:**

- Architectural decisions and rationale (they care about the "why" at a design level)
- Code with inline comments for project-specific patterns only
- Edge cases and gotchas they may not have encountered in this specific context
- Concise verification
- References to documentation (no need to explain what the docs say)

**What to avoid:**

- Explaining standard patterns, libraries, or concepts
- Step-by-step for things they can clearly figure out
- Verbose background sections on known topics
- Condescending explanations

**Tone**: Peer to peer. Concise, architectural, trusting.

---

### Mixed

The developer is strong in some areas and weaker in others. Treat this as: "senior in X, intermediate/beginner in Y."

**Approach:**

- Identify which technologies/concepts are familiar vs. new
- Apply senior-level treatment to familiar areas
- Apply beginner or intermediate treatment to unfamiliar areas
- Clearly label when you're going deeper: "Since you mentioned you're new to Postgres, a bit of background here:"

---

## Calibration Quick Reference

| Element | Beginner | Intermediate | Senior |
|---------|----------|--------------|--------|
| Concept explanations | Full with analogies | Brief, with pointers | Omit or 1 sentence |
| Code annotations | Line-by-line | Key/surprising lines | Project-specific only |
| "Why" rationale | Always | Non-obvious choices | Architecture only |
| Verification steps | Verbose with expected output | Explicit, concise | One line |
| Common problems | 5-8 issues | 3-5 issues | 1-3 edge cases |
| Prerequisites | Exhaustive with links | Key ones | Assumed |
| Background sections | 2-4 paragraphs with analogies | 1-2 focused paragraphs | "See also:" link only |
| Step granularity | Maximum granularity | Logical sub-steps | High-level steps |
| Tone | Patient, encouraging | Collegial, efficient | Peer to peer |

## Phrasing Examples by Level

**Beginner:**
> Before we can write any code, we need to install Node.js — the runtime that lets you run JavaScript outside of a browser. Head to [nodejs.org](https://nodejs.org) and download the LTS version. Once installed, you can verify it worked by running `node --version` in your terminal. You should see something like `v20.11.0`.

**Intermediate:**
> Install Node.js LTS if you haven't already (`node --version` to check). We'll need v18+.

**Senior:**
> Requires Node 18+.

---

## When the Developer Says "Mixed"

Ask a follow-up to understand the split:

```
Question: "Where are you most confident vs. least confident in this project?"
Options:
- "Strong on frontend, weak on backend/databases"
- "Strong on backend, weak on frontend/UI"
- "Comfortable with the language, unfamiliar with the framework"
- "Know the framework, unfamiliar with the domain (auth, payments, etc.)"
```

Use the answer to calibrate per-section rather than globally.
