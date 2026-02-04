import { describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import {
  createProviderAuthContext,
  listOAuthProviders,
  loginWithOAuth,
} from "../../src/provider-auth/index.js";
import { createTempDir } from "../helpers/testUtils.js";

describe("provider-auth oauth", () => {
  it("stores OAuth credentials and reuses them", async () => {
    const baseDir = await createTempDir("cmt-oauth-");
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      CMT_PROVIDER_MODE: "mock",
      CMT_AUTH_PATH: path.join(baseDir, "auth.json"),
    };

    await loginWithOAuth({
      providerId: "mock",
      env,
      replaceExisting: true,
      onAuth: () => {},
      onPrompt: async () => "mock-code",
    });

    const stored = JSON.parse(
      await fs.readFile(env.CMT_AUTH_PATH ?? "", "utf8"),
    ) as Record<string, { type?: string }>;
    expect(stored.mock?.type).toBe("oauth");

    const context = await createProviderAuthContext({
      env,
      providerId: "mock",
      promptForKey: async () => {
        throw new Error("API key prompt should not be called");
      },
    });
    await context.provider.verifyApiKey();
  });

  it("re-authenticates when replacing existing OAuth", async () => {
    const baseDir = await createTempDir("cmt-oauth-");
    const authPath = path.join(baseDir, "auth.json");
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      CMT_PROVIDER_MODE: "mock",
      CMT_AUTH_PATH: authPath,
    };

    await loginWithOAuth({
      providerId: "mock",
      env,
      replaceExisting: true,
      onAuth: () => {},
      onPrompt: async () => "first-code",
    });

    const firstStored = JSON.parse(
      await fs.readFile(authPath, "utf8"),
    ) as Record<string, { access?: string }>;

    await loginWithOAuth({
      providerId: "mock",
      env,
      replaceExisting: true,
      onAuth: () => {},
      onPrompt: async () => "second-code",
    });

    const secondStored = JSON.parse(
      await fs.readFile(authPath, "utf8"),
    ) as Record<string, { access?: string }>;

    expect(firstStored.mock?.access).not.toBe(secondStored.mock?.access);
  });

  it("reports callback server capability", () => {
    const providers = listOAuthProviders();
    expect(providers.length).toBeGreaterThan(0);
    for (const provider of providers) {
      expect(typeof provider.usesCallbackServer).toBe("boolean");
    }
  });
});
