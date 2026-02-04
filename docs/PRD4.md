### 1) Slice identity

- **Slice name:** OAuth authentication and persistence
- **One-sentence outcome (customer-visible):** Developers can authenticate via OAuth and reuse credentials in future runs without re-auth.
- **Primary persona:** Developer
- **Spine step / milestone it maps to:** First-time setup + auth
- **Customer promise (truthful after shipping):** "You can log in via OAuth once and your commits will use that auth automatically afterward."
- **Non-goals (explicit):**
- Multiple providers simultaneously
- Token refresh beyond SDK default behavior
- API key auth changes
- Include-unstaged flow
- Telemetry dashboards
- Windows support

### 2) Scope and constraints

- **In scope:**
- `tool auth --provider X` OAuth flow
- Store OAuth token securely for reuse
- Auth verification ping to provider
- Use stored OAuth token for subsequent `tool commit`
- **Out of scope:**
- Multi-account switching
- Org-level permissions or SSO
- Offline auth caching beyond token storage
- Token refresh UI
- Config precedence changes
- **Constraints to keep it thin:**
- One OAuth provider at a time
- Interactive flow only
- Minimal scopes only
- No background refresh daemon

### 3) Architecture & ownership (debt prevention)

- **Owning module / bounded context:** provider-auth
- **Touched modules (if any):**
- cli-shell: auth prompts and status output
- security-privacy: token storage and redaction policy
- **Data ownership:**
- provider-auth owns OAuth tokens and auth identity metadata
- **Integration seams:**
- OAuth adapter wraps Pi Agent SDK
- provider-auth exposes auth status via public API only
- **Guardrails:**
- no token access outside provider-auth
- no SDK usage outside provider-auth
- no shared/common token helpers

### 4) User journey (happy path)

1. Developer runs `tool auth --provider X`.
2. CLI opens OAuth flow and shows login instructions.
3. Developer completes OAuth in browser.
4. Tool verifies auth with a lightweight API call.
5. Tool stores token securely.
6. Developer runs `tool commit` later; token is reused without prompts.

### 5) Edge cases and failure handling

- OAuth canceled by user -> exit with guidance.
- Provider denies access -> error, no token stored.
- Network timeout during OAuth -> error with retry suggestion.
- Verification ping fails -> token not stored; prompt to retry.
- Token storage permission error -> error and exit.
- Existing token present -> prompt to replace.
- Provider unavailable -> error; auth not completed.
- Token expired -> prompt to re-auth on next use.
- Non-interactive shell -> auth command fails with guidance.
- Invalid provider name -> error and list supported providers.

### 6) Observability & success metrics

- **Events:**
- `oauth_started`
- `oauth_completed`
- `oauth_failed`
- `auth_token_stored`
- `auth_verification_failed`
- **Metrics:**
- OAuth completion rate
- auth verification success rate
- re-auth rate
- **Logs:**
- provider name, error codes (no tokens)
- **Dashboards/alerts (minimal):**
- OAuth failure spike
- verification failure spike

### 7) Rollout & rollback

- **Rollout:** internal -> beta -> GA
- **Ramp plan:** enable internal, then 20% -> 60% -> 100%; stop on auth failure spikes
- **Rollback plan:** revert release; OAuth command unavailable; API key flow remains

### 8) Acceptance (must be runnable)

**Acceptance Steps (staging-ready checklist)**

1. Setup: ensure no existing auth tokens.
2. Happy path verification: run `tool auth --provider X`, complete OAuth, verify token stored; run `tool commit` without re-auth.
3. Permission verification: run with invalid provider -> error; run in non-interactive shell -> guidance.
4. Failure-mode verification: cancel OAuth -> exit; verification failure -> no token stored; storage error -> error.
5. Telemetry verification: `oauth_started` and `auth_token_stored` emitted.

**Acceptance Criteria (summary)**

- OAuth flow completes and stores token securely.
- Stored token is reused without prompting.
- Failure to verify auth prevents token storage.
- Token data never appears in logs.

### 9) Tech debt ledger (only if needed)

- **Debt:** None

### 10) GTM mini-notes (tiny but real)

- **Who benefits now:** Developers who prefer OAuth login over API keys
- **2-minute demo script:** Run `tool auth`, complete OAuth, then run `tool commit` without prompts
- **Release note blurb:** "Authenticate via OAuth once and reuse credentials for future commits."
- **Known limitations:** Single provider at a time, interactive only
