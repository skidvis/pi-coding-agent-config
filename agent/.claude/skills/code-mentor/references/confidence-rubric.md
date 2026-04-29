# Confidence Assessment Rubric

Use this rubric to score idea clarity before generating a contract.

**Threshold**: 95 points minimum to proceed to contract generation.

## Scoring Dimensions

### 1. Problem Clarity (0-20 points)

| Score | Criteria |
|-------|----------|
| 0-5   | No clear goal or problem stated. Pure vagueness. |
| 6-10  | Something mentioned but it's extremely vague ("I want to make an app"). |
| 11-15 | Problem or goal is clear but missing context: who it's for, why it matters, what outcome is expected. |
| 16-20 | Crystal clear: what's being built, who it's for, why it matters, what it will do. |

**Questions to ask if low**:

- "What are you actually trying to build?"
- "Who would use this — just you, or others?"
- "What's the core thing it needs to do?"
- "Can you describe what the finished product looks like when it works?"

---

### 2. Goal Definition (0-20 points)

| Score | Criteria |
|-------|----------|
| 0-5   | No goals. Just a vague idea or complaint. |
| 6-10  | Vague aspirations ("build something cool", "learn React"). |
| 11-15 | Goals stated but not concrete enough to guide decisions ("users should be able to log in"). |
| 16-20 | Specific, concrete goals that would let someone build a plan ("users log in with email/password, sessions persist for 7 days"). |

**Questions to ask if low**:

- "What specific features does it need to have?"
- "What does the MVP look like — the smallest version that's useful?"
- "What do you most want to learn by building this?"

---

### 3. Success Criteria (0-20 points)

| Score | Criteria |
|-------|----------|
| 0-5   | No idea of what "done" looks like. |
| 6-10  | Subjective criteria only ("it should feel good", "it should work"). |
| 11-15 | Some testable criteria but coverage is incomplete. |
| 16-20 | Clear, testable acceptance criteria for all goals. The developer would know unambiguously when each is complete. |

**Questions to ask if low**:

- "How will you know when this feature is done?"
- "What would you demo to someone to prove this works?"
- "What would make you say 'this is broken' vs 'this is working'?"

---

### 4. Scope Boundaries (0-20 points)

| Score | Criteria |
|-------|----------|
| 0-5   | Completely open scope. Could mean anything. |
| 6-10  | Some boundaries implied but not explicit. |
| 11-15 | Boundaries stated but adjacent areas are unclear. |
| 16-20 | Clear in/out-of-scope with rationale. Future ideas are noted but deferred. |

**Questions to ask if low**:

- "What's explicitly NOT in this version?"
- "If you had to cut the scope in half, what would you drop?"
- "Are there related features you're tempted to add but want to defer?"
- "What's the MVP vs. nice-to-have?"

---

### 5. Consistency (0-20 points)

| Score | Criteria |
|-------|----------|
| 0-5   | Major contradictions. Requirements conflict in ways that make a plan impossible. |
| 6-10  | Several conflicting statements that need resolution. |
| 11-15 | Minor inconsistencies — resolvable, but need a quick call. |
| 16-20 | Internally consistent throughout. No contradictions. |

**Questions to ask if low**:

- "You mentioned [X] but also [Y] — these seem to conflict. Which takes priority?"
- "Earlier you said [A], but now [B]. Can you clarify?"
- "If those two requirements conflict, which matters more?"

---

## Confidence Thresholds

| Total Score | Interpretation | Action |
|-------------|----------------|--------|
| < 70 | Major gaps | Ask 5+ questions targeting lowest-scoring dimensions. May need multiple rounds. |
| 70-84 | Moderate gaps | Ask 3-5 targeted questions. One more round likely sufficient. |
| 85-94 | Minor gaps | Ask 1-2 specific questions. Almost ready. |
| ≥ 95 | Ready | Generate contract. |

---

## Question Best Practices

### Do:

- **Be specific**: "What happens when a user has no items saved?" not "Tell me more."
- **Offer options**: "Is offline support A) critical for MVP, B) nice-to-have, or C) out of scope entirely?"
- **Reference context**: "You mentioned 'tags are better than folders.' Should tags be user-created, predefined, or both?"
- **Limit quantity**: 3-5 questions max per round.
- **Prioritize**: Target the lowest-scoring dimension first.

### Don't:

- Ask open-ended "tell me more" questions.
- Ask redundant questions about things already stated.
- Ask compound questions (split them up).
- Skip context — always reference what they said.

---

## Recalculation

After each round of questions:

1. Re-read the original idea + new answers
2. Re-score all 5 dimensions
3. If still < 95, identify new lowest dimension
4. Ask targeted questions
5. Repeat until ≥ 95

**Keep going until ≥ 95. Score conservatively — when uncertain between two levels, always choose the lower one.**
