const AI_COMMIT_BASIC_ENV = "FEATURE_AI_COMMIT_BASIC";

// TODO: remove feature.ai_commit_basic after provider selection slice ships.
export const AI_COMMIT_BASIC_FLAG = "feature.ai_commit_basic";

export function isAiCommitBasicEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const value = env[AI_COMMIT_BASIC_ENV];
  return value === "1" || value === "true";
}
