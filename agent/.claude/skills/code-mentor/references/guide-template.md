# Guide Template

Use this template when generating `guide-phase-{n}.md` for each implementation phase (or `guide.md` for single-phase projects).

**Important**: Adjust depth of every section based on the developer's skill level captured during Phase 2 of the workflow. Beginner guides explain fundamentals with analogies; senior guides are concise roadmaps. The template shows the full structure — trim or expand sections based on who's reading.

---

# {Project Name} — {Phase N: Phase Title | Your Build Guide}

**Contract**: ./contract.md
**Phase**: {N of total | Single phase}
**Estimated time**: {30 min | 2-3 hours | A full day | etc.}
**Difficulty**: {Beginner | Intermediate | Advanced}

## What You're Building in This Phase

{2-3 sentences describing what this phase accomplishes and what the project will look like when this phase is done. Be concrete — tell them what they'll be able to see, run, or interact with.}

**At the end of this phase, you'll have:**

- {Concrete deliverable 1}
- {Concrete deliverable 2}
- {Concrete deliverable 3}

## What You'll Learn

{List the specific concepts or skills this phase teaches. Calibrate to skill level — beginners get more, seniors get just the novel concepts.}

- {Concept/skill 1}
- {Concept/skill 2}
- {Concept/skill 3}

## Prerequisites

{What the developer needs before starting this phase. Be exhaustive for beginners, high-level for seniors.}

**Tools and software:**

- {Tool 1 — with install link if relevant for beginners}
- {Tool 2}

**Knowledge:**

- {What they need to already know — "basic JavaScript" or "comfortable with React hooks"}
- {Intermediate/senior: note any less-obvious prerequisites}

**From previous phases (if applicable):**

- {What must be done from Phase N-1}

---

## Background: {Key Concept}

{Include 1-3 background sections for non-obvious concepts the developer needs to understand before they can follow the steps. Calibrate heavily to skill level.

For **beginners**: Write 2-4 paragraphs with an analogy. Explain what the concept is, why it exists, and how it fits into the project.

For **intermediate**: 1-2 paragraphs on the concept, focusing on what's specific to this project context.

For **seniors**: Either omit entirely (add a "See also:" reference link instead) or keep to 1 brief paragraph for architectural decisions only.}

**Example (for a guide about JWT authentication):**

> A JWT (JSON Web Token) is how the server proves to your frontend that a user is logged in — without having to re-check the database on every request. Think of it like a signed permission slip: the server issues it when you log in, and your browser presents it with every future request to prove it's you.

---

## Steps

Work through these steps in order. Each step includes a verification so you know it worked before moving on.

---

### Step 1: {Step Title}

**Why**: {1-2 sentences explaining why this step exists. Beginners always get this; seniors only get it for non-obvious choices.}

{Instruction text. For beginners, be explicit — "Open a terminal, navigate to your project folder, and run:". For seniors, be direct — "Initialize the Prisma schema:".}

```{language}
{command or code block}
```

{If code: annotate key lines for beginners. Example: "The `-y` flag accepts all defaults so you don't need to answer prompts."}

**Verify**: {Tell the developer exactly what they should see, hear, or be able to do to confirm this step worked.}

> Example: Run `ls` and you should see a new `node_modules/` folder. If you see `npm ERR!`, check the troubleshooting section below.

---

### Step 2: {Step Title}

**Why**: {Rationale if non-obvious}

{Instructions}

```{language}
{code}
```

{Annotation if needed}

**Verify**: {How to confirm it worked}

---

### Step 3: {Step Title}

{Continue the same structure for every meaningful step. Don't collapse multiple distinct actions into one step — if a developer can get stuck between two actions, they're separate steps.}

---

## Common Problems

{A list of the most likely things to go wrong in this phase, and how to fix them. This section dramatically reduces frustration. Include 3-6 issues calibrated to what the developer's skill level would typically stumble on.}

**"{Error message or symptom}"**

*Why this happens:* {1-2 sentences}
*Fix:* {What to do}

---

**"{Another error or symptom}"**

*Why this happens:* {1-2 sentences}
*Fix:* {What to do}

---

## Checkpoint

Before moving on, confirm you can check off all of these:

- [ ] {Checkpoint 1 — something they can verify right now}
- [ ] {Checkpoint 2}
- [ ] {Checkpoint 3 — if multi-phase: "Your project runs without errors"}

If any of these aren't true, re-read the relevant steps or check Common Problems above.

---

## What's Next

{1-2 sentences describing what Phase N+1 covers, or — if this is the last phase — what they've built and what they might do with it next.}

{Optional for beginners and intermediates: a 1-paragraph "dig deeper" note pointing to concepts they might want to explore further after completing this phase.}

---

## Template Usage Notes

When filling this template:

1. **Steps should be atomic.** If a developer can get stuck between two actions within a step, split it into two steps. Erring toward more steps is better than ambiguous compound steps.

2. **Verification after every significant step.** Not every `mkdir` needs verification, but every "your code should now work" moment does. Make it dead obvious what to run or look for.

3. **Common Problems is not optional.** You know what goes wrong. Put it here. This section is what separates a frustrating tutorial from a great one.

4. **Calibrate annotations.** For beginners, annotate every code block. For seniors, annotate only the surprising or project-specific parts. For seniors, you can use code with comments instead of annotations below the block.

5. **Background sections are for concepts, not steps.** If you're explaining how to do something, that's a step. If you're explaining what something *is* so the developer can follow the steps intelligently, that's a background section.

6. **Checkpoint should be strict.** If the developer can't tick every item, they're not ready for the next phase. Be honest.

7. **Estimated time.** Be honest and slightly generous. "30 minutes" that takes 2 hours is demoralizing. "2-3 hours" that takes 90 minutes feels great.
