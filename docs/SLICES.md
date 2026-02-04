1. PRD size estimate + slice count range

- Complexity level: Large
- Why:
- Multiple user journeys (auth, commit, dry-run, include-unstaged)
- External integration (Pi Agent SDK + OAuth/API key)
- Safety constraints (git state validation, hooks, no destructive ops)
- Non-trivial UX (preview/edit/regen/confirm)
- Cross-cutting needs (privacy, telemetry, config precedence)
- Estimated “right” slice count range: 7–12

2. Architecture guardrails

- Module / bounded-context map (draft):
- cli-shell: command parsing, prompts, terminal UX
- git-context: repo state, diffs, staging policy, commit execution
- message-engine: conventional commit proposal logic + validation
- provider-auth: OAuth/API key flows + token storage
- config-policy: config loading, precedence, limits, scope mappings
- telemetry: events, metrics, error reporting (privacy-safe)
- security-privacy: redaction, logging policy, secrets handling
- Architecture invariants:
- domain modules (git-context, message-engine, provider-auth) do not depend on cli-shell
- cross-module access only via public APIs/contracts
- data ownership: auth tokens owned by provider-auth; config owned by config-policy; commit proposals owned by message-engine
- no shared/common module without explicit ADR-lite note
- telemetry is write-only from modules; no read-time dependencies
- contract changes require a short “contract note” (ADR-lite)
- no direct access to provider SDK outside provider-auth
- Enforcement hooks (fitness functions):
- forbid imports from cli-shell into domain modules
- forbid direct SDK usage outside provider-auth
- forbid cross-module access to auth storage outside provider-auth API
- enforce no cycles between modules
- enforce public API usage (no internal path imports)
- fail CI if logging includes diffs by default

3. Spine journey (happy path)

1) User runs `tool commit` inside git repo with staged changes
2) Tool validates repo state and reads staged diff summary
3) Tool generates conventional commit proposal via Pi Agent
4) Tool shows preview (type/scope/subject + body/footers + “why”)
5) User confirms
6) Tool runs `git commit` and prints hash

4. Sequenced slice list (each with Slice Spec)

Slice 1 — “Staged commit with dry-run (API key only)”

- User outcome: Developer gets a high-quality conventional commit message and can commit or dry-run from staged changes.
- Primary persona: Developer
- Owning module / boundary: git-context
- Touched modules: message-engine (proposal), cli-shell (prompting), config-policy (limits), provider-auth (API key only)
- In scope:
- `tool commit` on staged changes only
- repo state validation (repo exists, no conflicts, no rebase)
- bounded diff gathering + file list summary
- message proposal with type/scope/subject + optional body
- preview + confirm/cancel + `--dry-run`
- `git commit` execution with hooks intact
- Out of scope (explicit):
- OAuth flow
- include-unstaged staging
- edit/regenerate flow
- provider/model selection precedence
- telemetry events
- Constraints to keep it thin:
- API key auth only
- single provider + default model
- no scope mapping config (auto-infer only)
- limit to staged changes only
- End-to-end surface:
- UI/UX changes: `tool commit` flow, preview/confirm, dry-run output
- API/contract changes: message proposal schema v1
- Data/state changes: auth token storage (owner: provider-auth)
- Permissions/authz changes: local operator only
- Telemetry/observability: basic CLI errors only
- Architecture notes (debt prevention):
- Boundary rule respected: cli-shell only calls public APIs in git-context/message-engine
- Adapters/ACLs needed: yes, provider-auth wraps Pi Agent SDK
- Temporary seam: yes, default model hard-coded
- Debt Ledger entry:
- Debt: hard-coded provider/model selection
- Why: speed to first value
- Risk: later config precedence becomes messy
- Payoff: Slice “Provider selection & config precedence” with measurable removal of hard-code
- Failure modes + fallback:
- no staged changes → actionable error
- diff too large → truncate and warn
- auth missing → prompt for API key
- provider call fails → show error, no commit
- Rollout plan: gated by `feature.ai-commit-basic`; rollback by disabling flag
- Success metrics:
- % of generated messages accepted
- time-to-commit from command start
- error rate: auth/provider failures
- Key risks reduced: core UX viability, basic model quality, git safety

Slice 2 — “Message edit + regenerate”

