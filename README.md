# cmt

`cmt` generates git commit messages with a local AI coding CLI for the
repository you are currently in, then lets you review and create the commit.

It is built for developers who want faster commits without losing intent:

- stages the current working tree
- asks the selected provider CLI to inspect the staged snapshot and draft the
  message
- shows the proposed message before committing

`cmt` supports two hardcoded providers:

- `claude` via the Claude Code CLI
- `codex` via the Codex CLI

Default provider: `claude`

Default models:

- `claude`: `sonnet`
- `codex`: Codex CLI default for the active auth mode

## Requirements

- `git`
- a git repository with changes to commit
- one supported provider CLI installed and authenticated:
  - Claude Code CLI (`claude`)
  - Codex CLI (`codex`)

`cmt` shells out to a local provider CLI. Install Claude Code from
[claude.ai/code](https://claude.ai/code) or Codex from the
[OpenAI Codex docs](https://platform.openai.com/docs/codex/overview), then make
sure the selected CLI works in your shell before using `cmt`.

Tested CLI versions:

- Claude Code CLI `2.1.139`
- Codex CLI `0.130.0`

These are documented test targets, not hard version gates. If a required CLI
flag or subcommand is missing, `cmt` fails during provider preflight with a
clear error instead of falling back.

## Install

### Quick install

```bash
curl -sSL https://raw.githubusercontent.com/yarlson/cmt/master/install.sh | bash
```

The installer detects your OS and architecture and installs `cmt` to
`/usr/local/bin`.

Install a specific version:

```bash
cmt_VERSION=v0.2.0 curl -sSL https://raw.githubusercontent.com/yarlson/cmt/master/install.sh | bash
```

```bash
curl -sSL https://raw.githubusercontent.com/yarlson/cmt/master/install.sh | bash -s v0.2.0
```

### Homebrew

```bash
brew tap yarlson/homebrew-tap
brew install cmt
```

### Build from source

Requires Go 1.25 or newer.

```bash
git clone https://github.com/yarlson/cmt.git
cd cmt
go build
sudo mv cmt /usr/local/bin/
```

## Quick start

Run `cmt` inside a git repository:

```bash
cmt
```

Add short context when the intent is not obvious from the diff:

```bash
cmt fix the auth session regression
cmt clarify retry behavior for failed syncs
```

Skip the confirmation prompt when you want `cmt` to commit immediately:

```bash
cmt --auto-approve
```

Use Codex for a single run:

```bash
cmt --provider codex
```

Use a different model for a single run:

```bash
cmt --model haiku
cmt --provider codex --model gpt-5
```

Set defaults with environment variables:

```bash
export CMT_PROVIDER=codex
export CMT_MODEL=gpt-5
```

Show version information:

```bash
cmt --version
cmt version
```

## What `cmt` does

When you run `cmt`, it:

1. stages changes with `git add .`
2. reads staged repository status
3. asks the selected provider CLI to inspect the repo and draft a commit message
4. shows the proposed message
5. creates the commit after confirmation, or immediately with `-y`

## Behavior to know

- Provider selection precedence is `--provider`, then `CMT_PROVIDER`, then the
  default provider `claude`.
- Model selection precedence is `--model`, then `CMT_MODEL`, then the selected
  provider's default model.
- `cmt` stages all current changes before generating the commit message.
- Positional arguments after `cmt` are forwarded to the provider as additional
  context.
- `cmt` preflights provider binary presence, required CLI capabilities, and
  auth status before any staging or UI work.
- `cmt` runs providers non-interactively. Codex runs in a read-only sandbox;
  Claude is constrained with non-interactive execution, no session
  persistence, disabled slash commands, and read-only git inspection commands
  as far as the CLI allows.
- When Codex is authenticated with ChatGPT, `cmt` defers to the Codex CLI's
  built-in default model unless you explicitly set `--model` or `CMT_MODEL`.
- Invalid model names are passed through to the provider CLI and fail there.
- The generated message is intended to explain why the change was made, not
  just restate the diff.
- The staged snapshot is the source of truth, but provider CLIs still inspect
  the live repository. That means unstaged-context leakage is reduced, not
  eliminated.

## Troubleshooting

If `cmt` fails before showing the UI, check these first:

- the selected provider CLI is installed and available on `PATH`
- the selected provider CLI is already authenticated
- you are inside a git repository
- `git config user.name` and `git config user.email` are set

## Contributing

Use Go 1.25 or newer and run the same checks that CI runs before opening a
change:

```bash
gofmt -w .
go vet ./...
go test -race ./...
golangci-lint run
```

## Support

Open an issue in this repository if the CLI behaves unexpectedly or if the
README is missing a setup path you needed.

## License

See [LICENSE](LICENSE).
