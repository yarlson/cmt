# cmt

Generate conventional commit messages from your staged Git diff, with provider/model control per run.

## What it covers

- Reads staged changes and proposes a conventional commit message
- Optional auto-stage of tracked unstaged files
- Configurable commit types, subject length, and scope mappings
- OAuth (subscription plans) or API keys for auth
- Multi-provider switching with model fallback

## Quickstart

```bash
bun install
bun run build
bun link

# OAuth login (subscription-based providers)
cmt auth --provider anthropic

# Generate commit message
git add .
cmt commit
```

If `cmt` is not found, ensure `~/.bun/bin` is on your PATH.

To remove the global link:

```bash
bun unlink
```

## Commands

```bash
# Commit message generation
cmt commit [--dry-run] [--yes] [--include-unstaged] \
  [--provider <id>] [--model <id>] [--types <list>]

# OAuth login
cmt auth --provider <id>

# Provider discovery
cmt providers [--markdown] [--short]

# Model discovery
cmt models [--provider <id>] [--markdown] [--short]
```

If you have not linked the binary, use `bun run start` instead of `cmt`.

Common flags:

- `--include-unstaged` stages tracked unstaged files (untracked files stay uncommitted)
- `--types` comma-separated list of commit types (overrides defaults)
- Interactive prompts offer `yes` / `no` / `edit` (edit opens `$EDITOR` with the draft)
- `--dry-run` prints the message without committing
- `--yes` accepts prompts for non-interactive shells

## Configuration

Global config: `~/.config/cmt/config.json` (created on first run with defaults; edit manually).
Local config: `.cmt.json` in the repo root (override with `CMT_CONFIG_PATH`).

Resolution order: flags → env → local config → global config → defaults.
Most users keep settings in the global config and update it directly.

Config format (JSON):

```json
{
  "schemaVersion": 1,
  "provider": "anthropic",
  "model": "claude-haiku-4-5",
  "types": ["feat", "fix", "docs", "refactor", "test", "perf", "chore"],
  "subjectMaxLength": 72,
  "scopeMappings": [
    { "prefix": "src/cli", "scope": "cli" },
    { "prefix": "src/message-engine", "scope": "engine" }
  ]
}
```

Fields:

- `schemaVersion`: config schema version (current: `1`). Optional, but if set must be `1`.
- `provider`: provider id (see `cmt providers`).
- `model`: model id for the provider (see `cmt models --provider <id>`).
- `types`: list of allowed commit prefixes (example: `feat`, `fix`). The model
  must choose one of these; other values are rejected.
- `subjectMaxLength`: max characters for the subject line (recommended 50-72).
- `scopeMappings`: optional rules that map file path prefixes to a scope. If a
  staged file path starts with a prefix, the scope is set (longest prefix wins).
  Example: `src/cli` → `feat(cli): ...`. Omit if you don't use scopes.

Unknown fields are ignored. Invalid values are skipped with warnings and defaults are used.

Scope mappings use the longest matching path prefix to infer the commit scope
from staged file paths.

Environment variables:

- `CMT_PROVIDER`, `CMT_MODEL`, `CMT_TYPES`, `CMT_SUBJECT_MAX_LENGTH`
- `CMT_MAX_DIFF_BYTES`, `CMT_MAX_FILES` (diff bounds)
- `CMT_AUTH_PATH` (override auth storage path)
- `PI_API_KEY` (API key injection at runtime)

## Providers and auth

The model registry ships with a curated list of tool-capable models per provider.
Full provider and model catalog: [docs/PROVIDERS.md](docs/PROVIDERS.md).

List providers (ids + OAuth support):

```bash
cmt providers
```

List models for a provider:

```bash
cmt models --provider anthropic
```

Markdown output (copy/paste into docs):

```bash
cmt providers --markdown
cmt models --provider anthropic --markdown
```

Short output (ids only):

```bash
cmt providers --short
cmt models --provider anthropic --short
```

```bash
cmt commit --provider anthropic --model claude-haiku-4-5
```

If a requested model is not found for the provider, the CLI falls back to that provider's first available model and reports the fallback.

**Default provider:** `anthropic`
**Default model:** `claude-haiku-4-5`

Default commit types: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `chore`, `build`, `ci`, `revert`.

### Auth

- OAuth and API keys are supported; see `docs/PROVIDERS.md` for coverage.
- Use `cmt providers` / `cmt models` to validate what is bundled in your build.
- Tokens and keys are stored in the auth file unless provided at runtime.
