export {
  type CommitConfig,
  type CommitConfigDefaults,
  type CommitConfigFlags,
  type CommitConfigResolution,
  type ConfigSource,
  ensureGlobalConfig,
  resolveCommitConfig,
  resolveScopeFromMappings,
  type ScopeMapping,
} from "./commitConfig.js";
export {
  DEFAULT_LIMITS,
  type DiffLimits,
  type DiffLimitsResolution,
  getDiffLimits,
  resolveDiffLimits,
} from "./limits.js";
