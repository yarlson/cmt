### 1) Slice identity

- **Slice name:** Edit or regenerate commit message
- **One-sentence outcome (customer-visible):** Developers can edit the AI-generated commit message or request one regeneration before committing.
- **Primary persona:** Developer
- **Spine step / milestone it maps to:** Preview and confirm stage
- **Customer promise (truthful after shipping):** "You can refine the generated message in your editor or regenerate it once before committing."
- **Non-goals (explicit):**
- OAuth authentication
- Include-unstaged or interactive staging
- Multiple regenerations or tuning prompts
- Config precedence or scope mappings
- Telemetry dashboards beyond basic events
- Windows support

### 2) Scope and constraints

- **In scope:**
- `--edit` opens `$EDITOR` and uses edited text verbatim
- `--regen` requests one fresh proposal per run
- Preview shows updated message after edit or regen
- Subject length warning if exceeded
- Cancel path remains available
- **Out of scope:**
- Auto-rewrite or linting that blocks commit
- Inline editor UI inside the CLI
- Multiple regen attempts or prompt customization
- Config file controls
- OAuth flow
- Include-unstaged commit
- **Constraints to keep it thin:**
- Assume staged-commit flow exists
- Regen limited to once per execution
- `$EDITOR` only; no fallback editor download
- Warnings only for length/format, no hard blocking

### 3) Architecture & ownership (debt prevention)

- **Owning module / bounded context:** message-engine
- **Touched modules (if any):**
- cli-shell: editor invocation and prompts
- git-context: commit execution
- **Data ownership:**
- message-engine owns proposal structure; edited text treated as user input
- **Integration seams:**
- Sync contract for proposal update events; editor input stays in cli-shell
- **Guardrails:**
- no editor logic in message-engine
- no direct provider SDK access outside provider-auth
- no shared/common helpers introduced

### 4) User journey (happy path)

1. Developer runs `tool commit` with staged changes.
2. Tool generates proposal and shows preview.
3. Developer selects `--edit`.
4. CLI opens `$EDITOR` with the proposal pre-filled.
5. Developer edits and saves.
6. CLI re-renders preview with edited message.
7. Developer confirms.
8. Tool commits with edited message and prints hash.

### 5) Edge cases and failure handling

- `$EDITOR` not set -> prompt to set or continue without edit.
- Editor exits non-zero -> warn and return to preview.
- Empty edited message -> error and return to preview.
- Edited message not Conventional Commit -> warn, allow confirm.
- `--regen` requested after `--edit` -> regen replaces edited text.
- Provider regen timeout -> keep prior message and warn.
- Regen returns identical message -> inform user, allow confirm.
- Non-interactive shell -> `--edit` rejected with guidance.
- User cancels after edit -> no commit.
- Hook failure on commit -> show output and exit non-zero.
- Dry-run with edit -> prints edited message only.

### 6) Observability & success metrics

- **Events:**
- `edit_requested`
- `edit_completed`
- `regen_requested`
- `regen_succeeded`
- `regen_failed`
- `commit_succeeded`
- **Metrics:**
- edit rate
- regen rate
- acceptance after edit
- acceptance after regen
- **Logs:**
- editor exit code
- regen error codes
- **Dashboards/alerts (minimal):**
- regen failure spike
- unusually high edit rate (quality signal)

### 7) Rollout & rollback

- **Rollout:** internal -> beta -> GA
- **Ramp plan:** enable for internal, then 25% -> 75% -> 100%; stop on editor failures or regen errors
- **Rollback plan:** revert release; CLI returns to preview-only flow

### 8) Acceptance (must be runnable)

**Acceptance Steps (staging-ready checklist)**

1. Setup: staged change in test repo, set `$EDITOR`.
2. Happy path verification: run `tool commit --edit`, edit message, confirm commit, verify `git log -1` shows edited text.
3. Permission verification: run `--edit` without `$EDITOR` -> guidance; run in non-interactive shell -> rejected.
4. Failure-mode verification: empty edited message -> error; regen timeout -> uses prior message; editor exit non-zero -> returns to preview.
5. Telemetry verification: events `edit_requested` and `edit_completed` emitted.

**Acceptance Criteria (summary)**

- Edited message is used verbatim when committed.
- `--regen` produces a new proposal at most once per run.
- Editor errors never auto-commit.
- Non-interactive environments block edit with guidance.
- Conventional format violations warn but do not block.
- Telemetry records edit/regen attempts.

### 9) Tech debt ledger (only if needed)

- **Debt:** None

### 10) GTM mini-notes (tiny but real)

- **Who benefits now:** Developers who want control without losing speed
- **2-minute demo script:** Run `tool commit --edit`, open editor, tweak subject, confirm, show cleaned message in `git log -1`
- **Release note blurb:** "Edit AI-generated commit messages in your editor or regenerate once before committing."
- **Known limitations:** Single regen per run, no inline editor UI
