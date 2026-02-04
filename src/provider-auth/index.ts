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
}

export interface ProviderAuthOptions {
  promptForKey: () => Promise<string | null>;
  env?: NodeJS.ProcessEnv;
}

export async function createProviderAuthContext(
  options: ProviderAuthOptions,
): Promise<ProviderAuthContext> {
  const env = options.env ?? process.env;
  const authStorage = createAuthStorage(env);
  const providerId = DEFAULT_PROVIDER;

  await resolveApiKey(authStorage, {
    providerId,
    promptForKey: options.promptForKey,
    env,
  });

  const provider =
    env.CMT_PROVIDER_MODE === "mock"
      ? createMockProvider(env)
      : createPiAgentProvider(authStorage);

  return {
    provider,
    providerId,
    modelId: DEFAULT_MODEL,
  };
}

export { ProviderAuthError } from "./errors.js";
export type { CommitMessageProvider } from "./types.js";
