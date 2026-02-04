### 1) Slice identity

- **Slice name:** Large diff degradation and safety messaging
- **One-sentence outcome (customer-visible):** The tool stays responsive on large diffs by truncating safely and warning users while still producing a usable commit message.
- **Primary persona:** Repo maintainer
- **Spine step / milestone it maps to:** Diff handling before proposal generation
- **Customer promise (truthful after shipping):** "Even for large diffs, you get a safe, fast summary and a clear warning without crashes or hangs."
- **Non-goals (explicit):**
- Auto-splitting into multiple commits
- External diff summarizer services
- Interactive selection of files/hunks
- OAuth changes
- Windows support

### 2) Scope and constraints

- **In scope:**
- Max diff size and file count limits
- Binary file handling as metadata only
- Truncation warning banner in preview
- Configurable limits (read-only)
- Proposal includes "truncated" indicator
- **Out of scope:**
- Diff chunking UI
- Multiple summarization strategies
- Auto-cancel on large diff without user option
- Config editing UI
- Telemetry dashboards
- **Constraints to keep it thin:**
- Single truncation strategy
- File count and byte limits only
- Summary uses file list + stats only
- No extra provider calls for summarization

### 3) Architecture & ownership (debt prevention)

- **Owning module / bounded context:** message-engine
- **Touched modules (if any):**
- git-context: diff collection with limits
- config-policy: limit values
- cli-shell: warning UI
- **Data ownership:**
- message-engine owns truncation flags in proposal
- **Integration seams:**
- Sync contract for diff summary + truncation metadata
- **Guardrails:**
- diff collection only in git-context
- message-engine enforces limits, not cli-shell
- no shared/common truncation helpers

### 4) User journey (happy path)

1. Developer runs `tool commit` on a large diff.
2. Tool detects diff size exceeds limit.
3. Tool truncates diff and records truncation metadata.
4. Tool requests proposal using truncated data.
5. Preview shows warning banner about truncation.
6. Developer confirms and commits.

### 5) Edge cases and failure handling

- Diff exceeds limits even after truncation -> refuse with guidance.
- File count exceeds limit -> include only top N by change size.
- Binary-only changes -> minimal message, suggest manual edit.
- Large diff with no staged changes -> warn and exit.
- Truncation removes key context -> warn; allow user to edit.
- Config limits invalid -> use defaults and warn.
- Provider timeout due to large prompt -> error and exit.
- Non-interactive shell -> require `--yes` or exit.
- Warning banner suppressed by `--quiet` -> still logs event.
- Summary computation fails -> error and exit.

### 6) Observability & success metrics

- **Events:**
- `diff_size_exceeded`
- `diff_truncated`
- `proposal_generated`
- `truncation_warning_shown`
- **Metrics:**
- truncation rate
- large-diff success rate
- average diff size at truncation
- **Logs:**
- diff size, file count, truncation reason (no diff content)
- **Dashboards/alerts (minimal):**
- truncation rate spike
- large-diff failure spike

### 7) Rollout & rollback

- **Feature flag:** `feature.ai_commit_large_diff` (default off)
- **Gating:** internal -> beta -> GA
- **Ramp plan:** 10% -> 50% -> 100%; stop on increased failure rate
- **Rollback plan:** disable flag; revert to previous limits without truncation banner

### 8) Acceptance (must be runnable)

**Acceptance Steps (staging-ready checklist)**

1. Setup: create large staged diff beyond limit; enable flag.
2. Happy path verification: run `tool commit`, see truncation warning, confirm, commit succeeds.
3. Permission verification: run in non-repo -> error; run in conflict -> refusal.
4. Failure-mode verification: diff exceeds limit after truncation -> refusal; binary-only changes -> minimal message; invalid limits -> defaults used.
5. Telemetry verification: `diff_truncated` and `truncation_warning_shown` emitted.
6. Rollback verification: disable flag; warning banner and truncation metadata not shown.

**Acceptance Criteria (summary)**

- Large diffs are truncated safely with a clear warning.
- No diff content is logged or leaked.
- Excessive diffs refuse with actionable guidance.
- Truncation metadata appears in proposal.
- Flag off removes truncation warning behavior.

### 9) Tech debt ledger (only if needed)

- **Debt:** None

### 10) GTM mini-notes (tiny but real)

- **Who benefits now:** Maintainers in large repos with big commits
- **2-minute demo script:** Show a big diff, run `tool commit`, point to truncation warning, commit
- **Release note blurb:** "Large diffs now degrade gracefully with safe truncation and clear warnings."
- **Known limitations:** Single truncation strategy, no per-file selection
