### 1) Slice identity

- **Slice name:** Privacy-safe telemetry and local logging
- **One-sentence outcome (customer-visible):** Teams can measure adoption and reliability with privacy-safe telemetry that never logs diff content.
- **Primary persona:** Release/process owner
- **Spine step / milestone it maps to:** Post-commit measurement and quality tracking
- **Customer promise (truthful after shipping):** "You can track success rates and failures without exposing code diffs or secrets."
- **Non-goals (explicit):**
- Centralized analytics backend
- Auto-upload of logs
- Detailed diff sampling
- OAuth changes
- Windows support

### 2) Scope and constraints

- **In scope:**
- Event emission for key actions (success/failure/latency)
- Local metrics sink (file or stdout JSON)
- Opt-in telemetry flag with privacy notice
- Redaction guidance in logs
- **Out of scope:**
- Remote aggregation or dashboards
- PII collection
- Diff content logging
- Auto-enabling telemetry
- **Constraints to keep it thin:**
- Local-only storage
- Minimal event schema
- No dependencies on external services
- Opt-in only

### 3) Architecture & ownership (debt prevention)

- **Owning module / bounded context:** telemetry
- **Touched modules (if any):**
- cli-shell: opt-in flag and notice
- message-engine, git-context, provider-auth: emit events via telemetry API
- **Data ownership:**
- telemetry owns event schema and local sink
- **Integration seams:**
- Sync contract for event schema v1
- **Guardrails:**
- no module writes directly to telemetry sink
- no diff content in events or logs
- no shared/common logging utils

### 4) User journey (happy path)

1. Release/process owner enables `--telemetry` in a test run.
2. Developer runs `tool commit`.
3. Tool emits start, proposal, and commit events.
4. Local metrics file is updated.
5. Owner inspects local file for success rate and errors.

### 5) Edge cases and failure handling

- Telemetry file path invalid -> warn and continue.
- Disk full -> warn and continue.
- File locked -> warn and continue.
- Telemetry disabled -> no events emitted.
- Event payload too large -> truncate fields and warn.
- Non-interactive shell -> telemetry flag still works.
- Missing timestamp source -> use monotonic fallback.
- Telemetry schema mismatch -> drop event and warn.
- Logging includes sensitive values -> redact and warn.
- Clock skew -> still emit, note in logs.

### 6) Observability & success metrics

- **Events:**
- `telemetry_enabled`
- `commit_flow_started`
- `proposal_generated`
- `commit_succeeded`
- `commit_failed`
- `provider_error`
- **Metrics:**
- telemetry opt-in rate
- commit success rate
- provider error rate
- p95 end-to-end latency
- **Logs:**
- event write failures (no diff content)
- **Dashboards/alerts (minimal):**
- local alert on repeated write failures
- success rate below threshold

### 7) Rollout & rollback

- **Feature flag:** `feature.ai_commit_telemetry` (default off)
- **Gating:** internal -> beta -> GA
- **Ramp plan:** enable internal, then 50% -> 100%; stop on write failure spikes
- **Rollback plan:** disable flag; telemetry is not emitted and no files are touched

### 8) Acceptance (must be runnable)

**Acceptance Steps (staging-ready checklist)**

1. Setup: enable flag; set telemetry output path; stage a change.
2. Happy path verification: run `tool commit --telemetry`, commit succeeds, local telemetry file updated.
3. Permission verification: run without `--telemetry` -> no file created; run with invalid path -> warning only.
4. Failure-mode verification: simulate disk full -> warning; simulate file lock -> warning; schema mismatch -> drop event.
5. Telemetry verification: confirm `commit_flow_started` and `commit_succeeded` events exist.
6. Rollback verification: disable flag -> telemetry not emitted.

**Acceptance Criteria (summary)**

- Telemetry is opt-in and disabled by default.
- No diff content or secrets are logged.
- Event writes never block commits.
- Local telemetry sink records core events when enabled.
- Flag off removes all telemetry behavior.

### 9) Tech debt ledger (only if needed)

- **Debt:** None

### 10) GTM mini-notes (tiny but real)

- **Who benefits now:** Release/process owners tracking adoption and quality
- **2-minute demo script:** Run `tool commit --telemetry`, show local JSON events, point to success metrics
- **Release note blurb:** "Optional, privacy-safe telemetry tracks success and errors without logging diffs."
- **Known limitations:** Local-only metrics, no dashboards or uploads
