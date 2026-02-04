import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AuthStorage } from "@mariozechner/pi-coding-agent";
import { ProviderAuthError } from "./errors.js";

const API_KEY_ENV = "PI_API_KEY";

export interface ApiKeyResolutionOptions {
  providerId: string;
  promptForKey: () => Promise<string | null>;
  env?: NodeJS.ProcessEnv;
}

export function createAuthStorage(
  env: NodeJS.ProcessEnv = process.env,
): AuthStorage {
  const authPath =
    env.CMT_AUTH_PATH ?? path.join(os.homedir(), ".config", "cmt", "auth.json");
  fs.mkdirSync(path.dirname(authPath), { recursive: true });
  return new AuthStorage(authPath);
}

export async function resolveApiKey(
  authStorage: AuthStorage,
  options: ApiKeyResolutionOptions,
): Promise<string> {
  const env = options.env ?? process.env;
  const envKey = env[API_KEY_ENV];
  if (envKey && envKey.trim().length > 0) {
    authStorage.setRuntimeApiKey(options.providerId, envKey.trim());
  }

  const existingKey = await authStorage.getApiKey(options.providerId);
  if (existingKey && existingKey.trim().length > 0) {
    return existingKey.trim();
  }

  const prompted = await options.promptForKey();
  if (!prompted || prompted.trim().length === 0) {
    throw new ProviderAuthError("API key is required.", "api_key_required");
  }

  const key = prompted.trim();
  authStorage.set(options.providerId, { type: "api_key", key });
  authStorage.setRuntimeApiKey(options.providerId, key);
  return key;
}
