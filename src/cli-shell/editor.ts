import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type EditorResultStatus = "edited" | "empty" | "failed";

export interface EditorResult {
  status: EditorResultStatus;
  message?: string;
  exitCode?: number | null;
  signal?: NodeJS.Signals | null;
}

export async function editMessageInEditor(
  message: string,
  editorCommand: string,
): Promise<EditorResult> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "cmt-edit-"));
  const editPath = path.join(tempDir, "COMMIT_EDITMSG");

  try {
    await fs.writeFile(editPath, message, "utf8");
    const result = spawnSync(editorCommand, [editPath], {
      stdio: "inherit",
      shell: true,
    });

    const exitCode = result.status;
    const signal = result.signal;

    if (result.error || exitCode !== 0) {
      return { status: "failed", exitCode, signal };
    }

    const edited = await fs.readFile(editPath, "utf8");
    if (edited.trim().length === 0) {
      return { status: "empty", exitCode, signal };
    }

    return { status: "edited", message: edited, exitCode, signal };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
