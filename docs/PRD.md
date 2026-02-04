## PRD: AI Commit Message + Commit CLI

### 1) Overview

**Problem**
Commit messages are often rushed, inconsistent, or useless (“fix”, “wip”, “stuff”). This harms review quality, release notes, changelog automation, and future debugging. Developers want the speed of “just commit,” without the shame.

**Solution**
A CLI tool that:

1. gathers changes from `git diff` (staged by default; optionally includes unstaged),
2. uses an LLM via **Pi Agent SDK** to generate a **Conventional Commit** message (type/scope/description + optional body/footers),
3. lets the user **preview/edit/confirm**, then
4. runs `git commit` with the final message.

**Goals**

- Generate **high-quality**, **Conventional Commit-compliant** messages from actual diffs.
- Reduce time-to-commit while improving consistency.
- Provide safe UX: preview + confirmation, clear failure modes, no surprises.
- Support provider authentication via **OAuth** or **API key** using Pi Agent SDK primitives.

**Non-goals**

- Not a full git porcelain replacement (no rebase/merge conflict resolution).
- Not an auto-push tool (no network side effects beyond LLM calls).
- Not a multi-commit planner (no splitting huge diffs into multiple commits… for now).
- Not a changelog generator (output is commit message + commit only).

---

### 2) Users & Personas

1. **Developer (primary)**

- Wants fast commits with high-quality messages.
- Needs message previews and quick edits.

2. **Repo maintainer**

- Wants consistent Conventional Commits for automation.
- Needs guardrails (don’t commit junk / don’t bypass hooks / don’t destroy history).

3. **Release/process owner**

- Wants reliable types/scopes for release tooling and analytics.
- Cares about “BREAKING CHANGE” and issue references.

---

### 3) Primary User Journeys

#### Journey A: First-time setup + auth

1. User runs `tool auth` (or `tool commit` and is prompted).
2. User selects provider.
3. User authenticates via OAuth flow **or** pastes an API key.
4. Tool verifies auth (simple “can I list models / call a lightweight endpoint?”).
5. Tool stores credentials for future runs.

#### Journey B: Commit with staged changes (default)

1. User stages changes (`git add …`).
2. User runs `tool commit`.
3. Tool validates repo state (git repo, no merge conflict, HEAD available).
4. Tool reads staged diff and metadata (paths changed, file types, stats).
5. Tool asks Pi Agent to propose a Conventional Commit message.
6. Tool shows preview (type/scope/subject + body/footers), plus “why” summary.
7. User confirms or edits.
8. Tool executes `git commit` and prints resulting commit hash.

#### Journey C: Commit including unstaged changes (optional)

1. User runs `tool commit --include-unstaged`.
2. Tool shows what will be staged/committed.
3. User confirms.
4. Tool stages selected changes (policy-driven), generates message, commits.

#### Journey D: Dry run / message-only

1. User runs `tool commit --dry-run` or `tool message`.
2. Tool prints proposed Conventional Commit message and exits without committing.

---

### 4) Functional Requirements

#### Diff and repo handling

- FR1: Tool must refuse to run outside a git repository.
- FR2: Tool must detect changes and support:
  - staged-only (default),
  - include-unstaged (explicit flag),
  - optionally “stage all tracked changes” (explicit flag).

- FR3: Tool must refuse to commit when:
  - there are unresolved merge conflicts,
  - repo is in an unsafe state (e.g., rebasing) unless explicitly overridden.

- FR4: Tool must support large diffs safely by applying limits:
  - max diff bytes/tokens,
  - file count limits,
  - binary file handling (summarize, don’t embed binary).

- FR5: Tool must include minimal context for model quality:
  - list of changed files,
  - diff hunks (bounded),
  - optional `git status` summary,
  - optional recent commit message style hints (bounded).

#### Conventional Commit generation

- FR6: Tool must generate a Conventional Commit message:
  - `type(scope): subject`
  - optional body
  - optional footers (e.g., `BREAKING CHANGE: …`, `Refs: …`)

