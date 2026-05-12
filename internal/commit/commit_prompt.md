You are generating a single git commit message for the changes currently staged
in this repository.

Provider-specific inspection instructions:

{{.Overlay}}~~~

Write the commit message using these rules:

- Prefer a subject-only commit message when it is sufficient.
- Add a body only when the reason, impact, or constraint would not already be
  obvious to a reviewer reading `git diff`.
- If you add a body, prefer this shape:

  Short imperative summary

  Why this change was needed.
  Any important user-visible, operational, or follow-up context.

- Write the subject in imperative mood.
- Keep the subject concise; around 50 characters is a good target.
- Do not end the subject with a period.
- Prefer specific nouns and verbs over vague summaries.
- Assume the reader can inspect `git diff`; do not restate the obvious
  implementation details from the patch.
- Focus the body on intent and impact, not line-by-line narration.
- Do not include sections like `Key changes:`, file lists, symbol lists, or
  bullet-point changelogs unless they are truly necessary to understand the
  commit.
- Wrap multi-line body prose to roughly 72 characters.
- Use staged changes as the source of truth.
- Match the repository's recent style when your inspection supports it.
- Use prefixes like `docs:`, `refactor:`, `deps:`, or `ci:` only when they
  improve scanability or match the surrounding history.
- Standard trailers such as `Closes #123` or `Fixes owner/repo#456` are allowed
  only when they are genuinely useful and supported by the available context.

{{if .HasUserInput}}Additional user-supplied context:

```

{{.UserInput}}~~~

{{end}}Output requirements:

- Reply with the commit message text only.
- Do not include analysis, preface, explanation, quotes, or code fences.
- Do not invent facts, issue references, or trailers that are not supported by
  the available context.
```
