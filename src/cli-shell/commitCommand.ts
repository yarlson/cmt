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
import {
  promptCommitDecision,
  promptConfirm,
  promptSecret,
} from "./prompts.js";
import { formatIntroTitle } from "./ui.js";

export interface CommitCommandOptions {
  dryRun: boolean;
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
  const includeUnstaged = options.includeUnstaged;
  let stagingAttempted = false;

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

  printPreview(message);

  if (!options.yes) {
    const decision = await promptCommitDecision("Commit with this message?");
    if (!decision || decision === "no") {
      cancel("Cancelled.");
      return 0;
    }
    if (decision === "edit") {
      const editorCommand = env.EDITOR?.trim();
      if (!editorCommand) {
        log.error(
          "$EDITOR is not set. Set EDITOR to edit the message.",
          stderr,
        );
        return 1;
      }
      const editResult = await editMessageInEditor(message, editorCommand);
      if (editResult.status === "edited" && editResult.message) {
        message = editResult.message;
      } else if (editResult.status === "empty") {
        log.info("Edited message is empty. Cancelled.");
        return 0;
      } else {
        const exitCode = editResult.exitCode ?? "unknown";
        log.info(`Editor exited with code ${exitCode}. Cancelled.`);
        return 0;
      }
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
