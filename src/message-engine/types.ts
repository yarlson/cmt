export interface CommitDiffStats {
  addedLines: number;
  removedLines: number;
}

export interface CommitDiff {
  files: string[];
  binaryFiles: string[];
  diff: string;
  diffTruncated: boolean;
  filesTruncated: boolean;
  diffBytes: number;
  maxDiffBytes: number;
  stats: CommitDiffStats;
  totalFiles: number;
}
