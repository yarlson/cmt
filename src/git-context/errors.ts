export type GitContextErrorCode =
  | "not_repo"
  | "merge_conflict"
  | "rebase_in_progress"
  | "no_staged_changes"
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