- User outcome: Developer can refine AI-generated messages safely before commit.
- Primary persona: Developer
- Owning module / boundary: message-engine
- Touched modules: cli-shell (editor flow), git-context (commit), config-policy (subject length)
- In scope:
- `--edit` opens editor and uses edited message verbatim
- `--regen` to request a fresh proposal
- subject length constraint enforcement (warn, not block)
- preview includes rationale summary
- Out of scope (explicit):
- OAuth
- include-unstaged
- config precedence (env/config)
- telemetry
- Constraints to keep it thin:
- regenerate max once per run
- editor uses `$EDITOR` only
- rationale summary is short, optional
- End-to-end surface:
- UI/UX changes: edit/regenerate prompts, editor invocation
- API/contract changes: rationale field in proposal
- Data/state changes: none
- Permissions/authz changes: none
- Telemetry/observability: none
- Architecture notes (debt prevention):
- Boundary rule respected: editor logic in cli-shell only
- Adapters/ACLs needed: no
- Temporary seam: no
- Failure modes + fallback:
- editor not found → prompt to confirm without edit
- regen fails → keep prior proposal
- invalid message format → warn, allow override
- Rollout plan: gated by `feature.ai-commit-edit`
- Success metrics:
- % of edits performed
- % of regenerated messages accepted
- Key risks reduced: user trust, message quality variance

Slice 3 — “Provider selection & config precedence”

- User outcome: Maintainers can control provider/model and commit conventions consistently across repos.
- Primary persona: Repo maintainer
- Owning module / boundary: config-policy
- Touched modules: provider-auth, message-engine, cli-shell
- In scope:
- CLI flags + env + config file precedence
- configurable type set + subject length limit
- scope mapping from path prefixes
- config read/write location
- Out of scope (explicit):
- OAuth
- include-unstaged
- telemetry
- Constraints to keep it thin:
- single config file format
- limited scope mapping rules (prefix only)
- no repo auto-detection of policies
- End-to-end surface:
- UI/UX changes: `--provider`, `--model`, `--types`, config file reading
- API/contract changes: config schema v1
- Data/state changes: config storage (owner: config-policy)
- Permissions/authz changes: none
- Telemetry/observability: config load errors only
- Architecture notes (debt prevention):
- Boundary rule respected: message-engine reads config via config-policy API
- Adapters/ACLs needed: no
- Temporary seam: resolves Slice 1 hard-code
- Failure modes + fallback:
- invalid config → warn and use defaults
- missing model → fallback to provider default
- Rollout plan: gated by `feature.ai-commit-config`
- Success metrics:
- % runs using config overrides
- config error rate
- Key risks reduced: enterprise fit, policy adherence

Slice 4 — “OAuth auth flow + persistence”

- User outcome: Developer can authenticate via OAuth and reuse credentials securely.
- Primary persona: Developer
- Owning module / boundary: provider-auth
- Touched modules: cli-shell, security-privacy
- In scope:
- `tool auth --provider X` OAuth flow
- credential storage + reuse
- auth verification ping
- Out of scope (explicit):
- multiple providers simultaneously
- token refresh beyond SDK default
- telemetry
- Constraints to keep it thin:
- single OAuth provider at a time
- interactive flow only
- minimal scopes
- End-to-end surface:
- UI/UX changes: auth command, status messages
- API/contract changes: auth storage API v1
- Data/state changes: token storage (owner: provider-auth)
- Permissions/authz changes: none
- Telemetry/observability: auth success/failure counts
- Architecture notes (debt prevention):
- Boundary rule respected: only provider-auth touches tokens
- Adapters/ACLs needed: yes, OAuth adapter around SDK
- Temporary seam: no
- Failure modes + fallback:
- OAuth cancel → return to CLI with guidance
- verification fails → prompt re-auth
- Rollout plan: gated by `feature.ai-commit-oauth`
- Success metrics:
- OAuth success rate
- % commits using stored auth
- Key risks reduced: auth usability, provider reliability

Slice 5 — “Include-unstaged commit (policy-driven)”

- User outcome: Developer can include unstaged tracked changes with explicit confirmation.
- Primary persona: Developer
- Owning module / boundary: git-context
- Touched modules: cli-shell, message-engine, config-policy
- In scope:
- `--include-unstaged` preview of files to stage
- confirm before staging
- stages tracked changes only (no new files)
- proposal + commit flow same as staged
- Out of scope (explicit):
- interactive staging
- untracked file inclusion
- partial file staging
- Constraints to keep it thin:
- tracked files only
- single confirmation prompt
- no hunk selection
- End-to-end surface:
- UI/UX changes: list + confirm for staging
- API/contract changes: none
- Data/state changes: git index update (owner: git-context)
- Permissions/authz changes: none
- Telemetry/observability: staging action count
- Architecture notes (debt prevention):
- Boundary rule respected: staging only in git-context
- Adapters/ACLs needed: no
- Temporary seam: no
- Failure modes + fallback:
- staging fails → abort without commit
- large set of files → summarize list
- Rollout plan: gated by `feature.ai-commit-include-unstaged`
- Success metrics:
- % usage of include-unstaged
- staging failure rate
- Key risks reduced: usability gap for common workflow

