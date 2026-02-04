import { ProviderAuthError } from "./errors.js";
import type { CommitMessageProvider } from "./types.js";

const DEFAULT_PROPOSAL = JSON.stringify({
  type: "feat",
  scope: "core",
  subject: "add greeting",
  body: "Add greeting output.",
  footers: ["Refs: TEST-1"],
  rationale: "Updates CLI output.",
});

export function createMockProvider(
  env: NodeJS.ProcessEnv = process.env,
): CommitMessageProvider {
  return {
    async verifyApiKey(): Promise<void> {
      const mode = env.CMT_MOCK_VERIFY ?? "ok";
      if (mode === "invalid") {
        throw new ProviderAuthError("invalid API key", "invalid_api_key");
      }
      if (mode === "timeout") {
        throw new ProviderAuthError("Provider timeout", "provider_timeout");
      }
    },
    async generateCommitProposal(): Promise<string> {
      const mode = env.CMT_MOCK_GENERATE ?? "ok";
      if (mode === "timeout") {
        throw new ProviderAuthError("Provider timeout", "provider_timeout");
      }
      if (mode === "error") {
        throw new ProviderAuthError("Provider error", "provider_failure");
      }

      return env.CMT_MOCK_PROPOSAL_JSON ?? DEFAULT_PROPOSAL;
    },
  };
}
