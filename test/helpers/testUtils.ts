import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { cliPath } from "./paths.js";

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function createTempDir(prefix: string): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function writeFile(
  dir: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const fullPath = path.join(dir, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, "utf8");
}

export function runCommand(
  command: string,
  args: string[],
  options: {
    cwd: string;
    env?: NodeJS.ProcessEnv;
    input?: string;
  },
): CommandResult {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    input: options.input,
    encoding: "utf8",
  });

  return {
    exitCode: result.status ?? -1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export function runGit(
  cwd: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
): CommandResult {
  return runCommand("git", args, { cwd, env });
}

export function runCli(
  cwd: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  input?: string,
): CommandResult {
  return runCommand("bun", [cliPath, ...args], { cwd, env, input });
}

export function initGitRepo(cwd: string): void {
  runGit(cwd, ["init", "-b", "main"]);
  runGit(cwd, ["config", "user.email", "test@example.com"]);
  runGit(cwd, ["config", "user.name", "Test User"]);
}

export async function readTelemetryEvents(
  telemetryPath: string,
): Promise<Array<Record<string, unknown>>> {
  const content = await fs.readFile(telemetryPath, "utf8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}
