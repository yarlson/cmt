import {
  resolveCommitConfig,
  resolveDiffLimits,
  resolveScopeFromMappings,
} from "../config-policy/index.js";
import {
  collectBoundedDiff,
  commitWithMessage,
  ensureRepoState,
  GitContextError,
  getStagedFiles,
  getUnstagedTrackedFiles,
  getUntrackedFiles,
  stageTrackedChanges,
} from "../git-context/index.js";
import {
  type CommitProposal,
  DEFAULT_COMMIT_TYPES,
  formatCommitMessage,
  generateCommitProposal,
  MessageEngineError,
} from "../message-engine/index.js";
import {
  createProviderAuthContext,
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
  type ProviderAuthContext,
  ProviderAuthError,
} from "../provider-auth/index.js";
import { createTelemetry } from "../telemetry/index.js";
import { editMessageInEditor } from "./editor.js";
import { promptConfirm, promptSecret } from "./prompts.js";

export interface CommitCommandOptions {
  dryRun: boolean;
  edit: boolean;
  regen: boolean;
  includeUnstaged: boolean;
  provider?: string;
  model?: string;
  types?: string[];
  yes: boolean;
  env?: NodeJS.ProcessEnv;
  cwd?: string;
}

function printPreview(
  message: string,
  rationale?: string,
  warnings: string[] = [],
): void {
  for (const warning of warnings) {
    console.log(warning);
  }
  console.log("Preview:");
  console.log(message);
  if (rationale) {
    console.log("\nRationale:");
    console.log(rationale);
  }
}

function getSubjectLine(message: string): string {
  const [line] = message.split(/\r?\n/);
  return line ?? "";
}

function isConventionalCommit(
  message: string,
  allowedTypes: string[],
): boolean {
  const subject = getSubjectLine(message).trim();
  if (subject.length === 0) {
    return false;
  }

  const match = subject.match(/^(\w+)(\([^)]+\))?:\s+(.+)$/);
  if (!match) {
    return false;
  }

  return allowedTypes.includes(match[1]);
}

const MAX_STAGING_PREVIEW_FILES = 20;

function printFileList(
  header: string,
  files: string[],
  maxEntries = MAX_STAGING_PREVIEW_FILES,
): void {
  console.log(header);
  if (files.length === 0) {
    console.log("  (none)");
    return;
  }

  const entries = files.slice(0, maxEntries);
  for (const file of entries) {
    console.log(`  ${file}`);
  }
  const remaining = files.length - entries.length;
  if (remaining > 0) {
    console.log(`  ...and ${remaining} more`);
  }
}

function formatTruncationWarning(diff: {
  diffTruncated: boolean;
  filesTruncated: boolean;
  files: string[];
  totalFiles: number;
  diffBytes: number;
  maxDiffBytes: number;
}): string | undefined {
  if (!diff.diffTruncated && !diff.filesTruncated) {
    return undefined;
  }

  const details: string[] = [];
  if (diff.diffTruncated) {
    details.push(
      `diff truncated to ${diff.maxDiffBytes} bytes from ${diff.diffBytes}`,
    );
  }
  if (diff.filesTruncated) {
    details.push(
      `file list limited to ${diff.files.length} of ${diff.totalFiles}`,
    );
  }

  const prefix = diff.diffTruncated
    ? "Diff truncated for safety"
    : "File list truncated for safety";
  const detailText = details.length > 0 ? ` (${details.join("; ")}).` : ".";
  return `Warning: ${prefix}${detailText} Consider --edit to review the message.`;
}

