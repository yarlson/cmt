#!/usr/bin/env node
import { runAuthCommand } from "../cli-shell/authCommand.js";
import { runCommitCommand } from "../cli-shell/commitCommand.js";
import {
  isAiCommitConfigEnabled,
  isAiCommitEditEnabled,
  isAiCommitOAuthEnabled,
} from "../config-policy/index.js";

function printUsage(env: NodeJS.ProcessEnv = process.env): void {
  console.log("Usage:");
  const editFlags = isAiCommitEditEnabled(env) ? " [--edit] [--regen]" : "";
  const configFlags = isAiCommitConfigEnabled(env)
    ? " [--provider <id>] [--model <id>] [--types <list>]"
    : "";
  console.log(`  tool commit [--dry-run] [--yes]${editFlags}${configFlags}`);
  if (isAiCommitOAuthEnabled(env)) {
    console.log("  tool auth --provider <id>");
  }
}

function parseTypes(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const unique = Array.from(new Set(normalized));
  return unique.length > 0 ? unique : undefined;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage(process.env);
    return;
  }

  const command = args[0];
  if (command === "commit") {
    const flags = args.slice(1);
    let dryRun = false;
    let yes = false;
    let edit = false;
    let regen = false;
    let provider: string | undefined;
    let model: string | undefined;
    let types: string[] | undefined;

    for (let index = 0; index < flags.length; index += 1) {
      const flag = flags[index];
      if (flag === "--dry-run") {
        dryRun = true;
        continue;
      }
      if (flag === "--yes") {
        yes = true;
        continue;
      }
      if (flag === "--edit") {
        edit = true;
        continue;
      }
      if (flag === "--regen") {
        regen = true;
        continue;
      }
      if (flag.startsWith("--provider=")) {
        provider = flag.slice("--provider=".length).trim();
        if (!provider) {
          console.error("--provider requires a value.");
          printUsage(process.env);
          process.exitCode = 1;
          return;
        }
        continue;
      }
      if (flag === "--provider") {
        provider = flags[index + 1]?.trim();
        if (!provider) {
          console.error("--provider requires a value.");
          printUsage(process.env);
          process.exitCode = 1;
          return;
        }
        index += 1;
        continue;
      }
      if (flag.startsWith("--model=")) {
        model = flag.slice("--model=".length).trim();
        if (!model) {
          console.error("--model requires a value.");
          printUsage(process.env);
          process.exitCode = 1;
          return;
        }
        continue;
      }
      if (flag === "--model") {
        model = flags[index + 1]?.trim();
        if (!model) {
          console.error("--model requires a value.");
          printUsage(process.env);
          process.exitCode = 1;
          return;
        }
        index += 1;
        continue;
      }
      if (flag.startsWith("--types=")) {
        types = parseTypes(flag.slice("--types=".length));
        if (!types) {
          console.error("--types requires a comma-separated list.");
          printUsage(process.env);
          process.exitCode = 1;
          return;
        }
        continue;
      }
      if (flag === "--types") {
        types = parseTypes(flags[index + 1]);
        if (!types) {
          console.error("--types requires a comma-separated list.");
          printUsage(process.env);
          process.exitCode = 1;
          return;
        }
        index += 1;
        continue;
      }

      console.error(`Unknown flag: ${flag}`);
      printUsage(process.env);
      process.exitCode = 1;
      return;
    }

    process.exitCode = await runCommitCommand({
      dryRun,
      edit,
      regen,
      provider,
      model,
      types,
      yes,
    });
    return;
  }

  if (command === "auth") {
    const flags = args.slice(1);
    let provider: string | undefined;

    for (let index = 0; index < flags.length; index += 1) {
      const flag = flags[index];
      if (flag.startsWith("--provider=")) {
        provider = flag.slice("--provider=".length).trim();
        if (!provider) {
          console.error("--provider requires a value.");
          printUsage(process.env);
          process.exitCode = 1;
          return;
        }
        continue;
      }
      if (flag === "--provider") {
        provider = flags[index + 1]?.trim();
        if (!provider) {
          console.error("--provider requires a value.");
          printUsage(process.env);
          process.exitCode = 1;
          return;
        }
        index += 1;
        continue;
      }
      if (flag === "--help" || flag === "-h") {
        printUsage(process.env);
        return;
      }

      console.error(`Unknown flag: ${flag}`);
      printUsage(process.env);
      process.exitCode = 1;
      return;
    }

    process.exitCode = await runAuthCommand({ provider });
    return;
  }

  console.error(`Unknown command: ${command}`);
  printUsage(process.env);
  process.exitCode = 1;
  return;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error(message);
  process.exitCode = 1;
});
