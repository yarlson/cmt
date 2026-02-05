import { describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import {
  createTempDir,
  initGitRepo,
  runCli,
  runGit,
  writeFile,
} from "../helpers/testUtils.js";

const defaultEnv = (baseDir: string): NodeJS.ProcessEnv => ({
  ...process.env,
  PI_API_KEY: "test-key",
  CMT_PROVIDER_MODE: "mock",
  CMT_AUTH_PATH: path.join(baseDir, "auth.json"),
});

describe("commit flow", () => {
  it("commits staged changes with preview", async () => {
    const repoDir = await createTempDir("cmt-repo-");
    initGitRepo(repoDir);
    await writeFile(repoDir, "README.md", "hello\n");
    runGit(repoDir, ["add", "README.md"]);

    const env = defaultEnv(repoDir);
    const result = runCli(repoDir, ["commit", "--yes"], env);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Preview");

    const log = runGit(repoDir, ["log", "-1", "--pretty=%s"]);
    expect(log.stdout.trim()).toBe("feat(core): add greeting");
  });

  it("prints message on dry-run without committing", async () => {
    const repoDir = await createTempDir("cmt-repo-");
    initGitRepo(repoDir);
    await writeFile(repoDir, "README.md", "base\n");
    runGit(repoDir, ["add", "README.md"]);
    runGit(repoDir, ["commit", "-m", "chore: init"]);

    await writeFile(repoDir, "README.md", "base\nchange\n");
    runGit(repoDir, ["add", "README.md"]);

    const env = defaultEnv(repoDir);
    const before = runGit(repoDir, ["rev-parse", "HEAD"]).stdout.trim();
    const result = runCli(repoDir, ["commit", "--dry-run", "--yes"], env);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Dry run message");
    const after = runGit(repoDir, ["rev-parse", "HEAD"]).stdout.trim();
    expect(after).toBe(before);
  });

  it("includes unstaged tracked changes when requested", async () => {
    const repoDir = await createTempDir("cmt-repo-");
    initGitRepo(repoDir);
    await writeFile(repoDir, "README.md", "base\n");
    runGit(repoDir, ["add", "README.md"]);
    runGit(repoDir, ["commit", "-m", "chore: init"]);

    await writeFile(repoDir, "README.md", "base\nchange\n");
    await writeFile(repoDir, "notes.txt", "draft\n");

    const env = defaultEnv(repoDir);

    const result = runCli(
      repoDir,
      ["commit", "--include-unstaged", "--yes"],
      env,
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Tracked files to stage");
    expect(result.stdout).toContain("Untracked files not staged");

    const log = runGit(repoDir, ["log", "-1", "--pretty=%s"]);
    expect(log.stdout.trim()).toBe("feat(core): add greeting");

    const status = runGit(repoDir, ["status", "--porcelain"]);
    expect(status.stdout).toContain("?? notes.txt");
    expect(status.stdout).not.toContain("README.md");
  });

  it("applies scope mapping from config", async () => {
    const repoDir = await createTempDir("cmt-repo-");
    initGitRepo(repoDir);
    await writeFile(repoDir, "README.md", "hello\n");
    runGit(repoDir, ["add", "README.md"]);

    await writeFile(
      repoDir,
      ".cmt.json",
      JSON.stringify(
        {
          schemaVersion: 1,
          scopeMappings: [{ prefix: "README.md", scope: "docs" }],
        },
        null,
        2,
      ),
    );

    const env = defaultEnv(repoDir);
    env.CMT_MOCK_PROPOSAL_JSON = JSON.stringify({
      type: "docs",
      scope: "core",
      subject: "update readme",
    });

    const result = runCli(repoDir, ["commit", "--yes"], env);
    expect(result.exitCode).toBe(0);

    const log = runGit(repoDir, ["log", "-1", "--pretty=%s"]);
    expect(log.stdout.trim()).toBe("docs(docs): update readme");
  });

  it("refuses outside a git repo", async () => {
    const dir = await createTempDir("cmt-norepo-");
    const env = defaultEnv(dir);
    const result = runCli(dir, ["commit", "--yes"], env);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Not a git repository");
  });

  it("refuses when merge conflicts exist", async () => {
    const repoDir = await createTempDir("cmt-repo-");
    initGitRepo(repoDir);
    await writeFile(repoDir, "conflict.txt", "base\n");
    runGit(repoDir, ["add", "conflict.txt"]);
    runGit(repoDir, ["commit", "-m", "chore: init"]);

    runGit(repoDir, ["checkout", "-b", "feature"]);
    await writeFile(repoDir, "conflict.txt", "base\nfeature\n");
    runGit(repoDir, ["add", "conflict.txt"]);
    runGit(repoDir, ["commit", "-m", "chore: feature"]);

    runGit(repoDir, ["checkout", "main"]);
    await writeFile(repoDir, "conflict.txt", "base\nmain\n");
    runGit(repoDir, ["add", "conflict.txt"]);
    runGit(repoDir, ["commit", "-m", "chore: main"]);

    runGit(repoDir, ["merge", "feature"]);

    const env = defaultEnv(repoDir);
    const result = runCli(repoDir, ["commit", "--yes"], env);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("merge conflicts");
  });

  it("surfaces hook failures", async () => {
    const repoDir = await createTempDir("cmt-repo-");
    initGitRepo(repoDir);
    await writeFile(repoDir, "README.md", "hello\n");
    runGit(repoDir, ["add", "README.md"]);

    const hookPath = path.join(repoDir, ".git", "hooks", "pre-commit");
    await fs.writeFile(hookPath, "#!/bin/sh\necho 'hook failed'\nexit 1\n");
    await fs.chmod(hookPath, 0o755);

    const env = defaultEnv(repoDir);
    const result = runCli(repoDir, ["commit", "--yes"], env);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("hook failed");
  });

  it("fails on invalid API key", async () => {
    const repoDir = await createTempDir("cmt-repo-");
    initGitRepo(repoDir);
    await writeFile(repoDir, "README.md", "hello\n");
    runGit(repoDir, ["add", "README.md"]);

    const env = defaultEnv(repoDir);
    env.CMT_MOCK_VERIFY = "invalid";

    const result = runCli(repoDir, ["commit", "--yes"], env);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("invalid API key");
  });

  it("fails on provider timeout", async () => {
    const repoDir = await createTempDir("cmt-repo-");
    initGitRepo(repoDir);
    await writeFile(repoDir, "README.md", "hello\n");
    runGit(repoDir, ["add", "README.md"]);

    const env = defaultEnv(repoDir);
    env.CMT_MOCK_VERIFY = "timeout";

    const result = runCli(repoDir, ["commit", "--yes"], env);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Provider timeout");
  });

  it("proceeds when diff is truncated", async () => {
    const repoDir = await createTempDir("cmt-repo-");
    initGitRepo(repoDir);
    await writeFile(repoDir, "README.md", "line1\nline2\nline3\n");
    runGit(repoDir, ["add", "README.md"]);
    runGit(repoDir, ["commit", "-m", "chore: init"]);

    await writeFile(
      repoDir,
      "README.md",
      "line1\nline2\nline3\nline4\nline5\nline6\nline7\n",
    );
    runGit(repoDir, ["add", "README.md"]);

    const env = defaultEnv(repoDir);
    env.CMT_MAX_DIFF_BYTES = "20";

    const result = runCli(repoDir, ["commit", "--yes"], env);
    expect(result.exitCode).toBe(0);
    expect(`${result.stdout}${result.stderr}`).not.toContain("Diff truncated");
  });

  it("proceeds when only binary files change", async () => {
    const repoDir = await createTempDir("cmt-repo-");
    initGitRepo(repoDir);

    const binaryPath = path.join(repoDir, "asset.bin");
    await fs.writeFile(binaryPath, Buffer.from([0, 1, 2, 3, 4, 255]));
    runGit(repoDir, ["add", "asset.bin"]);

    const env = defaultEnv(repoDir);
    const result = runCli(repoDir, ["commit", "--yes"], env);

    expect(result.exitCode).toBe(0);
    expect(`${result.stdout}${result.stderr}`).not.toContain(
      "Only binary files changed",
    );
  });
});