- FR7: Tool must select an appropriate `type` from a defined set (configurable), e.g. `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `chore`, `build`, `ci`, `revert`.
- FR8: Tool must infer a `scope` (optional) based on changed paths and/or user config mapping.
- FR9: Tool must generate a short, imperative, <~72 char subject line (configurable constraint).
- FR10: Tool must be able to include issue references if supplied (`--refs ABC-123`) and place them as footers.

#### User interaction and safety

- FR11: Tool must show a preview of the generated message before committing.
- FR12: User must be able to:
  - accept,
  - edit in-place (`--edit` opens editor),
  - regenerate (`--regen`),
  - cancel.

- FR13: Tool must support `--dry-run` (no git commit executed).
- FR14: Tool must never commit without confirmation unless `--yes` is provided.

#### Git commit execution

- FR15: Tool must run `git commit` using the final message while respecting repo hooks.
- FR16: Tool must support common commit options:
  - `--no-verify` (explicit),
  - `--signoff` (optional),
  - passthrough extra git commit args (controlled, safe subset).

- FR17: Tool must report success with the commit hash and final subject line.

#### Provider auth and model usage (Pi Agent SDK)

- FR18: Tool must support provider authentication via:
  - OAuth (interactive),
  - API key (non-interactive input).

- FR19: Tool must store auth in a user configuration area and reuse it across runs.
- FR20: Tool must allow selecting provider and model via:
  - CLI flags,
  - environment variables,
  - config file,
    with a clear precedence order.

- FR21: Tool must use Pi Agent SDK session(s) to generate the message and optionally provide a short rationale summary (user-visible “why this type/scope”).

---

### 5) Non-functional Requirements

- NFR1: **Safety:** no destructive git operations; clear prompts; cancel always possible.
- NFR2: **Reliability:** deterministic behavior when no changes / invalid state; actionable errors.
- NFR3: **Performance:** message generation should feel responsive for typical diffs; large diffs must degrade gracefully (summaries + truncation).
- NFR4: **Privacy:** avoid logging diffs by default; require explicit verbose logging; provide redaction guidance.
- NFR5: **Portability:** works on macOS/Linux terminals; Windows optional (define explicitly if required).

---

### 6) Domain Concepts

- **Change set:** staged/unstaged diff plus metadata (paths, stats).
- **Commit message proposal:** structured output (type, scope, subject, body, footers).
- **Auth identity:** provider credential (OAuth token or API key) associated with provider.
- **Config:** provider/model preferences, conventional commit rules, scope mappings, safety limits.

---

### 7) Permissions & Policy

- Single role: **local operator** running CLI.
- Actions operate under local git permissions.
- Tool must not escalate privileges or bypass git hooks unless user explicitly uses `--no-verify`.

---

### 8) Success Metrics

- % of commits created with tool vs manual `git commit`.
- Average time from “ready to commit” → commit created.
- % of generated messages accepted without edits.
- Maintainer satisfaction proxy: reduced “fix/wip” commits, improved release note quality.
- Error rates: auth failures, model selection failures, diff-too-large fallbacks.

---

### 9) Acceptance Criteria and Acceptance Steps

#### Acceptance Criteria

- AC1: With staged changes, running `tool commit` generates a Conventional Commit message and commits successfully after confirmation.
- AC2: `tool commit --dry-run` prints the exact message that would be used, and does not create a commit.
- AC3: Tool refuses to run outside a git repo with a clear error.
- AC4: Tool refuses to commit with merge conflicts detected.
- AC5: Tool supports OAuth login for a provider and persists credentials for reuse.
- AC6: Tool supports API key auth for a provider and persists credentials for reuse.
- AC7: Tool allows choosing provider/model via flags/env/config with documented precedence.
- AC8: Large diffs do not crash the tool; it truncates/summarizes and still produces a reasonable message (with a warning).
- AC9: User can edit the message before commit and the edited message is used verbatim.

#### Acceptance Steps

1. **Setup**
   - Create a test repo, make a change, stage it.
   - Ensure no existing auth is configured (fresh environment).

2. **Auth via OAuth**
   - Run `tool auth --provider <X>`.
   - Complete OAuth flow.
   - Verify subsequent `tool commit` does not require re-auth.

3. **Auth via API key**
   - Run `tool auth --provider <Y> --api-key <KEY>` (or prompted secure input).
   - Verify subsequent `tool commit` uses stored auth without prompts.

4. **Happy path commit**
   - Run `tool commit`.
   - Verify: preview shows `type(scope): subject`.
   - Confirm commit.
   - Verify: `git log -1` shows the generated message.

5. **Dry run**
   - Run `tool commit --dry-run`.
   - Verify: message printed, no new commit created.

6. **Negative: no repo**
   - Run tool in a non-git directory.
   - Verify: clear error and non-zero exit.

7. **Negative: conflicts**
   - Create a merge conflict state.
   - Run `tool commit`.
   - Verify: tool refuses with actionable guidance.

8. **Large diff behavior**
   - Generate a large diff (many files/lines).
   - Run `tool commit`.
   - Verify: tool warns about truncation/summarization and still proposes a message.

---

### 10) Risks, Assumptions, Open Questions

**Assumptions**

- User has git installed and standard CLI environment.
- Conventional Commit format is desired by target repos (or can be configured off).

**Risks**

- Bad message quality for large diffs or mixed-purpose commits.
- Users rely too much on auto-generated message without review.
- Credential handling and logging could accidentally expose sensitive data.
- Provider/model availability differences cause inconsistent behavior.

**Open Questions**

- Should we support multi-commit splitting suggestions (without doing it automatically)?
- How should scope mapping be configured (path prefix → scope)?
- Do we enforce strict conventional commit lint rules or just best-effort?
- Should the tool generate footers for breaking changes automatically, or only when user confirms?
- Should hooks be run by default (yes) and how prominently do we surface failures?

---

### 11) Out of Scope / Future Ideas

- Auto-splitting changes into multiple commits.
- Automatic staging UI / interactive staging.
- Auto-PR description generation.
- Repo-specific conventional commit policies auto-detection.
