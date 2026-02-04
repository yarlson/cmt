import type {
  OAuthCredentials,
  OAuthLoginCallbacks,
  OAuthProviderInterface,
} from "@mariozechner/pi-ai";
import { registerOAuthProvider } from "@mariozechner/pi-ai";

const MOCK_PROVIDER_ID = "mock";
let mockRegistered = false;

function createMockCredentials(seed: string): OAuthCredentials {
  return {
    access: `mock-access-${seed}`,
    refresh: "mock-refresh",
    expires: Date.now() + 15 * 60 * 1000,
  };
}

function createMockOAuthProvider(): OAuthProviderInterface {
  return {
    id: MOCK_PROVIDER_ID,
    name: "Mock OAuth",
    async login(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials> {
      callbacks.onAuth({
        url: "https://example.com/mock-oauth",
        instructions: "Complete the mock OAuth flow to continue.",
      });
      callbacks.onProgress?.("Waiting for mock OAuth...");
      const code = await callbacks.onPrompt({
        message: "Enter mock authorization code",
        placeholder: "mock-code",
      });
      if (!code || code.trim().length === 0) {
        throw new Error("OAuth cancelled");
      }
      return createMockCredentials(code.trim());
    },
    async refreshToken(
      credentials: OAuthCredentials,
    ): Promise<OAuthCredentials> {
      const seed =
        typeof credentials.access === "string" ? credentials.access : "mock";
      return createMockCredentials(seed);
    },
    getApiKey(credentials: OAuthCredentials): string {
      return String(credentials.access);
    },
  };
}

export function ensureMockOAuthProviderRegistered(): void {
  if (mockRegistered) {
    return;
  }
  registerOAuthProvider(createMockOAuthProvider());
  mockRegistered = true;
}
