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
  isAiCommitBasicEnabled,
  isAiCommitConfigEnabled,
  isAiCommitEditEnabled,
} from "./featureFlags.js";
export { type DiffLimits, getDiffLimits } from "./limits.js";
