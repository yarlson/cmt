#!/usr/bin/env node
import { log } from "@clack/prompts";
import { runAuthCommand } from "../cli-shell/authCommand.js";
import { runCommitCommand } from "../cli-shell/commitCommand.js";
import {
  runModelsCommand,
  runProvidersCommand,
} from "../cli-shell/listCommand.js";
import {
  ensureGlobalConfig,
  resolveDiffLimits,
} from "../config-policy/index.js";
import { DEFAULT_COMMIT_TYPES } from "../message-engine/index.js";
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from "../provider-auth/index.js";

function printUsage(): void {
  console.log("Usage:");
  console.log(
    "  tool commit [--dry-run] [--yes] [--include-unstaged] [--provider <id>] [--model <id>] [--types <list>]",
  );
  console.log("  tool auth --provider <id>");
  console.log("  tool providers [--markdown] [--short]");
  console.log("  tool models [--provider <id>] [--markdown] [--short]");
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

function printError(message: string): void {
  log.error(message, { output: process.stderr });
}

async function main(): Promise<void> {
  await ensureGlobalConfig({
    defaults: {
      providerId: DEFAULT_PROVIDER,
      modelId: DEFAULT_MODEL,
      allowedTypes: DEFAULT_COMMIT_TYPES,
      subjectMaxLength: resolveDiffLimits(process.env).limits.subjectMaxLength,
    },
  });
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    return;
  }

  const command = args[0];
  if (command === "commit") {
    const flags = args.slice(1);
    let dryRun = false;
    let yes = false;
    let includeUnstaged = false;
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
      if (flag === "--include-unstaged") {
        includeUnstaged = true;
        continue;
      }
      if (flag.startsWith("--provider=")) {
        provider = flag.slice("--provider=".length).trim();
        if (!provider) {
          printError("--provider requires a value.");
          printUsage();
          process.exitCode = 1;
          return;
        }
        continue;
      }
      if (flag === "--provider") {
        provider = flags[index + 1]?.trim();
        if (!provider) {
          printError("--provider requires a value.");
          printUsage();
          process.exitCode = 1;
          return;
        }
        index += 1;
        continue;
      }
      if (flag.startsWith("--model=")) {
        model = flag.slice("--model=".length).trim();
        if (!model) {
          printError("--model requires a value.");
          printUsage();
          process.exitCode = 1;
          return;
        }
        continue;
      }
      if (flag === "--model") {
        model = flags[index + 1]?.trim();
        if (!model) {
          printError("--model requires a value.");
          printUsage();
          process.exitCode = 1;
          return;
        }
        index += 1;
        continue;
      }
      if (flag.startsWith("--types=")) {
        types = parseTypes(flag.slice("--types=".length));
        if (!types) {
          printError("--types requires a comma-separated list.");
          printUsage();
          process.exitCode = 1;
          return;
        }
        continue;
      }
      if (flag === "--types") {
        types = parseTypes(flags[index + 1]);
        if (!types) {
          printError("--types requires a comma-separated list.");
          printUsage();
          process.exitCode = 1;
          return;
        }
        index += 1;
        continue;
      }

      printError(`Unknown flag: ${flag}`);
      printUsage();
      process.exitCode = 1;
      return;
    }

    process.exitCode = await runCommitCommand({
      dryRun,
      provider,
      model,
      types,
      includeUnstaged,
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
          printError("--provider requires a value.");
          printUsage();
          process.exitCode = 1;
          return;
        }
        continue;
      }
      if (flag === "--provider") {
        provider = flags[index + 1]?.trim();
        if (!provider) {
          printError("--provider requires a value.");
          printUsage();
          process.exitCode = 1;
          return;
        }
        index += 1;
        continue;
      }
      if (flag === "--help" || flag === "-h") {
        printUsage();
        return;
      }

      printError(`Unknown flag: ${flag}`);
      printUsage();
      process.exitCode = 1;
      return;
    }

    process.exitCode = await runAuthCommand({ provider });
    return;
  }

  if (command === "providers") {
    const flags = args.slice(1);
    let markdown = false;
    let short = false;

    for (let index = 0; index < flags.length; index += 1) {
      const flag = flags[index];
      if (flag === "--markdown") {
        markdown = true;
        continue;
      }
      if (flag === "--short") {
        short = true;
        continue;
      }
      if (flag === "--help" || flag === "-h") {
        printUsage();
        return;
      }

      console.error(`Unknown flag: ${flag}`);
      printUsage();
      process.exitCode = 1;
      return;
    }

    if (markdown && short) {
      console.error("--markdown and --short cannot be used together.");
      process.exitCode = 1;
      return;
    }

    process.exitCode = await runProvidersCommand({
      format: short ? "short" : markdown ? "markdown" : "table",
    });
    return;
  }

  if (command === "models") {
    const flags = args.slice(1);
    let provider: string | undefined;
    let markdown = false;
    let short = false;

    for (let index = 0; index < flags.length; index += 1) {
      const flag = flags[index];
      if (flag === "--markdown") {
        markdown = true;
        continue;
      }
      if (flag === "--short") {
        short = true;
        continue;
      }
      if (flag.startsWith("--provider=")) {
        provider = flag.slice("--provider=".length).trim();
        if (!provider) {
          console.error("--provider requires a value.");
          printUsage();
          process.exitCode = 1;
          return;
        }
        continue;
      }
      if (flag === "--provider") {
        provider = flags[index + 1]?.trim();
        if (!provider) {
          console.error("--provider requires a value.");
          printUsage();
          process.exitCode = 1;
          return;
        }
        index += 1;
        continue;
      }
      if (flag === "--help" || flag === "-h") {
        printUsage();
        return;
      }

      console.error(`Unknown flag: ${flag}`);
      printUsage();
      process.exitCode = 1;
      return;
    }

    if (markdown && short) {
      console.error("--markdown and --short cannot be used together.");
      process.exitCode = 1;
      return;
    }

    process.exitCode = await runModelsCommand({
      provider,
      format: short ? "short" : markdown ? "markdown" : "table",
    });
    return;
  }

  printError(`Unknown command: ${command}`);
  printUsage();
  process.exitCode = 1;
  return;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  printError(message);
  process.exitCode = 1;
});
