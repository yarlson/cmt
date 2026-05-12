# cmt

`cmt` generates git commit messages with Claude Code for the repository you are
currently in, then lets you review and create the commit.

It is built for developers who want faster commits without losing intent:

- stages the current working tree
- asks Claude to inspect the repo and draft the message
- uses recent commits as style reference
- shows the proposed message before committing

By default, `cmt` uses the `sonnet` Claude model. For this workflow, `sonnet`
is the best default tradeoff: it is better than `haiku` at reading diffs,
recovering intent, and writing specific commit bodies for refactors or larger
changes, while being faster and cheaper than `opus`. Use `haiku` when you want
lower latency over nuance, and `opus` when a change is unusually broad or
subtle and you want the strongest reasoning available.

## Requirements

- `git`
- a git repository with changes to commit
- Claude Code CLI (`claude`) installed and authenticated

`cmt` shells out to the `claude` CLI. Install Claude Code from
[claude.ai/code](https://claude.ai/code) and make sure `claude` works in your
shell before using `cmt`.

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

Use a different Claude model for a single run:

```bash
cmt --model haiku
cmt --model opus
```

Show version information:

```bash
cmt --version
cmt version
```

## What `cmt` does

When you run `cmt`, it:

1. stages changes with `git add .`
2. reads repository status and recent commits
3. asks Claude Code to inspect the working tree and draft a commit message
4. shows the proposed message
5. creates the commit after confirmation, or immediately with `-y`

## Behavior to know

- `cmt` stages all current changes before generating the commit message.
- Positional arguments after `cmt` are forwarded to Claude as additional
  context.
- `cmt` uses Claude Code authentication and defaults to the `sonnet` model.
- Override the model with `--model` when you want a different speed/quality
  tradeoff.
- The generated message is intended to explain why the change was made, not
  just restate the diff.

## Troubleshooting

If `cmt` fails before showing the UI, check these first:

- `claude` is installed and available on `PATH`
- Claude Code is already authenticated
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
