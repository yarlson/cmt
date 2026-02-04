export type GitContextErrorCode =
  | "not_repo"
  | "merge_conflict"
  | "rebase_in_progress"
  | "no_staged_changes"
  | "diff_summary_failed"
  | "diff_failed"
  | "diff_too_large"
  | "commit_failed"
  | "staging_failed";

export class GitContextError extends Error {
  readonly code: GitContextErrorCode;
  readonly details?: string;

  constructor(message: string, code: GitContextErrorCode, details?: string) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "GitContextError";
  }
}
