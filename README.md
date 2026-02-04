# cmt

Commit messages that read like a senior engineer wrote them.

AI-powered commit message generator CLI. Uses AI to analyze your staged changes and generate meaningful, conventional commit messages.

- **Interactive CLI** with beautiful terminal prompts
- **AI-powered** commit message generation using configurable providers (Anthropic, etc.)
- **Git integration** for seamless workflow
- **Customizable** commit types and message formats
- **Dry-run mode** to preview changes before committing

## Prerequisites

- [Bun](https://bun.sh/) (latest)
- Node.js 24+
- Git

## Install

```bash
bun install
```

## Quickstart

1. **Build the project:**

   ```bash
   bun run build
   ```

2. **Authenticate with your AI provider:**

   ```bash
   bun run start auth --provider anthropic
   ```

3. **Stage your changes and generate a commit:**

   ```bash
   git add .
   bun run start commit
   ```

## Usage

### Commands

#### `tool commit`

Generate and apply AI-powered commit messages.

```bash
bun run start commit [options]
```

| Flag                 | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `--dry-run`          | Preview changes without applying                      |
| `--yes`              | Skip confirmation prompts                             |
| `--edit`             | Edit generated message before committing              |
| `--regen`            | Regenerate commit message                             |
| `--include-unstaged` | Include unstaged changes                              |
| `--provider`         | Specify AI provider (default: anthropic)              |
| `--model`            | Specify AI model (default: claude-3-5-haiku-20241022) |
| `--types`            | Comma-separated list of commit types to use           |

#### `tool auth`

Authenticate with an AI provider.

```bash
bun run start auth [options]
```

| Flag         | Description                    |
| ------------ | ------------------------------ |
| `--provider` | Provider ID for authentication |

## Configuration

| Variable            | Description                                                                    | Required |
| ------------------- | ------------------------------------------------------------------------------ | -------- |
| `PI_API_KEY`        | API key for the provider (stored in authStorage if not provided)               | Yes      |
| `CMT_AUTH_PATH`     | Custom path for authentication storage (defaults to `~/.config/cmt/auth.json`) | No       |
| `CMT_PROVIDER_MODE` | Set to `mock` to use mock provider (for testing)                               | No       |

## Troubleshooting

| Symptom                    | Solution                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Task completion validation | Do not report task as done until: relevant tests are added/updated AND `bun test` has passed AND `bun run lint:fix` has passed |
| E2E test requirements      | E2E tests should run from time to time and before declaring tasks as done. Use isolated temp workspaces.                       |

## Development

### Build

```bash
bun run build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

### Test

```bash
bun test
```

### E2E Tests

```bash
bun test test/e2e
```

### Lint & Format

```bash
bun run lint:fix
```

Uses Biome for formatting and linting (configured in `biome.json`).

### Project Structure

| Directory            | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `src/cli`            | Main CLI entry point and command routing            |
| `src/cli-shell`      | Interactive CLI shell with commit and auth commands |
| `src/git-context`    | Git repository interaction and change tracking      |
| `src/message-engine` | AI-driven commit message generation                 |
| `src/provider-auth`  | Authentication with AI providers                    |
| `src/config-policy`  | Configuration and limits for commit generation      |

## Contributing

See documentation in `AGENTS.md`, `docs/TESTING.md`, and `docs/TYPESCRIPT.md` for development guidelines.

## License

Not specified (private package).
