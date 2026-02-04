export type ProviderAuthErrorCode =
  | "api_key_required"
  | "invalid_api_key"
  | "auth_already_configured"
  | "auth_storage_failed"
  | "auth_verification_failed"
  | "unknown_provider"
  | "oauth_cancelled"
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
