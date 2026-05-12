# gic

`gic` generates git commit messages with Claude Code for the repository you are
currently in, then lets you review and create the commit.

It is built for developers who want faster commits without losing intent:

- stages the current working tree
- asks Claude to inspect the repo and draft the message
- uses recent commits as style reference
- shows the proposed message before committing

## Status

Active. `gic` currently ships as an interactive CLI for local git repositories.

## Requirements

- `git`
- A git repository with changes to commit
- Claude Code CLI (`claude`) installed and authenticated

`gic` shells out to the `claude` CLI. Install Claude Code from
[claude.ai/code](https://claude.ai/code) and make sure `claude` works in your
shell before using `gic`.

## Install

### Quick install

```bash
curl -sSL https://raw.githubusercontent.com/yarlson/gic/master/install.sh | bash
```

The installer detects your OS and architecture and installs `gic` to
`/usr/local/bin`.

Install a specific version:

```bash
gic_VERSION=v0.2.0 curl -sSL https://raw.githubusercontent.com/yarlson/gic/master/install.sh | bash
```

```bash
curl -sSL https://raw.githubusercontent.com/yarlson/gic/master/install.sh | bash -s v0.2.0
```

### Homebrew

```bash
brew tap yarlson/gic
brew install gic
```

### Build from source

Requires Go 1.24 or newer.

```bash
git clone https://github.com/yarlson/gic.git
cd gic
go build
sudo mv gic /usr/local/bin/
```

## Quick start

Run `gic` inside a git repository:

```bash
gic
```

Add short context when the intent is not obvious from the diff:

```bash
gic fix the auth session regression
gic clarify retry behavior for failed syncs
```

Skip the confirmation prompt when you want `gic` to commit immediately:

```bash
gic --auto-approve
```

Show version information:

```bash
gic --version
gic version
```

## What `gic` does

When you run `gic`, it:

1. stages changes with `git add .`
2. reads repository status and recent commits
3. asks Claude Code to inspect the working tree and draft a commit message
4. shows the proposed message
5. creates the commit after confirmation, or immediately with `-y`

## Behavior to know

- `gic` stages all current changes before generating the commit message.
- Positional arguments after `gic` are forwarded to Claude as additional
  context.
- `gic` uses the Claude model and auth already configured in Claude Code.
- The generated message is intended to explain why the change was made, not
  just restate the diff.

## Troubleshooting

If `gic` fails before showing the UI, check these first:

- `claude` is installed and available on `PATH`
- Claude Code is already authenticated
- you are inside a git repository
- `git config user.name` and `git config user.email` are set

## Contributing

Use Go 1.24 or newer and run the same checks that CI runs before opening a
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
