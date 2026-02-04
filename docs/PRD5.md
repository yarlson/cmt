### 1) Slice identity

- **Slice name:** Include unstaged tracked changes
- **One-sentence outcome (customer-visible):** Developers can include unstaged tracked changes in an AI-generated commit after explicit confirmation.
- **Primary persona:** Developer
- **Spine step / milestone it maps to:** Commit including unstaged changes
- **Customer promise (truthful after shipping):** "You can choose to include your unstaged tracked changes in the commit with a clear preview and confirmation."
- **Non-goals (explicit):**
- Interactive staging or hunk selection
- Untracked file inclusion
- OAuth changes
- Config precedence changes
- Telemetry dashboards
- Windows support

### 2) Scope and constraints

- **In scope:**
- `tool commit --include-unstaged` shows list of tracked files to stage
- Single confirmation prompt before staging
- Stage tracked changes only
- Generate proposal and commit like staged flow
- **Out of scope:**
- Untracked files staging
- Partial file staging or patch mode
- Multiple confirmations or per-file selection
- Auto-staging on default path
- OAuth or auth changes
- **Constraints to keep it thin:**
- Tracked files only
- One confirmation step
- No selection UI
- Uses existing proposal flow

### 3) Architecture & ownership (debt prevention)

- **Owning module / bounded context:** git-context
- **Touched modules (if any):**
- cli-shell: display file list and confirm
- message-engine: proposal generation
- **Data ownership:**
- git-context owns staging and diff collection
- **Integration seams:**
- Sync contract for staging policy and file list
- **Guardrails:**
- staging logic only in git-context
- no direct git commands from cli-shell
- no shared/common staging helpers

### 4) User journey (happy path)

1. Developer has unstaged tracked changes.
2. Developer runs `tool commit --include-unstaged`.
3. Tool validates repo state.
4. Tool lists tracked files that will be staged.
5. Developer confirms staging.
6. Tool stages tracked changes.
7. Tool generates proposal and shows preview.
8. Developer confirms.
9. Tool commits and prints hash.

### 5) Edge cases and failure handling

- No unstaged changes -> proceed with staged-only or warn.
- Untracked files present -> excluded and noted.
- Staging fails due to permissions -> error and exit.
- Staging results in no changes -> warn and exit.
- Merge conflict detected -> refuse.
- Rebase in progress -> refuse.
- Large file list -> summarized display with counts.
- Binary files in unstaged -> metadata only.
- User cancels at staging confirmation -> no changes made.
- Pre-commit hook fails -> error surfaced.
- Non-interactive shell -> require `--yes` or exit.

### 6) Observability & success metrics

- **Events:**
- `include_unstaged_requested`
- `staging_confirmed`
- `staging_completed`
- `staging_failed`
- `commit_succeeded`
- **Metrics:**
- include-unstaged usage rate
- staging failure rate
- commit success rate for include-unstaged
- **Logs:**
- file count staged (no file paths unless verbose)
- staging error codes
- **Dashboards/alerts (minimal):**
- staging failure spike
- include-unstaged success rate drop

### 7) Rollout & rollback

- **Feature flag:** `feature.ai_commit_include_unstaged` (default off)
- **Gating:** internal -> beta -> GA
- **Ramp plan:** 10% -> 50% -> 100%; stop on staging failure spikes
- **Rollback plan:** disable flag; `--include-unstaged` becomes unsupported and exits safely

### 8) Acceptance (must be runnable)

**Acceptance Steps (staging-ready checklist)**

1. Setup: test repo with unstaged tracked change; enable flag.
2. Happy path verification: run `tool commit --include-unstaged`, confirm staging, preview, commit succeeds.
3. Permission verification: run during merge conflict -> refusal; run with no repo -> error.
4. Failure-mode verification: staging fails -> error; user cancels -> no changes; untracked files present -> excluded with note.
5. Telemetry verification: `include_unstaged_requested` and `staging_completed` emitted.
6. Rollback verification: disable flag; command exits with clear message.

**Acceptance Criteria (summary)**

- Unstaged tracked files are listed and require explicit confirmation.
- Untracked files are never staged.
- Staging errors never proceed to commit.
- Preview remains required before commit.
- Feature flag cleanly disables the flow.

### 9) Tech debt ledger (only if needed)

- **Debt:** None

### 10) GTM mini-notes (tiny but real)

- **Who benefits now:** Developers who forget to stage before committing
- **2-minute demo script:** Make an unstaged change, run `tool commit --include-unstaged`, confirm staging, commit
- **Release note blurb:** "Include unstaged tracked changes in your AI-assisted commit with a clear confirmation step."
- **Known limitations:** Tracked files only, no per-file selection
