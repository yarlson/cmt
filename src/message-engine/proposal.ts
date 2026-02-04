import { MessageEngineError } from "./errors.js";

export interface CommitProposal {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  footers?: string[];
  rationale?: string;
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeFooters(value: unknown): string[] | undefined {
  if (typeof value === "string") {
    const footer = value.trim();
    return footer.length > 0 ? [footer] : undefined;
  }

  if (Array.isArray(value)) {
    const footers = value
      .filter((entry) => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    return footers.length > 0 ? footers : undefined;
  }

  return undefined;
}

export function parseCommitProposalJson(
  json: string,
  allowedTypes: string[],
): CommitProposal {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new MessageEngineError(
      "Invalid proposal JSON from provider.",
      "invalid_proposal",
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new MessageEngineError(
      "Invalid proposal payload from provider.",
      "invalid_proposal",
    );
  }

  const record = parsed as Record<string, unknown>;
  const type = normalizeString(record.type);
  const scope = normalizeString(record.scope);
  const subject = normalizeString(record.subject);
  const body = normalizeString(record.body);
  const footers = normalizeFooters(record.footers);
  const rationale = normalizeString(record.rationale);

  if (!type) {
    throw new MessageEngineError(
      "Missing commit type from provider.",
      "invalid_proposal",
    );
  }

  if (!allowedTypes.includes(type)) {
    throw new MessageEngineError(
      `Unsupported commit type: ${type}.`,
      "invalid_proposal",
    );
  }

  if (!subject) {
    throw new MessageEngineError(
      "Missing commit subject from provider.",
      "invalid_proposal",
    );
  }

  if (subject.includes("\n")) {
    throw new MessageEngineError(
      "Commit subject must be a single line.",
      "invalid_proposal",
    );
  }

  return {
    type,
    scope,
    subject,
    body,
    footers,
    rationale,
  };
}

export function formatCommitMessage(proposal: CommitProposal): string {
  const header = proposal.scope
    ? `${proposal.type}(${proposal.scope}): ${proposal.subject}`
    : `${proposal.type}: ${proposal.subject}`;

  const sections = [header];

  if (proposal.body) {
    sections.push(proposal.body);
  }

  if (proposal.footers && proposal.footers.length > 0) {
    sections.push(proposal.footers.join("\n"));
  }

  return sections.join("\n\n");
}
