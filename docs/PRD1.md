### 1) Slice identity

- **Slice name:** Staged AI commit with dry-run (API key)
- **One-sentence outcome (customer-visible):** Developers can generate a Conventional Commit message from staged changes, preview it, and either commit or dry-run safely.
- **Primary persona:** Developer
- **Spine step / milestone it maps to:** Staged commit happy path
- **Customer promise (truthful after shipping):** "When you run `tool commit`, you get a high-quality Conventional Commit message from your staged diff, see it first, and only commit if you confirm."
- **Non-goals (explicit):**
- OAuth authentication
- Include-unstaged or interactive staging
- Message edit/regenerate flow
- Provider/model configuration or config precedence
- Multi-commit planning or split suggestions
- Telemetry/analytics beyond basic errors

### 2) Scope and constraints

- **In scope:**
- `tool commit` with staged-only diff collection
- Repo state validation (git repo, no conflicts, no rebase)
- Bounded diff + file list summary for LLM prompt
- Generate Conventional Commit proposal (type/scope/subject + optional body)
- Preview + confirm/cancel interaction
- `--dry-run` prints exact message without commit
- `git commit` execution with hooks intact
- **Out of scope:**
- OAuth auth flow
- `--include-unstaged` and staging policies
- `--edit` editor flow or `--regen`
- Config file / env / flag precedence
- Custom type lists or scope mapping rules
- Breaking-change detection beyond model output
- Telemetry event ingestion or dashboards
- Windows support
- **Constraints to keep it thin:**
- API key auth only, single provider
- Default model only, no model selection UI
- Staged changes only, tracked files only
- Single prompt attempt, no retries unless user re-runs
- Limits on diff size and file count with truncation warning

### 3) Architecture & ownership (debt prevention)

- **Owning module / bounded context:** git-context
- **Touched modules (if any):**
- message-engine: generate proposal from bounded diff
- provider-auth: store/read API key
- cli-shell: prompt/preview/confirm UI
- config-policy: read safety limits only
- **Data ownership:**
- provider-auth owns API key storage
- message-engine owns proposal structure (ephemeral)
- git-context owns diff collection and commit execution
- **Integration seams:**
- Sync contract between git-context -> message-engine (proposal schema v1)
- provider-auth wraps Pi Agent SDK; no SDK use elsewhere
- **Guardrails:**
- cli-shell depends on domain modules; domain modules do not depend on cli-shell
- no direct SDK usage outside provider-auth
- no cross-module internal imports; public API only
- no shared/common module introduced

### 4) User journey (happy path)

1. Developer stages changes with `git add`.
2. Developer runs `tool commit`.
3. Tool validates repo state and confirms staged changes exist.
4. Tool requests API key if missing, then verifies a lightweight provider call.
5. Tool collects bounded diff + file list summary.
6. Tool requests a Conventional Commit proposal from Pi Agent.
7. Tool shows preview (type/scope/subject + body/footers + brief rationale).
8. Developer confirms.
9. Tool runs `git commit` with the final message.
10. Tool prints commit hash and subject line.

### 5) Edge cases and failure handling

- Not in a git repo -> error and exit non-zero.
- No staged changes -> warn and exit without commit.
- Merge conflict detected -> refuse and suggest resolve first.
- Rebase/merge in progress -> refuse unless user overrides (not supported in this slice).
- API key missing -> prompt once; cancel returns to shell.
- API key invalid -> error with guidance; no commit.
- Provider timeout -> error, no commit.
- Diff exceeds limits -> truncate and warn; still propose message.
- Binary files present -> summarize metadata only, no binary content.
- Subject line exceeds limit -> warn; allow confirm.
- Pre-commit hook fails -> show hook output and exit non-zero.
- User cancels at preview -> no changes made.
- Non-interactive shell -> require `--yes` or exit with guidance.

### 6) Observability & success metrics

- **Events:**
- `commit_flow_started`
- `repo_validation_failed`
- `diff_truncated`
- `proposal_generated`
- `preview_shown`
- `commit_confirmed`
- `commit_succeeded`
- `commit_failed`
- **Metrics:**
- commit success rate
- time to proposal (p50/p95)
- time from preview to commit
- auth prompt rate
- provider error rate
- diff truncation rate
- **Logs:**
- repo state (in repo, conflict flag, rebase flag)
- diff stats (file count, lines changed)
- provider error codes (no diff content)
- **Dashboards/alerts (minimal):**
- success rate below threshold
- provider error spike

### 7) Rollout & rollback

- **Rollout:** internal -> design partners -> beta -> GA
- **Ramp plan:** 0% -> 10% -> 50% -> 100%; stop on error-rate spike or provider failure
- **Rollback plan:** revert release; no data mutation beyond git commit, so rollback is safe

### 8) Acceptance (must be runnable)

**Acceptance Steps (staging-ready checklist)**

1. Setup: create a test repo, stage a small change, set API key.
2. Happy path verification: run `tool commit`, confirm preview, commit succeeds, hash is printed.
3. Permission verification: run outside git repo -> error; run with merge conflict -> refusal.
4. Failure-mode verification: invalid API key -> error; provider timeout -> error; pre-commit hook failure -> error surfaced.
5. Telemetry verification: confirm event stream/logs include `commit_flow_started` and `commit_succeeded`.

**Acceptance Criteria (summary)**

- Tool refuses outside a git repo with clear error.
- Tool refuses in merge conflict or rebase state.
- Staged diff generates a Conventional Commit proposal.
- Preview is shown before any commit.
- `--dry-run` prints the exact message and performs no commit.
- Confirmation is required unless `--yes` is provided.
- Commit runs with hooks enabled and prints hash on success.
- Diff truncation warns but still proposes a message.
- Provider/auth failures never produce a commit.

### 9) Tech debt ledger (only if needed)

- **Debt:** Hard-coded provider/model selection
- **Why now:** Speed to first end-to-end value
- **Risk:** Config precedence becomes messy later
- **Payoff plan:** "Provider selection & config precedence" slice removes hard-coding and exposes selection controls

### 10) GTM mini-notes (tiny but real)

- **Who benefits now:** Individual developers and small teams wanting better commit messages fast
- **2-minute demo script:** Stage a change, run `tool commit`, show preview, confirm, show `git log -1` with clean Conventional Commit message
- **Release note blurb:** "Generate Conventional Commit messages from staged diffs in seconds. Preview and confirm before committing. Dry-run supported."
- **Known limitations:** API key auth only, staged-only changes, no edit/regenerate yet
