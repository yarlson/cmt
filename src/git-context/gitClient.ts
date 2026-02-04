import { spawnSync } from "node:child_process";

export interface GitCommandOptions {
  cwd: string;
  input?: string;
  env?: NodeJS.ProcessEnv;
}

export interface GitCommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export function runGitCommand(
  args: string[],
  options: GitCommandOptions,
): GitCommandResult {
  const result = spawnSync("git", args, {
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
