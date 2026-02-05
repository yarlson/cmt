# cmt

Generate conventional commit messages from staged Git diffs.

## Why this exists

- Creates a conventional commit message from the exact staged diff.
- Keeps types/scopes consistent across a team via config.
- Supports OAuth or API keys and multiple providers/models with fallback.

## Quickstart

```bash
bun install
bun run build
bun link

# OAuth login (subscription-based providers)
cmt auth --provider anthropic

# Generate commit message from staged changes
git add .
cmt commit
```

If `cmt` is not found, ensure `~/.bun/bin` is on your PATH. If you have not
linked the binary, use `bun run start` instead of `cmt`.

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

Common flags:

- `--include-unstaged` stages tracked unstaged files (untracked files stay uncommitted)
- `--types` comma-separated list of commit types (overrides defaults)
- `--dry-run` prints the message without committing
- `--yes` accepts prompts for non-interactive shells

Interactive prompts offer `yes` / `no` / `edit` (edit opens `$EDITOR`).

## Configuration

Global config: `~/.config/cmt/config.json` (created on first run with defaults).
Local config: `.cmt.json` in the repo root (override with `CMT_CONFIG_PATH`).

Resolution order: flags → env → local config → global config → defaults.

Config format (JSON):

```json
{
  "schemaVersion": 1,
  "provider": "anthropic",
  "model": "claude-haiku-4-5",
  "types": ["feat", "fix", "docs", "refactor", "test", "perf", "chore"],
  "subjectMaxLength": 72,
  "maxDiffBytes": 20000,
  "maxFileCount": 50,
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
- `maxDiffBytes`: max diff size (bytes) sent to the model.
- `maxFileCount`: max number of files included in the diff summary.
- `scopeMappings`: optional rules that map file path prefixes to a scope. If a
  staged file path starts with a prefix, the scope is set (longest prefix wins).
  Example: `src/cli` → `feat(cli): ...`. Omit if you don't use scopes.

Unknown fields are ignored. Invalid values are skipped with warnings and defaults are used.

Environment variables:

- `CMT_PROVIDER`, `CMT_MODEL`, `CMT_TYPES`, `CMT_SUBJECT_MAX_LENGTH`
- `CMT_MAX_DIFF_BYTES`, `CMT_MAX_FILES` (diff bounds)
- `CMT_AUTH_PATH` (override auth storage path)
- `PI_API_KEY` (API key injection at runtime)

Defaults (if not overridden by config/env/flags):

- Provider: `anthropic`
- Model: `claude-haiku-4-5`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `chore`, `build`, `ci`, `revert`

## Providers and auth

Full provider and model catalog: [docs/PROVIDERS.md](docs/PROVIDERS.md).

List providers (ids + OAuth support):

```bash
cmt providers
```

List models for a provider:

```bash
cmt models --provider anthropic
```

Auth notes:

- OAuth and API keys are supported; see [docs/PROVIDERS.md](docs/PROVIDERS.md).
- Tokens and keys are stored in the auth file unless provided at runtime.

## Development

```bash
bun run build
bun test
bun test:e2e
bun run lint:fix
```
