import type { CommitDiff } from "./types.js";

export const DEFAULT_COMMIT_TYPES = [
  "feat",
  "fix",
  "docs",
  "refactor",
  "test",
  "perf",
  "chore",
  "build",
  "ci",
  "revert",
];

export interface CommitPromptInput {
  diff: CommitDiff;
  allowedTypes: string[];
  subjectMaxLength: number;
}

export function buildCommitPrompt(input: CommitPromptInput): string {
  const { diff, allowedTypes, subjectMaxLength } = input;
  const fileList = diff.files.join("\n");
  const binaryList =
    diff.binaryFiles.length > 0
      ? `Binary files:\n${diff.binaryFiles.join("\n")}`
      : "Binary files: none";
  const truncationNote =
    diff.diffTruncated || diff.filesTruncated
      ? "Note: diff/file list was truncated for safety."
      : "";

  return [
    "You are a commit message generator.",
    "Return ONLY valid JSON with these keys:",
    "type, scope (optional), subject, body (optional), footers (optional array), rationale (optional).",
    `Allowed types: ${allowedTypes.join(", ")}.`,
    `Subject must be imperative, <= ${subjectMaxLength} chars.`,
    "Do not include markdown fences or extra text.",
    "",
    "Staged file summary:",
    fileList.length > 0 ? fileList : "(no files)",
    binaryList,
    `Files changed: ${diff.totalFiles}`,
    `Lines added: ${diff.stats.addedLines}, removed: ${diff.stats.removedLines}`,
    truncationNote,
    "",
    "Staged diff (may be truncated):",
    diff.diff.length > 0 ? diff.diff : "(no text diff available)",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}
