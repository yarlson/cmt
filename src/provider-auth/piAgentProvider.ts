import { getModel } from "@mariozechner/pi-ai";
import {
  type AuthStorage,
  createAgentSession,
  ModelRegistry,
} from "@mariozechner/pi-coding-agent";
import { ProviderAuthError } from "./errors.js";
import type { CommitMessageProvider } from "./types.js";

const DEFAULT_PROVIDER_ID = "anthropic";
const DEFAULT_MODEL_ID = "claude-3-5-haiku-20241022";
const VERIFY_TIMEOUT_MS = 15000;
const PROMPT_TIMEOUT_MS = 45000;

function classifyProviderError(error: unknown): ProviderAuthError {
  if (error instanceof ProviderAuthError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "Provider error";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("unauthorized") ||
    normalized.includes("invalid api key") ||
    normalized.includes("401")
  ) {
    return new ProviderAuthError("invalid API key", "invalid_api_key");
  }

  if (normalized.includes("timeout") || normalized.includes("timed out")) {
    return new ProviderAuthError("Provider timeout", "provider_timeout");
  }

  return new ProviderAuthError(message, "provider_failure");
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<T>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new ProviderAuthError(timeoutMessage, "provider_timeout"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function createSession(authStorage: AuthStorage) {
  const model = getModel(DEFAULT_PROVIDER_ID, DEFAULT_MODEL_ID);
  const modelRegistry = new ModelRegistry(authStorage);
  const { session } = await createAgentSession({
    model,
    authStorage,
    modelRegistry,
    tools: [],
  });
  return session;
}

export function createPiAgentProvider(
  authStorage: AuthStorage,
): CommitMessageProvider {
  return {
    async verifyApiKey(): Promise<void> {
      const session = await createSession(authStorage);
      try {
        await withTimeout(
          session.prompt("Respond with OK."),
          VERIFY_TIMEOUT_MS,
          "Provider timeout",
        );
      } catch (error) {
        throw classifyProviderError(error);
      } finally {
        session.dispose();
      }
    },
    async generateCommitProposal(prompt: string): Promise<string> {
      const session = await createSession(authStorage);
      try {
        await withTimeout(
          session.prompt(prompt),
          PROMPT_TIMEOUT_MS,
          "Provider timeout",
        );
        const output = session.getLastAssistantText();
        if (!output) {
          throw new ProviderAuthError(
            "Provider returned empty response",
            "provider_failure",
          );
        }
        return output;
      } catch (error) {
        throw classifyProviderError(error);
      } finally {
        session.dispose();
      }
    },
  };
}

export const DEFAULT_PROVIDER = DEFAULT_PROVIDER_ID;
export const DEFAULT_MODEL = DEFAULT_MODEL_ID;
