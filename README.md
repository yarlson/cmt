
# cmt

CLI that generates commit messages from staged Git changes using configurable LLM providers and models.

## Scope

- Analyzes staged (and optionally unstaged) changes to propose a conventional commit message
- Supports provider/model selection per run
- Auth via OAuth (subscription plans) or API keys
- Works with Git in your current repo

## Quickstart

```bash
bun install
bun run build

# OAuth login (subscription-based providers)
bun run start auth --provider anthropic

# Generate commit message
git add .
bun run start commit
```

## Providers and models

The model registry ships with a curated list of tool-capable models per provider. You can pick a provider and model at runtime:

```bash
bun run start commit --provider anthropic --model claude-3-5-haiku-20241022
```

If a requested model is not found for the provider, the CLI falls back to that provider's first available model and reports the fallback.

**Default provider:** `anthropic`
**Default model:** `claude-3-5-haiku-20241022`

### OAuth (subscription plans)

Use OAuth to sign in with an existing subscription plan. Supported providers include:

- Anthropic Claude Pro/Max
- OpenAI ChatGPT Plus/Pro (Codex)
- GitHub Copilot
- Google Gemini CLI
- Google Antigravity

### API keys

Use API keys for providers that support direct key auth. Supported providers include:

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

## Multi-provider advantage

- Keep one workflow across providers and plans
- Switch models per task (latency, cost, or quality tradeoffs)
- Avoid lock-in when a provider rate-limits or changes pricing
- Use subscriptions for interactive work and API keys for automation

## Commands

```bash
# Commit message generation
bun run start commit [--dry-run] [--yes] [--edit] [--regen] [--include-unstaged] [--provider <id>] [--model <id>] [--types <list>]

# OAuth login
bun run start auth --provider <id>
```

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `PI_API_KEY` | Runtime API key for the selected provider | none |
| `CMT_AUTH_PATH` | Auth storage path | `~/.config/cmt/auth.json` |
| `CMT_PROVIDER_MODE` | Set to `mock` for tests | unset |

## Notes

- OAuth tokens and API keys are stored in the auth file unless provided at runtime.
- Provider lists and model catalogs are bundled with releases and updated by dependency upgrades.
