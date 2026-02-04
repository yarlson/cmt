# cmt (TypeScript)

## Tooling

- Runtime: Node.js 24+
- Package manager: bun
- TypeScript: 5.9 (NodeNext, ES2022)
- Key dependency: `@mariozechner/pi-coding-agent`[docs](../turbo/lgtm_ts/docs)

## Commands

```bash
bun install
bun run build       # tsc
bun run start       # bun dist/cli/index.js
bun test
bun run lint:fix    # biome check
bun test:e2e        # e2e tests, run them from time to time, and before you say the task has been done
```

## Done means validated

Do **not** report a task as “done” until:

- relevant tests are added/updated **and** `bun test` has been run successfully
- `bun run lint:fix` has been run successfully

## More guidance (progressive disclosure)

- TypeScript conventions: `docs/TYPESCRIPT.md`
- Testing strategy & E2E rules: `docs/TESTING.md`
- Architecture notes (when present): `docs/ARCHITECTURE.md`
