export type ProviderAuthErrorCode =
  | "api_key_required"
  | "invalid_api_key"
  | "unknown_provider"
  | "provider_timeout"
  | "provider_failure";

export class ProviderAuthError extends Error {
  readonly code: ProviderAuthErrorCode;

  constructor(message: string, code: ProviderAuthErrorCode) {
    super(message);
    this.code = code;
    this.name = "ProviderAuthError";
  }
}
