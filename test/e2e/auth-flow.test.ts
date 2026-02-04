import { describe, expect, it } from "bun:test";
import path from "node:path";
import { createTempDir, runCli } from "../helpers/testUtils.js";

describe("auth flow", () => {
  it("rejects OAuth login in non-interactive shells", async () => {
    const dir = await createTempDir("cmt-auth-");
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      CMT_PROVIDER_MODE: "mock",
      CMT_AUTH_PATH: path.join(dir, "auth.json"),
    };

    const result = runCli(dir, ["auth", "--provider", "mock"], env);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Non-interactive shell");
  });
});
