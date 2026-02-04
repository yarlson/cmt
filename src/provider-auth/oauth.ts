import type {
  OAuthAuthInfo,
  OAuthLoginCallbacks,
  OAuthPrompt,
} from "@mariozechner/pi-ai";
import { createAuthStorage } from "./authStorage.js";
import { ProviderAuthError } from "./errors.js";
import { ensureMockOAuthProviderRegistered } from "./mockOAuthProvider.js";
import { createMockProvider } from "./mockProvider.js";
import { createPiAgentProvider } from "./piAgentProvider.js";

export interface OAuthProviderSummary {
  id: string;
  name: string;
  usesCallbackServer: boolean;
}

export interface OAuthLoginOptions {
  providerId: string;
  env?: NodeJS.ProcessEnv;
  replaceExisting?: boolean;
  onAuth: (info: OAuthAuthInfo) => void;
  onPrompt: (prompt: OAuthPrompt) => Promise<string>;
  onProgress?: (message: string) => void;
  onManualCodeInput?: () => Promise<string>;
  signal?: AbortSignal;
}

export interface OAuthLoginResult {
  providerId: string;
  providerName: string;
  replaced: boolean;
}

function shouldRegisterMock(
  env: NodeJS.ProcessEnv,
  providerId?: string,
): boolean {
  return env.CMT_PROVIDER_MODE === "mock" || providerId === "mock";
}

function listProviders(env: NodeJS.ProcessEnv): OAuthProviderSummary[] {
  if (shouldRegisterMock(env)) {
    ensureMockOAuthProviderRegistered();
  }
  const authStorage = createAuthStorage(env);
  return authStorage.getOAuthProviders().map((provider) => ({
    id: provider.id,
    name: provider.name,
    usesCallbackServer: provider.usesCallbackServer ?? false,
  }));
}

function classifyOAuthError(error: unknown): ProviderAuthError {
  if (error instanceof ProviderAuthError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "OAuth failed";
  const normalized = message.toLowerCase();

  if (normalized.includes("cancel")) {
    return new ProviderAuthError("OAuth cancelled.", "oauth_cancelled");
  }

  if (normalized.includes("unknown oauth provider")) {
    return new ProviderAuthError(message, "unknown_provider");
  }

  if (
    normalized.includes("eacces") ||
    normalized.includes("eperm") ||
    normalized.includes("permission") ||
    normalized.includes("denied")
  ) {
    return new ProviderAuthError(
      "Unable to store auth token. Check file permissions.",
      "auth_storage_failed",
    );
  }

  if (normalized.includes("timeout") || normalized.includes("timed out")) {
    return new ProviderAuthError("Provider timeout", "provider_timeout");
  }

  return new ProviderAuthError(message, "provider_failure");
}

async function verifyAuth(
  env: NodeJS.ProcessEnv,
  providerId: string,
): Promise<void> {
  const authStorage = createAuthStorage(env);
  if (shouldRegisterMock(env, providerId)) {
    await createMockProvider(env).verifyApiKey();
    return;
  }

  const selection = createPiAgentProvider(authStorage, providerId);
  await selection.provider.verifyApiKey();
}

export function listOAuthProviders(
  env: NodeJS.ProcessEnv = process.env,
): OAuthProviderSummary[] {
  return listProviders(env);
}

export function hasStoredAuth(
  providerId: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (shouldRegisterMock(env, providerId)) {
    ensureMockOAuthProviderRegistered();
  }
  const authStorage = createAuthStorage(env);
  return authStorage.has(providerId);
}

export async function loginWithOAuth(
  options: OAuthLoginOptions,
): Promise<OAuthLoginResult> {
  const env = options.env ?? process.env;
  if (shouldRegisterMock(env, options.providerId)) {
    ensureMockOAuthProviderRegistered();
  }
  const providers = listProviders(env);
  const provider = providers.find((entry) => entry.id === options.providerId);
  if (!provider) {
    throw new ProviderAuthError(
      `Unknown provider: ${options.providerId}`,
      "unknown_provider",
    );
  }

  const authStorage = createAuthStorage(env);
  const hasExisting = authStorage.has(options.providerId);
  if (hasExisting && !options.replaceExisting) {
    throw new ProviderAuthError(
      `Auth already configured for ${options.providerId}.`,
      "auth_already_configured",
    );
  }

  const previousCredential = hasExisting
    ? authStorage.get(options.providerId)
    : undefined;
  if (hasExisting && options.replaceExisting) {
    authStorage.remove(options.providerId);
  }

  const callbacks: OAuthLoginCallbacks = {
    onAuth: options.onAuth,
    onPrompt: options.onPrompt,
    onProgress: options.onProgress,
    onManualCodeInput: options.onManualCodeInput,
    signal: options.signal,
  };

  try {
    await authStorage.login(options.providerId, callbacks);
  } catch (error) {
    if (previousCredential) {
      authStorage.set(options.providerId, previousCredential);
    }
    throw classifyOAuthError(error);
  }

  try {
    await verifyAuth(env, options.providerId);
  } catch (error) {
    if (previousCredential) {
      authStorage.set(options.providerId, previousCredential);
    } else if (authStorage.has(options.providerId)) {
      authStorage.remove(options.providerId);
    }
    const message =
      error instanceof Error ? error.message : "Auth verification failed.";
    throw new ProviderAuthError(message, "auth_verification_failed");
  }

  return {
    providerId: provider.id,
    providerName: provider.name,
    replaced: hasExisting,
  };
}
