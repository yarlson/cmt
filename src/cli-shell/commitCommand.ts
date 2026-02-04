import {
  getDiffLimits,
  isAiCommitBasicEnabled,
} from "../config-policy/index.js";
import {
  collectBoundedDiff,
  commitWithMessage,
  ensureRepoState,
  GitContextError,
  getStagedFiles,
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
  type ProviderAuthContext,
  ProviderAuthError,
} from "../provider-auth/index.js";
import { createTelemetry } from "../telemetry/index.js";
import { promptConfirm, promptSecret } from "./prompts.js";

export interface CommitCommandOptions {
  dryRun: boolean;
  yes: boolean;
  env?: NodeJS.ProcessEnv;
  cwd?: string;
}

function printPreview(message: string, rationale?: string): void {
  console.log("Preview:");
  console.log(message);
  if (rationale) {
    console.log("\nRationale:");
    console.log(rationale);
  }
}

export async function runCommitCommand(
  options: CommitCommandOptions,
): Promise<number> {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const telemetry = createTelemetry(env);

  if (!isAiCommitBasicEnabled(env)) {
    console.log("feature disabled");
    return 0;
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

  const stagedFiles = getStagedFiles(cwd);
  if (stagedFiles.length === 0) {
    console.log("No staged changes to commit.");
    return 0;
  }

  const limits = getDiffLimits(env);
  const diff = collectBoundedDiff(cwd, limits);
  if (diff.diffTruncated || diff.filesTruncated) {
    telemetry.emit("diff_truncated", {
      diffTruncated: diff.diffTruncated,
      filesTruncated: diff.filesTruncated,
      totalFiles: diff.totalFiles,
    });
    console.warn("Diff truncated for safety.");
  }

  let providerContext: ProviderAuthContext;
  try {
    providerContext = await createProviderAuthContext({
      promptForKey: () => promptSecret("API key: "),
      env,
    });
    await providerContext.provider.verifyApiKey();
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
        allowedTypes: DEFAULT_COMMIT_TYPES,
        subjectMaxLength: limits.subjectMaxLength,
      },
      providerContext.provider,
    );
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

  const message = formatCommitMessage(proposal);
  printPreview(message, proposal.rationale);
  telemetry.emit("preview_shown");

  if (proposal.subject.length > limits.subjectMaxLength) {
    console.warn(
      `Subject exceeds ${limits.subjectMaxLength} characters; consider shortening.`,
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
