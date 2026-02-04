const AI_COMMIT_BASIC_ENV = "FEATURE_AI_COMMIT_BASIC";
const AI_COMMIT_EDIT_ENV = "FEATURE_AI_COMMIT_EDIT";
const AI_COMMIT_CONFIG_ENV = "FEATURE_AI_COMMIT_CONFIG";

// TODO: remove feature.ai_commit_basic after provider selection slice ships.
export const AI_COMMIT_BASIC_FLAG = "feature.ai_commit_basic";
export const AI_COMMIT_EDIT_FLAG = "feature.ai_commit_edit";
export const AI_COMMIT_CONFIG_FLAG = "feature.ai_commit_config";

export function isAiCommitBasicEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const value = env[AI_COMMIT_BASIC_ENV];
  return value === "1" || value === "true";
}

export function isAiCommitEditEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const value = env[AI_COMMIT_EDIT_ENV];
  return value === "1" || value === "true";
}

export function isAiCommitConfigEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const value = env[AI_COMMIT_CONFIG_ENV];
  return value === "1" || value === "true";
}
