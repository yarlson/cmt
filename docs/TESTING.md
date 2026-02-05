# Testing

## Unit tests (default)

- Colocate: `foo.ts` → `foo.test.ts`
- Fast, deterministic, no network calls.
- Mock pi SDK only at boundaries (wrappers/adapters), not deep inside logic.

## Quality gates

- Before marking work done, run `bun test` and `bun run lint:fix`.
- Run `bun test:e2e` before declaring completion for CLI behavior changes.

## E2E tests (user POV)

E2E = run the CLI like a user would and assert on user-visible outcomes
(exit code, stdout/stderr, files produced/modified).

- Location: `test/e2e/`
- Organize by user journeys (not internal modules).
- Each test uses an isolated temp workspace.
- Avoid brittle assertions on huge logs; prefer exit codes + filesystem results.
- E2E tests always run live.
