### 1) Slice identity

- **Slice name:** Provider selection and config precedence
- **One-sentence outcome (customer-visible):** Maintainers can configure provider/model and Conventional Commit rules via flags, env, or config with predictable precedence.
- **Primary persona:** Repo maintainer
- **Spine step / milestone it maps to:** Configure commit rules for consistent outcomes
- **Customer promise (truthful after shipping):** "Your repo can enforce preferred provider/model and commit conventions with clear precedence rules."
- **Non-goals (explicit):**
- OAuth authentication
- Include-unstaged staging
- Interactive config editor
- Repo auto-detection of policies
- Telemetry dashboards
- Windows support

### 2) Scope and constraints

- **In scope:**
- Flags, env vars, and config file precedence
- Provider and model selection
- Configurable type set
- Subject length limit
- Path prefix -> scope mapping
- Config read location and validation
- **Out of scope:**
- Multiple config formats
- Remote config or team sync
- Lint enforcement that blocks commits
- OAuth flow
- Multi-provider fallback selection
- Include-unstaged flow
- **Constraints to keep it thin:**
- Single config file format
- Scope mapping is prefix-only
- Defaults remain if config invalid
- No repo policy auto-discovery

### 3) Architecture & ownership (debt prevention)

- **Owning module / bounded context:** config-policy
- **Touched modules (if any):**
- message-engine: reads types and limits
- provider-auth: reads provider/model selection
- cli-shell: surfaces effective config
- **Data ownership:**
- config-policy owns config data and precedence resolution
- **Integration seams:**
- Sync contract for config schema v1
- No module reads config files directly except config-policy
- **Guardrails:**
- config-policy is the only module reading config files/env
- no shared/common module created
- public API only across module boundaries

### 4) User journey (happy path)

1. Maintainer creates a config file with provider/model and types.
2. Developer runs `tool commit`.
3. CLI loads config and resolves precedence with flags/env.
4. Tool prints effective provider/model (in verbose mode).
5. Message-engine generates proposal using configured rules.
6. Preview shows Conventional Commit aligned with config.
7. Developer confirms and commit succeeds.

### 5) Edge cases and failure handling

- Config file missing -> use defaults and warn.
- Config invalid schema -> warn and ignore invalid sections.
- Unknown provider -> error and exit.
- Unknown model -> fallback to provider default.
- Empty type list -> use default types.
- Subject length too short/long -> warn only.
- Scope mapping has no match -> scope omitted.
- Conflicting flags/env -> apply documented precedence and log.
- Non-readable config file -> warn and use defaults.
- Config file contains secrets -> warn; do not log values.

### 6) Observability & success metrics

- **Events:**
- `config_loaded`
- `config_invalid`
- `config_fallback_used`
- `effective_config_resolved`
- **Metrics:**
- config load success rate
- invalid config rate
- override usage rate (flags/env)
- **Logs:**
- resolved provider/model (no secrets)
- precedence path used
- **Dashboards/alerts (minimal):**
- config invalid spike
- unknown provider errors

### 7) Rollout & rollback

- **Feature flag:** `feature.ai_commit_config` (default off)
- **Gating:** internal -> beta -> GA
- **Ramp plan:** enable for internal, then 30% -> 70% -> 100%; stop on config-related failures
- **Rollback plan:** disable flag; tool ignores config and reverts to defaults

### 8) Acceptance (must be runnable)

**Acceptance Steps (staging-ready checklist)**

1. Setup: create config file with provider/model/types; enable flag.
2. Happy path verification: run `tool commit`, confirm preview uses configured type set and scope mapping.
3. Permission verification: set invalid provider -> error; set unreadable config -> warning and defaults.
4. Failure-mode verification: invalid schema -> warning; conflicting env/flag -> precedence applied; unknown model -> fallback.
5. Telemetry verification: `config_loaded` event emitted; `config_invalid` when applicable.
6. Rollback verification: disable flag; config ignored and defaults used.

**Acceptance Criteria (summary)**

- Flags/env/config precedence is deterministic and documented.
- Provider/model selection affects proposal generation.
- Invalid config never blocks commit; defaults used.
- Scope mapping applies only when path prefix matches.
- Config-related events are emitted.
- Flag off restores default behavior.

### 9) Tech debt ledger (only if needed)

- **Debt:** None

### 10) GTM mini-notes (tiny but real)

- **Who benefits now:** Teams that require consistent commit conventions
- **2-minute demo script:** Show config file, run `tool commit`, highlight configured type/scope in preview
- **Release note blurb:** "Configure provider/model and Conventional Commit rules via flags, env, or config with clear precedence."
- **Known limitations:** Prefix-only scope mapping, single config format
