import { MessageEngineError } from "./errors.js";
import { buildCommitPrompt, type CommitPromptInput } from "./prompt.js";
import { type CommitProposal, parseCommitProposalJson } from "./proposal.js";
import type { CommitDiff } from "./types.js";

export interface CommitMessageProvider {
  generateCommitProposal: (prompt: string) => Promise<string>;
}

export interface GenerateProposalInput {
  diff: CommitDiff;
  allowedTypes: string[];
  subjectMaxLength: number;
}

function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new MessageEngineError(
      "Provider did not return valid JSON.",
      "invalid_proposal",
    );
  }

  return text.slice(start, end + 1);
}

export async function generateCommitProposal(
  input: GenerateProposalInput,
  provider: CommitMessageProvider,
): Promise<CommitProposal> {
  const promptInput: CommitPromptInput = {
    diff: input.diff,
    allowedTypes: input.allowedTypes,
    subjectMaxLength: input.subjectMaxLength,
  };
  const prompt = buildCommitPrompt(promptInput);

  let output: string;
  try {
    output = await provider.generateCommitProposal(prompt);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Provider request failed.";
    throw new MessageEngineError(message, "provider_failed");
  }

  const json = extractJsonObject(output.trim());
  const proposal = parseCommitProposalJson(json, input.allowedTypes);
  proposal.truncation = {
    diff: input.diff.diffTruncated,
    files: input.diff.filesTruncated,
  };
  return proposal;
}
