export { GitContextError } from "./errors.js";
export {
  collectBoundedDiff,
  commitWithMessage,
  ensureRepoState,
  getStagedFiles,
  getUnstagedTrackedFiles,
  getUntrackedFiles,
  stageTrackedChanges,
} from "./gitContext.js";
export type { BoundedDiff, DiffStats } from "./types.js";
