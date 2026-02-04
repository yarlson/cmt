#!/usr/bin/env node
import { runCommitCommand } from "../cli-shell/commitCommand.js";

function printUsage(): void {
  console.log("Usage:");
  console.log("  tool commit [--dry-run] [--yes]");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    return;
  }

  const command = args[0];
  if (command !== "commit") {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exitCode = 1;
    return;
  }

  const flags = args.slice(1);
  let dryRun = false;
  let yes = false;
  for (const flag of flags) {
    if (flag === "--dry-run") {
      dryRun = true;
    } else if (flag === "--yes") {
      yes = true;
    } else {
      console.error(`Unknown flag: ${flag}`);
      printUsage();
      process.exitCode = 1;
      return;
    }
  }

  const exitCode = await runCommitCommand({ dryRun, yes });
  process.exitCode = exitCode;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error(message);
  process.exitCode = 1;
});
