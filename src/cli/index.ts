#!/usr/bin/env node
import { runCommitCommand } from "../cli-shell/commitCommand.js";
import { isAiCommitEditEnabled } from "../config-policy/index.js";

function printUsage(env: NodeJS.ProcessEnv = process.env): void {
  console.log("Usage:");
  const editFlags = isAiCommitEditEnabled(env) ? " [--edit] [--regen]" : "";
  console.log(`  tool commit [--dry-run] [--yes]${editFlags}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage(process.env);
    return;
  }

  const command = args[0];
  if (command !== "commit") {
    console.error(`Unknown command: ${command}`);
    printUsage(process.env);
    process.exitCode = 1;
    return;
  }

  const flags = args.slice(1);
  let dryRun = false;
  let yes = false;
  let edit = false;
  let regen = false;
  for (const flag of flags) {
    if (flag === "--dry-run") {
      dryRun = true;
    } else if (flag === "--yes") {
      yes = true;
    } else if (flag === "--edit") {
      edit = true;
    } else if (flag === "--regen") {
      regen = true;
    } else {
      console.error(`Unknown flag: ${flag}`);
      printUsage(process.env);
      process.exitCode = 1;
      return;
    }
  }

  const exitCode = await runCommitCommand({ dryRun, edit, regen, yes });
  process.exitCode = exitCode;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error(message);
  process.exitCode = 1;
});
