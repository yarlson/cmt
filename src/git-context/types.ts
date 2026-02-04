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
  stats: DiffStats;
  totalFiles: number;
}
