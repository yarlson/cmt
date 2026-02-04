import { spawnSync } from "node:child_process";
import {
  hasStoredAuth,
  listOAuthProviders,
  loginWithOAuth,
  type OAuthProviderSummary,
  ProviderAuthError,
} from "../provider-auth/index.js";
import { createTelemetry } from "../telemetry/index.js";
import { promptConfirm, promptInput } from "./prompts.js";

export interface AuthCommandOptions {
  provider?: string;
  env?: NodeJS.ProcessEnv;
}

function formatProviderList(providers: OAuthProviderSummary[]): string {
  return providers
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((provider) => `${provider.id} (${provider.name})`)
    .join(", ");
}

function tryOpenBrowser(url: string): boolean {
  const platform = process.platform;
  let command: string | null = null;
  let args: string[] = [url];

  if (platform === "darwin") {
    command = "open";
  } else if (platform === "linux") {
    command = "xdg-open";
  } else if (platform === "win32") {
    command = "cmd";
    args = ["/c", "start", "", url];
  }

  if (!command) {
    return false;
  }

  const result = spawnSync(command, args, { stdio: "ignore" });
  return result.status === 0;
}

export async function runAuthCommand(
  options: AuthCommandOptions,
): Promise<number> {
  const env = options.env ?? process.env;
  const telemetry = createTelemetry(env);

  const providers = listOAuthProviders(env);
  const providerList = formatProviderList(providers);
  if (!options.provider) {
    console.error("--provider requires a value.");
    if (providerList.length > 0) {
      console.error(`Supported providers: ${providerList}`);
    }
    return 1;
  }

  const selectedProvider = providers.find(
    (provider) => provider.id === options.provider,
  );
  if (!selectedProvider) {
    console.error(`Unknown provider: ${options.provider}`);
    if (providerList.length > 0) {
      console.error(`Supported providers: ${providerList}`);
    }
    return 1;
  }

  if (!process.stdin.isTTY) {
    console.error("Non-interactive shell does not support OAuth login.");
    return 1;
  }

  let replaceExisting = false;
  if (hasStoredAuth(selectedProvider.id, env)) {
    replaceExisting = await promptConfirm(
      `Auth already configured for ${selectedProvider.name}. Replace? [y/N] `,
    );
    if (!replaceExisting) {
      console.log("Cancelled.");
      return 0;
    }
    console.log(`Starting OAuth login for ${selectedProvider.name}...`);
  }

  telemetry.emit("oauth_started", { provider: selectedProvider.id });

  try {
    const result = await loginWithOAuth({
      providerId: selectedProvider.id,
      env,
      replaceExisting,
      onAuth: (info) => {
        const opened = tryOpenBrowser(info.url);
        if (opened) {
          console.log(
            `Opened your browser. If it did not open, visit ${info.url}`,
          );
        } else {
          console.log(`Open ${info.url} to authenticate.`);
        }
        if (info.instructions) {
          console.log(info.instructions);
        }
      },
      onPrompt: async (prompt) => {
        const answer = await promptInput(
          `${prompt.message}${prompt.message.endsWith(" ") ? "" : " "}`,
          prompt.allowEmpty ?? false,
        );
        if (answer === null && !prompt.allowEmpty) {
          throw new ProviderAuthError("OAuth cancelled.", "oauth_cancelled");
        }
        return answer ?? "";
      },
      onProgress: (message) => {
        if (message && message.trim().length > 0) {
          console.log(message);
        }
      },
      onManualCodeInput: selectedProvider.usesCallbackServer
        ? undefined
        : async () => {
            const manual = await promptInput("Enter authorization code: ");
            if (!manual) {
              throw new ProviderAuthError(
                "OAuth cancelled.",
                "oauth_cancelled",
              );
            }
            return manual;
          },
    });

    telemetry.emit("oauth_completed", { provider: result.providerId });
    telemetry.emit("auth_token_stored", { provider: result.providerId });
    console.log(`OAuth login complete for ${result.providerName}.`);
    return 0;
  } catch (error) {
    const authError = error instanceof ProviderAuthError ? error : undefined;
    if (authError?.code === "auth_verification_failed") {
      telemetry.emit("auth_verification_failed", {
        provider: selectedProvider.id,
      });
    }
    telemetry.emit("oauth_failed", {
      provider: selectedProvider.id,
      code: authError?.code ?? "oauth_failed",
    });
    const message = authError?.message ?? "OAuth failed.";
    if (authError?.code === "oauth_cancelled") {
      console.log(message);
      return 0;
    }
    console.error(message);
    return 1;
  }
}
