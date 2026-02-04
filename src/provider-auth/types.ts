export interface CommitMessageProvider {
  verifyApiKey: () => Promise<void>;
  generateCommitProposal: (prompt: string) => Promise<string>;
}
