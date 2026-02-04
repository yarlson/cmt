import { cancel, intro, log, note, outro, spinner } from "@clack/prompts";
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
import { editMessageInEditor } from "./editor.js";
import { promptConfirm, promptSecret } from "./prompts.js";
import { formatIntroTitle } from "./ui.js";

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

function printPreview(message: string): void {
  note(message, "Preview", { format: (line) => line });
}

const MAX_STAGING_PREVIEW_FILES = 20;

function printFileList(
  header: string,
  files: string[],
  maxEntries = MAX_STAGING_PREVIEW_FILES,
): void {
  const entries = files.slice(0, maxEntries);
  const remaining = files.length - entries.length;
  const lines =
    entries.length > 0 ? entries.map((file) => `- ${file}`) : ["(none)"];
  if (remaining > 0) {
    lines.push(`...and ${remaining} more`);
  }
  note(lines.join("\n"), header, { format: (line) => line });
}

export async function runCommitCommand(
  options: CommitCommandOptions,
): Promise<number> {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const stderr = { output: process.stderr };
  const allowEdit = options.edit;
  const allowRegen = options.regen;
  const includeUnstaged = options.includeUnstaged;
  let stagingAttempted = false;

  if (allowEdit && !process.stdin.isTTY) {
    log.error(
      "Non-interactive shell does not support --edit. Set $EDITOR and run interactively.",
      stderr,
    );
    return 1;
  }

  if (!process.stdin.isTTY && !options.yes) {
    log.error("Non-interactive shell requires --yes.", stderr);
    return 1;
  }

  try {
    ensureRepoState(cwd);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Repo validation failed.";
    log.error(message, stderr);
    return 1;
  }

  intro(formatIntroTitle(" Cmt "));

  if (includeUnstaged) {
    const unstagedTrackedFiles = getUnstagedTrackedFiles(cwd);
    const untrackedFiles = getUntrackedFiles(cwd);

    if (unstagedTrackedFiles.length > 0) {
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
        const confirmed = await promptConfirm("Stage these tracked changes?");
        if (!confirmed) {
          cancel("Cancelled.");
          return 0;
        }
      }

      try {
        stagingAttempted = true;
        stageTrackedChanges(cwd);
      } catch (error) {
        const gitError = error instanceof GitContextError ? error : undefined;
        log.error(gitError?.message ?? "Staging failed.", stderr);
        if (gitError?.details) {
          log.error(gitError.details, stderr);
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
    outro(message);
    return 0;
  }

  const limits = resolveDiffLimits(env).limits;
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
    log.error(gitError?.message ?? "Failed to collect diff.", stderr);
    if (gitError?.details) {
      log.error(gitError.details, stderr);
    }
    return 1;
  }

  const mappedScope = resolveScopeFromMappings(diff.files, scopeMappings);

  let providerContext: ProviderAuthContext;
  try {
    providerContext = await createProviderAuthContext({
      promptForKey: () => promptSecret("API key"),
      env,
      providerId,
      modelId,
    });
    await providerContext.provider.verifyApiKey();
    if (providerContext.modelFallbackUsed && modelId) {
      log.info(
        `Model ${modelId} not found; using ${providerContext.modelId} instead.`,
      );
    }
  } catch (error) {
    const authError = error instanceof ProviderAuthError ? error : undefined;
    log.error(authError?.message ?? "Auth failed.", stderr);
    return 1;
  }

  let proposal: CommitProposal;
  const proposalSpinner = spinner();
  proposalSpinner.start("Generating commit message");
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
    proposalSpinner.stop("Commit message generated");
  } catch (error) {
    proposalSpinner.stop("Failed to generate commit message");
    const message =
      error instanceof MessageEngineError ? error.message : "Proposal failed.";
    log.error(message, stderr);
    return 1;
  }

  let message = formatCommitMessage(proposal);
  if (allowEdit) {
    const editorCommand = env.EDITOR?.trim();
    if (!editorCommand) {
      const warning =
        "$EDITOR is not set. Set EDITOR to use --edit. Continuing without edit.";
      if (options.yes) {
        log.info(warning);
      } else {
        const continueWithoutEdit = await promptConfirm(
          "$EDITOR is not set. Set EDITOR to use --edit. Continue without edit?",
        );
        if (!continueWithoutEdit) {
          cancel("Cancelled.");
          return 0;
        }
      }
    } else {
      const editResult = await editMessageInEditor(message, editorCommand);
      if (editResult.status === "edited" && editResult.message) {
        message = editResult.message;
      } else if (editResult.status === "empty") {
        log.info("Edited message is empty. Keeping previous message.");
      } else {
        const exitCode = editResult.exitCode ?? "unknown";
        log.info(
          `Editor exited with code ${exitCode}. Keeping previous message.`,
        );
      }
    }
  }

  if (allowRegen) {
    const regenSpinner = spinner();
    regenSpinner.start("Regenerating commit message");
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
      message = formatCommitMessage(regenerated);
      proposal = regenerated;
      regenSpinner.stop("Commit message regenerated");
    } catch (error) {
      regenSpinner.stop("Regeneration failed");
      const messageText =
        error instanceof MessageEngineError ? error.message : "Regen failed.";
      log.info(`${messageText} Using previous message.`);
    }
  }

  printPreview(message);

  if (!options.yes) {
    const confirmed = await promptConfirm("Commit with this message?");
    if (!confirmed) {
      cancel("Cancelled.");
      return 0;
    }
  }

  if (options.dryRun) {
    note(message, "Dry run message", { format: (line) => line });
    outro("Dry run complete.");
    return 0;
  }

  const commitSpinner = spinner();
  commitSpinner.start("Committing changes");
  try {
    const result = commitWithMessage(cwd, message);
    commitSpinner.stop(`Commit ${result.hash} ${result.subject}`);
    outro("Commit complete.");
    return 0;
  } catch (error) {
    commitSpinner.stop("Commit failed");
    const gitError = error instanceof GitContextError ? error : undefined;
    log.error(gitError?.message ?? "Commit failed.", stderr);
    if (gitError?.details) {
      log.error(gitError.details, stderr);
    }
    return 1;
  }
}
