### 1) Slice identity

- **Slice name:** CLI prompt/output design system revamp
- **One-sentence outcome (customer-visible):** The CLI presents a premium, consistent prompt and output style with clear status, readable blocks, and polished microcopy.
- **Primary persona:** Developer
- **Spine step / milestone it maps to:** All CLI interactions (prompt + output)
- **Customer promise (truthful after shipping):** "Every response is clear, consistent, and actionable, with errors that tell you exactly what to do next."
- **Non-goals (explicit):**
- New CLI commands or flags
- Changes to business logic or AI behavior
- Localization or multi-language support
- Interactive TUI or rich widgets
- Theme editor or user-defined palettes

### 2) Scope and constraints

- **In scope:**
- Design tokens mapped to the provided color table (chalk)
- Standard prompt line format and status line format
- Output blocks: Decision, Output, Next steps, Errors, Warnings
- Microcopy library for acknowledgements, progress, errors, and next actions
- Diff and code styling conventions (keyword/type/string color roles)
- Monochrome fallback when color is disabled
- **Out of scope:**
- Any behavioral changes to commit flow
- New telemetry schema beyond optional UI mode tag
- Terminal detection beyond standard TTY + NO_COLOR
- Updates to tests unrelated to rendering
- **Constraints to keep it thin:**
- ASCII-only output
- One-line status messages
- Max 3 next-step actions
- No emojis or decorative symbols

### 3) Architecture & ownership (debt prevention)

- **Owning module / bounded context:** cli-shell
- **Touched modules (if any):**
- git-context: diff rendering hooks
- message-engine: rationale summary text shape
- **Data ownership:**
- cli-shell owns tokens, copy, and renderers
- **Integration seams:**
- `ui/tokens` exports color roles and styles
- `ui/render` provides prompt/output block helpers
- **Guardrails:**
- No direct chalk usage outside cli-shell renderers
- Domain modules return data, not preformatted strings
- All user-facing copy lives in cli-shell

### 4) User journey (happy path)

1. Developer runs `tool commit`.
2. Prompt renders with intent label and input in consistent style.
3. Tool shows a single-line "Thinking" status and then a Decision block.
4. Output and Next steps appear with consistent layout and microcopy.
5. User follows one of the numbered next steps.

### 5) Edge cases and failure handling

- NO_COLOR or non-TTY -> monochrome tokens.
- Narrow terminals -> wrap blocks without truncating meaning.
- Long file paths -> shorten with middle ellipsis.
- Errors before prompt -> use minimal Error block format.
- Diff output piped -> keep ANSI disabled.
- Mixed stdout/stderr -> ensure errors still readable.
- Unknown status -> default to neutral "Working" line.

### 6) Observability & success metrics

- **Events (optional):**
- `ui_mode_color_enabled`
- `ui_mode_monochrome`
- **Metrics:**
- user-accepted next steps rate (manual QA)
- time-to-action from prompt to next step
- reduction in support issues about confusing output
- **Logs:**
- render fallback activated

### 7) Rollout & rollback

- **Rollout:** internal -> beta -> GA
- **Ramp plan:** 10% -> 50% -> 100% for interactive sessions
- **Rollback plan:** disable `feature.cli-revamp` and return to legacy formatting

### 8) Acceptance (must be runnable)

**Acceptance Steps (staging-ready checklist)**

1. Run `tool commit` in TTY with color on -> prompt, status, Decision, Output, Next steps render with new layout.
2. Set `NO_COLOR=1` -> monochrome output still readable.
3. Pipe output to file -> no ANSI escape codes.
4. Trigger an error (no staged changes) -> Error block is clear and actionable.
5. Render diff preview -> additions and highlighted identifiers use correct color roles.

**Acceptance Criteria (summary)**

- All user-visible output conforms to the token system.
- Microcopy is consistent, concise, and actionable.
- Monochrome fallback is automatic and readable.
- Errors and warnings are distinct and guide next action.

### 9) Tech debt ledger (only if needed)

- **Debt:** No user-configurable theming in this slice
- **Payoff:** future "Theme overrides" slice with config-policy integration

### 10) GTM mini-notes (tiny but real)

- **Who benefits now:** Developers who want clear, premium CLI output
- **2-minute demo script:** Run `tool commit`, highlight the new prompt, Decision block, and next steps; show NO_COLOR fallback
- **Release note blurb:** "New premium CLI design system: clearer prompts, cleaner output, and more actionable errors."
- **Known limitations:** No custom themes yet; monochrome fallback only
