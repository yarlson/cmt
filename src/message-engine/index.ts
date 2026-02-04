export { MessageEngineError } from "./errors.js";
export {
  type CommitMessageProvider,
  type GenerateProposalInput,
  generateCommitProposal,
} from "./generateProposal.js";
export { buildCommitPrompt, DEFAULT_COMMIT_TYPES } from "./prompt.js";
export {
  type CommitProposal,
  formatCommitMessage,
  parseCommitProposalJson,
} from "./proposal.js";
export type { CommitDiff, CommitDiffStats } from "./types.js";
