import { describe, expect, it } from "bun:test";
import { formatCommitMessage, parseCommitProposalJson } from "./proposal.js";

describe("commit proposal", () => {
  it("parses and formats a valid proposal", () => {
    const json = JSON.stringify({
      type: "feat",
      scope: "core",
      subject: "add greeting",
      body: "Add greeting output.",
      footers: ["Refs: TEST-1"],
      rationale: "Updates CLI output.",
    });

    const proposal = parseCommitProposalJson(json, ["feat", "fix"]);
    const message = formatCommitMessage(proposal);

    expect(proposal.type).toBe("feat");
    expect(proposal.scope).toBe("core");
    expect(proposal.subject).toBe("add greeting");
    expect(message).toBe(
      "feat(core): add greeting\n\nAdd greeting output.\n\nRefs: TEST-1",
    );
  });

  it("rejects unsupported commit types", () => {
    const json = JSON.stringify({
      type: "docs",
      subject: "update readme",
    });

    expect(() => parseCommitProposalJson(json, ["feat", "fix"])).toThrow(
      "Unsupported commit type",
    );
  });
});