Slice 6 — “Large diff degradation + safety messaging”

- User outcome: Tool remains responsive and safe on large diffs with clear truncation warnings.
- Primary persona: Repo maintainer
- Owning module / boundary: message-engine
- Touched modules: git-context, config-policy, cli-shell, telemetry
- In scope:
- diff size limits + file count limits
- binary file summarization
- warning banner + safe fallback summarization
- configurable limits
- Out of scope (explicit):
- multi-commit splitting
- external diff summarizer
- Constraints to keep it thin:
- single truncation strategy
- binary handled as metadata only
- End-to-end surface:
- UI/UX changes: truncation warning, summary count
- API/contract changes: proposal includes “used_truncation” flag
- Data/state changes: none
- Permissions/authz changes: none
- Telemetry/observability: truncation occurrences, diff sizes
- Architecture notes (debt prevention):
- Boundary rule respected: git-context only reads diff; message-engine enforces limits
- Adapters/ACLs needed: no
- Temporary seam: no
- Failure modes + fallback:
- diff too large even after truncation → refuse with guidance
- binary-only changes → minimal message, suggest manual edit
- Rollout plan: gated by `feature.ai-commit-large-diff`
- Success metrics:
- truncation rate vs failures
- commit completion rate for large diffs
- Key risks reduced: performance, stability on large repos

Slice 7 — “Telemetry + privacy-safe logging”

- User outcome: Release/process owner can measure adoption and quality without exposing diffs.
- Primary persona: Release/process owner
- Owning module / boundary: telemetry
- Touched modules: cli-shell, message-engine, provider-auth, git-context, security-privacy
- In scope:
- event tracking for success/failure, latency, truncation, edit/regen
- opt-in verbose logging
- redaction guidance and safe defaults
- Out of scope (explicit):
- full analytics dashboard
- server-side aggregation
- Constraints to keep it thin:
- local metrics sink only (stdout/JSON or file)
- no diff content logging
- End-to-end surface:
- UI/UX changes: `--telemetry` flag and privacy notice
- API/contract changes: event schema v1
- Data/state changes: local metrics file (owner: telemetry)
- Permissions/authz changes: none
- Telemetry/observability: self-observing events
- Architecture notes (debt prevention):
- Boundary rule respected: modules emit events via telemetry API only
- Adapters/ACLs needed: no
- Temporary seam: no
- Failure modes + fallback:
- telemetry write failure → ignore, continue
- Rollout plan: gated by `feature.ai-commit-telemetry`
- Success metrics:
- event emission success rate
- opt-in rate
- Key risks reduced: adoption visibility, privacy compliance

5. Compact score table (slice → scores)

- Slice 1: Value 5, Learning 4, Risk 4, GTM 4
- Slice 2: Value 4, Learning 3, Risk 3, GTM 4
- Slice 3: Value 3, Learning 3, Risk 3, GTM 4
- Slice 4: Value 4, Learning 4, Risk 4, GTM 3
- Slice 5: Value 3, Learning 3, Risk 3, GTM 3
- Slice 6: Value 3, Learning 4, Risk 4, GTM 2
- Slice 7: Value 2, Learning 4, Risk 2, GTM 3

6. Top 3 risks and which slice answers each

- Auth UX friction blocks adoption → Slice 4
- Large diffs cause poor quality or failure → Slice 6
- Message quality/acceptance too low → Slice 1 + Slice 2

7. Debt Ledger + stabilization slices

- Debt Ledger:
- Hard-coded provider/model from Slice 1
- Payoff: Slice 3 (config precedence + selection)
- Stabilization slices: none required beyond Slice 3 (measurable removal of hard-code)

8. Slice Definition of Done (applies to every slice)

- A user can complete the slice’s outcome end-to-end
- Behind a flag with a rollback path
- Authz boundaries enforced where relevant
- Telemetry exists for success + failure (or a stated minimal form in early slices)
- Failure modes handled with safe fallback
- Architecture invariants respected (no boundary violations; ownership clear)
- Debt is either avoided or recorded with payoff
- Demo-able without “this part isn’t wired yet” excuses
