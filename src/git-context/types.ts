export interface DiffStats {
  addedLines: number;
  removedLines: number;
}

export interface BoundedDiff {
  files: string[];
  binaryFiles: string[];
  diff: string;
  diffTruncated: boolean;
  filesTruncated: boolean;
  diffBytes: number;
  maxDiffBytes: number;
  stats: DiffStats;
  totalFiles: number;
}
