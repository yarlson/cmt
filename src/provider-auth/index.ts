import { createAuthStorage, resolveApiKey } from "./authStorage.js";
import { createMockProvider } from "./mockProvider.js";
import {
  createPiAgentProvider,
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
} from "./piAgentProvider.js";
import type { CommitMessageProvider } from "./types.js";

export interface ProviderAuthContext {
  provider: CommitMessageProvider;
  providerId: string;
  modelId: string;
  modelFallbackUsed: boolean;
}

export interface ProviderAuthOptions {
  promptForKey: () => Promise<string | null>;
  env?: NodeJS.ProcessEnv;
  providerId?: string;
  modelId?: string;
}

export async function createProviderAuthContext(
  options: ProviderAuthOptions,
): Promise<ProviderAuthContext> {
  const env = options.env ?? process.env;
  const authStorage = createAuthStorage(env);
  const providerId = options.providerId ?? DEFAULT_PROVIDER;
  const requestedModelId = options.modelId;

  await resolveApiKey(authStorage, {
    providerId,
    promptForKey: options.promptForKey,
    env,
  });

  if (env.CMT_PROVIDER_MODE === "mock" || providerId === "mock") {
    return {
      provider: createMockProvider(env),
      providerId,
      modelId: requestedModelId ?? DEFAULT_MODEL,
      modelFallbackUsed: false,
    };
  }

  const selection = createPiAgentProvider(
    authStorage,
    providerId,
    requestedModelId,
  );

  return {
    provider: selection.provider,
    providerId,
    modelId: selection.modelId,
    modelFallbackUsed: selection.modelFallbackUsed,
  };
}

export { ProviderAuthError } from "./errors.js";
export {
  hasStoredAuth,
  listOAuthProviders,
  loginWithOAuth,
  type OAuthLoginOptions,
  type OAuthLoginResult,
  type OAuthProviderSummary,
} from "./oauth.js";
export { DEFAULT_MODEL, DEFAULT_PROVIDER } from "./piAgentProvider.js";
export type { CommitMessageProvider } from "./types.js";
