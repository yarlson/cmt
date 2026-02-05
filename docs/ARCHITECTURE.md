# Architecture

## Purpose

`cmt` is a CLI that reads staged git changes, asks a model for a conventional
commit proposal, and optionally writes the commit.

## Stable boundaries

- CLI boundary: argument parsing and user interaction.
- Git boundary: repo validation, staging, diff collection, commit execution.
- Config policy: merge flags/env/local/global defaults and diff limits.
- Message engine: prompt construction, proposal parsing, formatting.
- Provider auth: auth storage, OAuth, model selection, provider calls.

## High-level flow (commit)

1. Parse args and decide command.
2. Validate repo state and gather staged diff within limits.
3. Resolve config (provider/model/types/limits/scope mapping).
4. Authenticate provider and request proposal.
5. Format and optionally edit proposal; commit if approved.

## Data and config

- Local config (repo): `.cmt.json`.
- Global config: `~/.config/cmt/config.json`.
- Auth storage: `~/.config/cmt/auth.json` (or `CMT_AUTH_PATH`).
- Env overrides: `CMT_PROVIDER`, `CMT_MODEL`, `CMT_TYPES`,
  `CMT_SUBJECT_MAX_LENGTH`, `CMT_MAX_DIFF_BYTES`, `CMT_MAX_FILES`,
  `PI_API_KEY`.

## Tests

- Unit tests live under `test/*` (bun test).
- E2E tests run the CLI under `test/e2e/*`.

## Build and runtime

- TypeScript compiled by `tsc` to `dist/`.
- CLI entry is the compiled `dist/cli/index.js` via `package.json` `bin`.

## How to verify boundaries in code

- CLI boundary: search for command entry/dispatch and prompt handling.
- Git boundary: search for git command execution and diff collection.
- Config policy: search for config resolution and env parsing.
- Provider auth: search for OAuth/auth storage and model registry usage.