export async function runCommitCommand(
  options: CommitCommandOptions,
): Promise<number> {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const telemetry = createTelemetry(env);
  const allowEdit = options.edit;
  const allowRegen = options.regen;
  const includeUnstaged = options.includeUnstaged;
  let stagingAttempted = false;

  if (allowEdit && !process.stdin.isTTY) {
    console.error(
      "Non-interactive shell does not support --edit. Set $EDITOR and run interactively.",
    );
    return 1;
  }

  if (!process.stdin.isTTY && !options.yes) {
    console.error("Non-interactive shell requires --yes.");
    return 1;
  }

  telemetry.emit("commit_flow_started", { cwd });

  try {
    ensureRepoState(cwd);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Repo validation failed.";
    const code =
      error instanceof GitContextError ? error.code : "repo_validation_failed";
    telemetry.emit("repo_validation_failed", { code });
    console.error(message);
    return 1;
  }

  if (includeUnstaged) {
    const unstagedTrackedFiles = getUnstagedTrackedFiles(cwd);
    const untrackedFiles = getUntrackedFiles(cwd);

    telemetry.emit("include_unstaged_requested", {
      trackedCount: unstagedTrackedFiles.length,
      untrackedCount: untrackedFiles.length,
    });

    if (unstagedTrackedFiles.length === 0) {
      console.warn(
        "No unstaged tracked changes found; continuing with staged changes.",
      );
    } else {
      printFileList(
        `Tracked files to stage (${unstagedTrackedFiles.length}):`,
        unstagedTrackedFiles,
      );
    }

    if (untrackedFiles.length > 0) {
      printFileList(
        `Untracked files not staged (${untrackedFiles.length}):`,
        untrackedFiles,
      );
    }

    if (unstagedTrackedFiles.length > 0) {
      if (!options.yes) {
        const confirmed = await promptConfirm(
          "Stage these tracked changes? [y/N] ",
        );
        if (!confirmed) {
          console.log("Cancelled.");
          return 0;
        }
      }

      telemetry.emit("staging_confirmed", {
        fileCount: unstagedTrackedFiles.length,
      });

      try {
        stagingAttempted = true;
        stageTrackedChanges(cwd);
        telemetry.emit("staging_completed", {
          fileCount: unstagedTrackedFiles.length,
        });
      } catch (error) {
        const gitError = error instanceof GitContextError ? error : undefined;
        telemetry.emit("staging_failed", {
          code: gitError?.code ?? "staging_failed",
        });
        console.error(gitError?.message ?? "Staging failed.");
        if (gitError?.details) {
          console.error(gitError.details);
        }
        return 1;
      }
    }
  }

  const stagedFiles = getStagedFiles(cwd);
  if (stagedFiles.length === 0) {
    const message = stagingAttempted
      ? "Staging produced no changes to commit."
      : "No staged changes to commit.";
    console.log(message);
    return 0;
  }

  const diffLimitsResolution = resolveDiffLimits(env);
  const limits = diffLimitsResolution.limits;
  for (const warning of diffLimitsResolution.warnings) {
    console.warn(warning);
  }
  const configResolution = await resolveCommitConfig({
    cwd,
    env,
    flags: {
      providerId: options.provider,
      modelId: options.model,
      types: options.types,
    },
    defaults: {
      providerId: DEFAULT_PROVIDER,
      modelId: DEFAULT_MODEL,
      allowedTypes: DEFAULT_COMMIT_TYPES,
      subjectMaxLength: limits.subjectMaxLength,
    },
  });

  if (configResolution.configFound) {
    telemetry.emit("config_loaded", { path: configResolution.configPath });
  }

  if (
    configResolution.configInvalid ||
    configResolution.invalidSections.length > 0
  ) {
    telemetry.emit("config_invalid", {
      path: configResolution.configPath,
      sections: configResolution.invalidSections,
    });
  }

  if (configResolution.fallbackUsed) {
    telemetry.emit("config_fallback_used", {
      path: configResolution.configPath,
      reason: configResolution.configFound ? "invalid" : "missing",
    });
  }

  telemetry.emit("effective_config_resolved", {
    path: configResolution.configPath,
    providerSource: configResolution.sources.providerId,
    modelSource: configResolution.sources.modelId,
    typesSource: configResolution.sources.allowedTypes,
    subjectSource: configResolution.sources.subjectMaxLength,
    scopeSource: configResolution.sources.scopeMappings,
  });

  for (const warning of configResolution.warnings) {
    console.warn(warning);
  }

  const allowedTypes = configResolution.effective.allowedTypes;
  const subjectMaxLength = configResolution.effective.subjectMaxLength;
  const scopeMappings = configResolution.effective.scopeMappings;
  const providerId = configResolution.effective.providerId;
  const modelId = configResolution.effective.modelId;

  let diff: ReturnType<typeof collectBoundedDiff>;
  try {
    diff = collectBoundedDiff(cwd, limits);
  } catch (error) {
    const gitError = error instanceof GitContextError ? error : undefined;
    telemetry.emit("commit_failed", {
      code: gitError?.code ?? "diff_failed",
    });
    console.error(gitError?.message ?? "Failed to collect diff.");
    if (gitError?.details) {
      console.error(gitError.details);
    }
    return 1;
  }

  if (diff.diffTruncated || diff.filesTruncated) {
    telemetry.emit("diff_size_exceeded", {
      diffBytes: diff.diffBytes,
      maxDiffBytes: diff.maxDiffBytes,
      totalFiles: diff.totalFiles,
      maxFileCount: limits.maxFileCount,
      diffTruncated: diff.diffTruncated,
      filesTruncated: diff.filesTruncated,
    });
    telemetry.emit("diff_truncated", {
      diffTruncated: diff.diffTruncated,
      filesTruncated: diff.filesTruncated,
      totalFiles: diff.totalFiles,
    });
  }

  const binaryOnlyChanges =
    diff.diff.length === 0 &&
    diff.binaryFiles.length > 0 &&
    diff.files.length === diff.binaryFiles.length;

  const mappedScope = resolveScopeFromMappings(diff.files, scopeMappings);

  let providerContext: ProviderAuthContext;
  try {
    providerContext = await createProviderAuthContext({
      promptForKey: () => promptSecret("API key: "),
      env,
      providerId,
      modelId,
    });
    await providerContext.provider.verifyApiKey();
    if (providerContext.modelFallbackUsed && modelId) {
      console.warn(
        `Model ${modelId} not found; using ${providerContext.modelId} instead.`,
      );
    }
  } catch (error) {
    const authError = error instanceof ProviderAuthError ? error : undefined;
    telemetry.emit("commit_failed", { code: authError?.code ?? "auth_error" });
    console.error(authError?.message ?? "Auth failed.");
    return 1;
  }

  let proposal: CommitProposal;
  try {
    proposal = await generateCommitProposal(
      {
        diff,
        allowedTypes,
        subjectMaxLength,
      },
      providerContext.provider,
    );
    if (mappedScope) {
      proposal.scope = mappedScope;
    }
    telemetry.emit("proposal_generated", {
      type: proposal.type,
      scope: proposal.scope ?? null,
    });
  } catch (error) {
    const message =
      error instanceof MessageEngineError ? error.message : "Proposal failed.";
    telemetry.emit("commit_failed", { code: "proposal_failed" });
    console.error(message);
    return 1;
  }

  let message = formatCommitMessage(proposal);
  let rationale = proposal.rationale;

  if (allowEdit) {
    telemetry.emit("edit_requested");
    const editorCommand = env.EDITOR?.trim();
    if (!editorCommand) {
      const warning =
        "$EDITOR is not set. Set EDITOR to use --edit. Continuing without edit.";
      if (options.yes) {
        console.warn(warning);
      } else {
        const continueWithoutEdit = await promptConfirm(
          "$EDITOR is not set. Set EDITOR to use --edit. Continue without edit? [y/N] ",
        );
        if (!continueWithoutEdit) {
          console.log("Cancelled.");
          return 0;
        }
      }
    } else {
      const editResult = await editMessageInEditor(message, editorCommand);
      telemetry.emit("edit_completed", {
        exitCode: editResult.exitCode ?? null,
        signal: editResult.signal ?? null,
        applied: editResult.status === "edited",
      });

      if (editResult.status === "edited" && editResult.message) {
        message = editResult.message;
        rationale = undefined;
      } else if (editResult.status === "empty") {
        console.error("Edited message is empty. Keeping previous message.");
      } else {
        const exitCode = editResult.exitCode ?? "unknown";
        console.warn(
          `Editor exited with code ${exitCode}. Keeping previous message.`,
        );
      }
    }
  }

  if (allowRegen) {
    telemetry.emit("regen_requested");
    const previousMessage = message;
    try {
      const regenerated = await generateCommitProposal(
        {
          diff,
          allowedTypes,
          subjectMaxLength,
        },
        providerContext.provider,
      );
      if (mappedScope) {
        regenerated.scope = mappedScope;
      }
      const regeneratedMessage = formatCommitMessage(regenerated);
      if (regeneratedMessage === previousMessage) {
        console.log("Regenerated message is identical to previous proposal.");
      }
      message = regeneratedMessage;
      rationale = regenerated.rationale;
      proposal = regenerated;
      telemetry.emit("regen_succeeded", {
        type: regenerated.type,
        scope: regenerated.scope ?? null,
        identical: regeneratedMessage === previousMessage,
      });
    } catch (error) {
      const messageText =
        error instanceof MessageEngineError ? error.message : "Regen failed.";
      const code =
        error instanceof MessageEngineError ? error.code : "regen_failed";
      telemetry.emit("regen_failed", { code });
      console.warn(`${messageText} Using previous message.`);
    }
  }

  const warnings: string[] = [];
  const truncationWarning = formatTruncationWarning(diff);
  if (truncationWarning) {
    warnings.push(truncationWarning);
  }
  if (binaryOnlyChanges) {
    warnings.push(
      "Warning: Only binary files changed; consider --edit to refine the message.",
    );
  }

  printPreview(message, rationale, warnings);
  telemetry.emit("preview_shown");
  if (truncationWarning) {
    telemetry.emit("truncation_warning_shown", {
      diffTruncated: diff.diffTruncated,
      filesTruncated: diff.filesTruncated,
    });
  }

  const subjectLine = getSubjectLine(message);
  if (subjectLine.length > subjectMaxLength) {
    console.warn(
      `Subject exceeds ${subjectMaxLength} characters; consider shortening.`,
    );
  }

  if (!isConventionalCommit(message, allowedTypes)) {
    console.warn(
      "Message does not match Conventional Commit format; consider editing.",
    );
  }

  if (!options.yes) {
    const confirmed = await promptConfirm("Commit with this message? [y/N] ");
    if (!confirmed) {
      console.log("Cancelled.");
      return 0;
    }
  }

  telemetry.emit("commit_confirmed", { dryRun: options.dryRun });

  if (options.dryRun) {
    console.log("Dry run message:");
    console.log(message);
    return 0;
  }

  try {
    const result = commitWithMessage(cwd, message);
    telemetry.emit("commit_succeeded", { hash: result.hash });
    console.log(`Commit: ${result.hash} ${result.subject}`);
    return 0;
  } catch (error) {
    const gitError = error instanceof GitContextError ? error : undefined;
    telemetry.emit("commit_failed", {
      code: gitError?.code ?? "commit_failed",
    });
    console.error(gitError?.message ?? "Commit failed.");
    if (gitError?.details) {
      console.error(gitError.details);
    }
    return 1;
  }
}
