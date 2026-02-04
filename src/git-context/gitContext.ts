import type { DiffLimits } from "../config-policy/index.js";
import { GitContextError } from "./errors.js";
import { runGitCommand } from "./gitClient.js";
import type { BoundedDiff, DiffStats } from "./types.js";

const EMPTY_STATS: DiffStats = { addedLines: 0, removedLines: 0 };

interface FileChangeStats {
  addedLines: number;
  removedLines: number;
  isBinary: boolean;
  changeSize: number;
}

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

export function getUnstagedTrackedFiles(cwd: string): string[] {
  const result = runGitCommand(["diff", "--name-only"], { cwd });
  if (result.exitCode !== 0) {
    return [];
  }

  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function getUntrackedFiles(cwd: string): string[] {
  const result = runGitCommand(["ls-files", "--others", "--exclude-standard"], {
    cwd,
  });
  if (result.exitCode !== 0) {
    return [];
  }

  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function stageTrackedChanges(cwd: string): void {
  const result = runGitCommand(["add", "-u"], { cwd });
  if (result.exitCode !== 0) {
    throw new GitContextError(
      "Failed to stage tracked changes.",
      "staging_failed",
      [result.stdout, result.stderr].join("\n").trim(),
    );
  }
}

function parseNumstat(output: string): Map<string, FileChangeStats> {
  const stats = new Map<string, FileChangeStats>();

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const [added, removed, ...fileParts] = trimmed.split("\t");
    const filePath = fileParts.join("\t");
    if (!filePath) {
      continue;
    }

    if (added === "-" || removed === "-") {
      stats.set(filePath, {
        addedLines: 0,
        removedLines: 0,
        isBinary: true,
        changeSize: 0,
      });
      continue;
    }

    const addedNumber = Number.parseInt(added, 10);
    const removedNumber = Number.parseInt(removed, 10);
    const safeAdded = Number.isNaN(addedNumber) ? 0 : addedNumber;
    const safeRemoved = Number.isNaN(removedNumber) ? 0 : removedNumber;

    stats.set(filePath, {
      addedLines: safeAdded,
      removedLines: safeRemoved,
      isBinary: false,
      changeSize: safeAdded + safeRemoved,
    });
  }

  return stats;
}

function sumStatsForFiles(
  files: string[],
  fileStats: Map<string, FileChangeStats>,
): DiffStats {
  let addedLines = 0;
  let removedLines = 0;

  for (const file of files) {
    const stats = fileStats.get(file);
    if (!stats || stats.isBinary) {
      continue;
    }
    addedLines += stats.addedLines;
    removedLines += stats.removedLines;
  }

  return { addedLines, removedLines };
}

function sortFilesByChangeSize(
  files: string[],
  fileStats: Map<string, FileChangeStats>,
): string[] {
  return [...files].sort((left, right) => {
    const leftStats = fileStats.get(left);
    const rightStats = fileStats.get(right);
    const leftSize = leftStats?.changeSize ?? 0;
    const rightSize = rightStats?.changeSize ?? 0;
    if (leftSize !== rightSize) {
      return rightSize - leftSize;
    }
    return left.localeCompare(right);
  });
}

function truncateDiff(
  diff: string,
  maxBytes: number,
): { text: string; truncated: boolean } {
  const buffer = Buffer.from(diff, "utf8");
  if (buffer.length <= maxBytes) {
    return { text: diff, truncated: false };
  }

  const truncatedText = buffer.subarray(0, maxBytes).toString("utf8");
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
      diffBytes: 0,
      maxDiffBytes: limits.maxDiffBytes,
      stats: EMPTY_STATS,
      totalFiles: 0,
    };
  }

  const numstat = runGitCommand(["diff", "--cached", "--numstat"], {
    cwd,
  });
  if (numstat.exitCode !== 0) {
    throw new GitContextError(
      "Failed to compute diff summary.",
      "diff_summary_failed",
      [numstat.stdout, numstat.stderr].join("\n").trim(),
    );
  }

  const fileStats = parseNumstat(numstat.stdout);

  const filesTruncated = allFiles.length > limits.maxFileCount;
  const sortedFiles = filesTruncated
    ? sortFilesByChangeSize(allFiles, fileStats)
    : allFiles;
  const includedFiles = filesTruncated
    ? sortedFiles.slice(0, limits.maxFileCount)
    : allFiles;

  const binaryFiles = includedFiles.filter(
    (file) => fileStats.get(file)?.isBinary,
  );
  const nonBinaryFiles = includedFiles.filter(
    (file) => !fileStats.get(file)?.isBinary,
  );
  const stats = sumStatsForFiles(includedFiles, fileStats);

  let diffContent = "";
  if (nonBinaryFiles.length > 0) {
    const diffResult = runGitCommand(
      ["diff", "--cached", "--patch", "--", ...nonBinaryFiles],
      {
        cwd,
      },
    );
    if (diffResult.exitCode !== 0) {
      throw new GitContextError(
        "Failed to collect staged diff.",
        "diff_failed",
        [diffResult.stdout, diffResult.stderr].join("\n").trim(),
      );
    }
    diffContent = diffResult.stdout;
  }

  const diffBytes = Buffer.byteLength(diffContent, "utf8");
  const { text, truncated } = truncateDiff(diffContent, limits.maxDiffBytes);
  if (Buffer.byteLength(text, "utf8") > limits.maxDiffBytes) {
    throw new GitContextError(
      "Diff exceeds size limit even after truncation. Reduce changes or increase CMT_MAX_DIFF_BYTES.",
      "diff_too_large",
    );
  }

  return {
    files: includedFiles,
    binaryFiles,
    diff: text,
    diffTruncated: truncated,
    filesTruncated,
    diffBytes,
    maxDiffBytes: limits.maxDiffBytes,
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
