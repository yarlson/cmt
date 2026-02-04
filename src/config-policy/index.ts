export {
  type CommitConfig,
  type CommitConfigDefaults,
  type CommitConfigFlags,
  type CommitConfigResolution,
  type ConfigSource,
  resolveCommitConfig,
  resolveScopeFromMappings,
  type ScopeMapping,
} from "./commitConfig.js";
export {
  AI_COMMIT_BASIC_FLAG,
  AI_COMMIT_CONFIG_FLAG,
  AI_COMMIT_EDIT_FLAG,
  AI_COMMIT_OAUTH_FLAG,
  isAiCommitBasicEnabled,
  isAiCommitConfigEnabled,
  isAiCommitEditEnabled,
  isAiCommitOAuthEnabled,
} from "./featureFlags.js";
export { type DiffLimits, getDiffLimits } from "./limits.js";
