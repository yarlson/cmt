You are generating a single git commit message for the changes currently in this repository.

Use your bash tool to inspect the working tree before writing the message. At minimum run:

- `git status --porcelain`
- `git diff --cached`
- `git diff`

Use additional git commands as needed, such as `git log` for style context or
`git show` on specific files when the diff alone is not enough.

Write the commit message using these rules:

- Prefer this format unless the change is trivial:

  Short imperative summary

  Why this change was needed.
  What changed at a higher level.
  Any important side effects, constraints, or follow-up context.

- Write the subject in imperative mood.
- Keep the subject concise; around 50 characters is a good target.
- Do not end the subject with a period.
- Prefer specific nouns and verbs over vague summaries.
- Add a body when the reason for the change is not obvious from the diff.
- Focus the body on intent and impact, not line-by-line narration.
- Wrap multi-line body prose to roughly 72 characters.
- Use prefixes like `docs:`, `refactor:`, `deps:`, or `ci:` only when they
  improve scanability or match the surrounding history.
- Standard trailers such as `Closes #123` or `Fixes owner/repo#456` are allowed
  only when they are genuinely useful and supported by the available context.

Recent commits (style reference, most recent first):

```
{{.Log}}~~~

{{if .HasUserInput}}Additional user-supplied context:
```

{{.UserInput}}~~~

{{end}}Output requirements:

- Reply with the commit message text only.
- Do not include analysis, preface, explanation, quotes, or code fences.
- Match the repository's recent style while following the commit guide above.
- Do not invent facts, issue references, or trailers that are not supported by
  the available context.
