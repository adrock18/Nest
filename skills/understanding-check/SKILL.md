---
name: understanding-check
description: Before pushing code, quiz the user on the changes in their branch to confirm they understand what was built and why, then write a record tied to the checked commit. Use when the user asks for an understanding check, says they're ready to push, or a push was blocked by the pre-push hook.
---

# Understanding Check

The user is learning application engineering. Code may be written by the user, by an AI assistant, or both. What matters is that **the user understands every line**. This check confirms comprehension before code is pushed to remote. A git hook (`.githooks/pre-push`) blocks pushes of code without a passing record.

## Steps

1. **Find the change.**
   - Current branch: `git branch --show-current`. If it is `main`, stop and tell the user to work on a feature/fix branch.
   - Verify everything is committed: `git status --short`. If not, ask the user to commit first (the record is cryptographically tied to a commit SHA).
   - Check commit SHA: `git rev-parse HEAD`.
   - Compute diff: `git diff $(git merge-base origin/main HEAD) HEAD`. Ignore `*.md` files and `understanding/`.
   - If there is no code in the diff, inform the user that no check is required.

2. **Analyze the diff.**
   - Read the exact diff carefully: understand logic, error boundaries, state flow, and edge cases.

3. **Ask 3–5 targeted questions, one at a time.**
   - *Architecture & Why*: Why is this implemented this way? What problem does this abstraction solve?
   - *Alternatives*: What alternative approaches were considered, and why were they rejected?
   - *Edge cases & Invariants*: What happens with negative values, extreme bounds, empty sets, or IO failures?
   - *Failure Modes*: If line X throws or fails, how does the system recover?
   - *Data Flow*: Trace the lifecycle of data from the UI to SQLite and back.

   Avoid trivial syntax questions. Focus on architectural intent and invariants.

4. **Evaluate each answer:**
   - **Understood**: Correct in substance and understanding.
   - **Partly**: Core idea grasped, but missing an important edge case or nuance.
   - **Gap**: Incorrect or misunderstood.

   For *Partly* or *Gap*: Explain the missing concept plainly with reference to the code, then ask a follow-up question to ensure understanding.

5. **Determine Verdict:**
   - **PASS**: When every question concludes as Understood.
   - **NOT YET**: If fundamental gaps remain. Offer to explain the concepts and re-test later. Never fake a PASS record.

6. **Generate the record** (PASS only) to `understanding/<branch>.md` (e.g. `feature/expense-form` → `understanding/feature-expense-form.md`):

   ```markdown
   # Understanding check: <branch>

   Checked commit: <full 40-character sha>
   Date: <YYYY-MM-DD>
   Verdict: PASS

   ## What changed
   <2–4 sentences explaining what the change does and why>

   ## Questions & Evaluation
   ### 1. <Question>
   **Answer:** <User's response>
   **Assessment:** Understood
   ```

7. **Commit the record:**
   - `git add understanding/<branch>.md`
   - `git commit -m "docs: passing understanding check for <branch>"`
   - The user is now cleared to push.
