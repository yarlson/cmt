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

Here’s an Apple‑grade CLI prompt/output design system, voiced by a GTM lead, VP of Design, and Principal Engineer. It includes color mapping with chalk, copy and micro‑copy, and a cohesive interaction model.

### Vision

- **GTM Lead:** “Make every prompt feel like a premium product moment—clear intent, confident guidance, zero confusion.”
- **VP Design:** “Quietly iconic: high contrast, soft rhythm, and typography that breathes. The UI should whisper ‘premium’.”
- **Principal Engineer:** “Deterministic, accessible, and fast. Same inputs must yield the same output shape every time.”

### Design Principles

- **Clarity first:** every line communicates state, intent, or action.
- **Predictable structure:** consistent layout for prompt, output, status, and next actions.
- **Low noise:** minimal ornament; color signals meaning, not decoration.
- **Grace under failure:** errors are polite, precise, and actionable.
- **Extensibility:** all tokens are themable and exposed.

### Token System (Chalk)

- `textDefault` `#e6e6e6` (normal identifiers, core content)
- `textSecondary` `#c5c8c6` (hints, less‑emphasized text)
- `kw` `#b294bb` (keywords/modifiers)
- `const` `#de935f` (flags/constants)
- `fn` `#f0c674` (function/method names)
- `type` `#8abeb7` (type names/annotations)
- `import` `#81a2be` (imports/modules/paths)
- `string` `#b5bd68` (strings)
- `error` `#cc6666` (errors/important tokens)
- `diffAdd` `#8ec07c` (diff additions)
- `thinking` `#d19a66` (“Thinking:” output)
- `highlight` `#61afef` (focused identifiers)

### Chalk Usage Snippet

```ts
import chalk from "chalk";

const c = {
  textDefault: chalk.hex("#e6e6e6"),
  textSecondary: chalk.hex("#c5c8c6"),
  kw: chalk.hex("#b294bb"),
  const: chalk.hex("#de935f"),
  fn: chalk.hex("#f0c674"),
  type: chalk.hex("#8abeb7"),
  import: chalk.hex("#81a2be"),
  string: chalk.hex("#b5bd68"),
  error: chalk.hex("#cc6666"),
  diffAdd: chalk.hex("#8ec07c"),
  thinking: chalk.hex("#d19a66"),
  highlight: chalk.hex("#61afef"),
};
```

### Information Architecture

- **Prompt line:** `›` + short intent label + user input
- **Status line:** state tags (`Thinking`, `Working`, `Done`, `Needs input`)
- **Output blocks:** grouped by task stage; each block starts with a short title
- **Action footer:** “Next steps” with 1–3 numbered options

### Core Prompt Styles

- **Standard prompt**
  - `›` in `textSecondary`
  - Intent label in `highlight`
  - User input in `textDefault`
- **Thinking**
  - Prefix: `Thinking:` in `thinking`
  - Body in `textSecondary`
- **Warnings**
  - Prefix: `Note:` in `const`
  - Body in `textSecondary`
- **Errors**
  - Prefix: `Error:` in `error`
  - Body in `textDefault`

### Copy System (GTM Voice)

- Short, confident, and outcome‑oriented
- Avoid “maybe”, “try”, and “hopefully”
- State what happened, why it matters, and what to do next

### Micro‑copy Library

- **Acknowledgement**
  - “Got it. I’ll take it from here.”
  - “Understood. Processing your request.”
- **Thinking**
  - “Thinking: mapping tasks to steps.”
  - “Thinking: checking repository state.”
- **Progress**
  - “Working: preparing changes.”
  - “Working: validating output.”
- **Success**
  - “Done. Changes are ready.”
  - “All set. You can review the diff.”
- **Error**
  - “Error: missing configuration file.”
  - “Error: command failed. See details below.”
- **Next steps**
  - “Next steps:”
  - “1) Review changes”
  - “2) Run tests”
  - “3) Create commit”

### Output Patterns

- **Decision block**
  - Title: `Decision` in `highlight`
  - Bullet list in `textDefault`
- **Diff block**
  - Added lines in `diffAdd`
  - Context lines in `textSecondary`
  - Highlight identifiers with `highlight`
- **Code block**
  - Keywords in `kw`
  - Types in `type`
  - Functions in `fn`
  - Strings in `string`
  - Imports in `import`
