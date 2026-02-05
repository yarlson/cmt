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

# OAuth login (subscription-based providers)
cmt auth --provider anthropic

# Generate commit message
git add .
cmt commit
```

## Global install from source (bun)

Use `bun link` to expose the `cmt` binary globally from your working tree.

```bash
bun install
bun run build
bun link

# Verify
cmt --help
```

If `cmt` is not found, ensure `~/.bun/bin` is on your PATH.

To remove the global link:

```bash
bun unlink
```

## Commands

```bash
# Commit message generation
cmt commit [--dry-run] [--yes] [--edit] [--regen] [--include-unstaged] \
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
- `--edit` opens `$EDITOR` for a final tweak (TTY required)
- `--regen` regenerates once after the first proposal
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
  "model": "claude-3-5-haiku-20241022",
  "types": ["feat", "fix", "docs", "refactor", "test", "perf", "chore"],
  "subjectMaxLength": 72,
  "scopeMappings": [
    { "prefix": "src/cli", "scope": "cli" },
    { "prefix": "src/message-engine", "scope": "engine" }
  ]
}
```

Scope mappings use the longest matching path prefix to infer the commit scope.

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
bun run start providers
```

List models for a provider:

```bash
bun run start models --provider anthropic
```

Markdown output (copy/paste into docs):

```bash
bun run start providers --markdown
bun run start models --provider anthropic --markdown
```

Short output (ids only):

```bash
bun run start providers --short
bun run start models --provider anthropic --short
```

```bash
bun run start commit --provider anthropic --model claude-3-5-haiku-20241022
```

If a requested model is not found for the provider, the CLI falls back to that provider's first available model and reports the fallback.

**Default provider:** `anthropic`
**Default model:** `claude-3-5-haiku-20241022`

Default commit types: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `chore`, `build`, `ci`, `revert`.

### OAuth (subscription plans)

- Anthropic Claude Pro/Max
- OpenAI ChatGPT Plus/Pro (Codex)
- GitHub Copilot
- Google Gemini CLI
- Google Antigravity

### API keys

- Anthropic
- OpenAI
- Azure OpenAI
- Google Gemini
- Google Vertex
- Amazon Bedrock
- Mistral
- Groq
- Cerebras
- xAI
- OpenRouter
- Vercel AI Gateway
- ZAI
- OpenCode Zen
- Hugging Face
- Kimi For Coding
- MiniMax

## Notes

- OAuth tokens and API keys are stored in the auth file unless provided at runtime.
- Provider lists and model catalogs are bundled with releases and updated by dependency upgrades.
