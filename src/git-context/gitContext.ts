import type { DiffLimits } from "../config-policy/index.js";
import { GitContextError } from "./errors.js";
import { runGitCommand } from "./gitClient.js";
import type { BoundedDiff, DiffStats } from "./types.js";

const EMPTY_STATS: DiffStats = { addedLines: 0, removedLines: 0 };

export function ensureRepoState(cwd: string): void {
  const repoCheck = runGitCommand(["rev-parse", "--is-inside-work-tree"], {
    cwd,
  });
  if (repoCheck.exitCode !== 0 || repoCheck.stdout.trim() !== "true") {
    throw new GitContextError("Not a git repository.", "not_repo");
  }

  const conflicts = runGitCommand(["diff", "--name-only", "--diff-filter=U"], {
    cwd,
  });
  if (conflicts.stdout.trim().length > 0) {
    throw new GitContextError(
      "Repository has merge conflicts. Resolve them before committing.",
      "merge_conflict",
    );
  }

  const rebase = runGitCommand(["rev-parse", "-q", "--verify", "REBASE_HEAD"], {
    cwd,
  });
  const merge = runGitCommand(["rev-parse", "-q", "--verify", "MERGE_HEAD"], {
    cwd,
  });
  if (rebase.exitCode === 0 || merge.exitCode === 0) {
    throw new GitContextError(
      "Merge or rebase in progress. Resolve it before committing.",
      "rebase_in_progress",
    );
  }
}

export function getStagedFiles(cwd: string): string[] {
  const result = runGitCommand(["diff", "--cached", "--name-only"], { cwd });
  if (result.exitCode !== 0) {
    return [];
  }

  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function parseNumstat(output: string): {
  binaryFiles: string[];
  stats: DiffStats;
} {
  const binaryFiles: string[] = [];
  let addedLines = 0;
  let removedLines = 0;

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const [added, removed, filePath] = trimmed.split("\t");
    if (!filePath) {
      continue;
    }

    if (added === "-" || removed === "-") {
      binaryFiles.push(filePath);
      continue;
    }

    const addedNumber = Number.parseInt(added, 10);
    const removedNumber = Number.parseInt(removed, 10);

    if (!Number.isNaN(addedNumber)) {
      addedLines += addedNumber;
    }
    if (!Number.isNaN(removedNumber)) {
      removedLines += removedNumber;
    }
  }

  return {
    binaryFiles,
    stats: { addedLines, removedLines },
  };
}

function truncateDiff(
  diff: string,
  maxBytes: number,
): { text: string; truncated: boolean } {
  if (Buffer.byteLength(diff, "utf8") <= maxBytes) {
    return { text: diff, truncated: false };
  }

  const truncatedText = diff.slice(0, maxBytes);
  return { text: truncatedText, truncated: true };
}

export function collectBoundedDiff(
  cwd: string,
  limits: DiffLimits,
): BoundedDiff {
  const allFiles = getStagedFiles(cwd);
  if (allFiles.length === 0) {
    return {
      files: [],
      binaryFiles: [],
      diff: "",
      diffTruncated: false,
      filesTruncated: false,
      stats: EMPTY_STATS,
      totalFiles: 0,
    };
  }

  const filesTruncated = allFiles.length > limits.maxFileCount;
  const includedFiles = filesTruncated
    ? allFiles.slice(0, limits.maxFileCount)
    : allFiles;

  const numstat = runGitCommand(
    ["diff", "--cached", "--numstat", "--", ...includedFiles],
    {
      cwd,
    },
  );

  const { binaryFiles, stats } = parseNumstat(numstat.stdout);
  const nonBinaryFiles = includedFiles.filter(
    (file) => !binaryFiles.includes(file),
  );

  let diffContent = "";
  if (nonBinaryFiles.length > 0) {
    const diffResult = runGitCommand(
      ["diff", "--cached", "--patch", "--", ...nonBinaryFiles],
      {
        cwd,
      },
    );
    diffContent = diffResult.stdout;
  }

  const { text, truncated } = truncateDiff(diffContent, limits.maxDiffBytes);

  return {
    files: includedFiles,
    binaryFiles,
    diff: text,
    diffTruncated: truncated,
    filesTruncated,
    stats,
    totalFiles: allFiles.length,
  };
}

export function commitWithMessage(
  cwd: string,
  message: string,
): { hash: string; subject: string } {
  const commitResult = runGitCommand(["commit", "--file", "-"], {
    cwd,
    input: message,
  });

  if (commitResult.exitCode !== 0) {
    throw new GitContextError(
      "Git commit failed.",
      "commit_failed",
      [commitResult.stdout, commitResult.stderr].join("\n").trim(),
    );
  }

  const hashResult = runGitCommand(["rev-parse", "HEAD"], { cwd });
  const subjectResult = runGitCommand(["log", "-1", "--pretty=%s"], { cwd });

  return {
    hash: hashResult.stdout.trim(),
    subject: subjectResult.stdout.trim(),
  };
}
