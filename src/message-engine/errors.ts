export type MessageEngineErrorCode = "invalid_proposal" | "provider_failed";

export class MessageEngineError extends Error {
  readonly code: MessageEngineErrorCode;

  constructor(message: string, code: MessageEngineErrorCode) {
    super(message);
    this.code = code;
    this.name = "MessageEngineError";
  }
}
