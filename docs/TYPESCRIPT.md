# TypeScript conventions

- Prefer `const` + immutability.
- Use `interface` over `type` for object shapes.
- Exported functions: explicit return types.
- No `any`. Use `unknown` and narrow.
- Errors: throw `Error` subclasses with context (never throw strings).
- Async: handle rejections; prefer `async/await` over `.then()`.
