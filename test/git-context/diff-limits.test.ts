import { describe, expect, it } from "bun:test";
import { collectBoundedDiff } from "../../src/git-context/index.js";
import {
  createTempDir,
  initGitRepo,
  runGit,
  writeFile,
} from "../helpers/testUtils.js";

describe("collectBoundedDiff", () => {
  it("limits files by largest change size", async () => {
    const repoDir = await createTempDir("cmt-repo-");
    initGitRepo(repoDir);

    await writeFile(repoDir, "small.txt", "base\n");
    await writeFile(repoDir, "large.txt", "base\n");
    runGit(repoDir, ["add", "small.txt", "large.txt"]);
    runGit(repoDir, ["commit", "-m", "chore: init"]);

    await writeFile(repoDir, "small.txt", "base\nsmall\n");
    await writeFile(repoDir, "large.txt", `base\n${"line\n".repeat(20)}`);
    runGit(repoDir, ["add", "small.txt", "large.txt"]);

    const diff = collectBoundedDiff(repoDir, {
      maxDiffBytes: 10000,
      maxFileCount: 1,
      subjectMaxLength: 72,
    });

    expect(diff.files).toEqual(["large.txt"]);
    expect(diff.filesTruncated).toBe(true);
    expect(diff.totalFiles).toBe(2);
  });
});
