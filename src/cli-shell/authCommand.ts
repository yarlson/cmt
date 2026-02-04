import { spawnSync } from "node:child_process";
import { cancel, intro, log, outro } from "@clack/prompts";
import {
  hasStoredAuth,
  listOAuthProviders,
  loginWithOAuth,
  type OAuthProviderSummary,
  ProviderAuthError,
} from "../provider-auth/index.js";
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
  const stderr = { output: process.stderr };

  const providers = listOAuthProviders(env);
  const providerList = formatProviderList(providers);
  if (!options.provider) {
    log.error("--provider requires a value.", stderr);
    if (providerList.length > 0) {
      log.error(`Supported providers: ${providerList}`, stderr);
    }
    return 1;
  }

  const selectedProvider = providers.find(
    (provider) => provider.id === options.provider,
  );
  if (!selectedProvider) {
    log.error(`Unknown provider: ${options.provider}`, stderr);
    if (providerList.length > 0) {
      log.error(`Supported providers: ${providerList}`, stderr);
    }
    return 1;
  }

  if (!process.stdin.isTTY) {
    log.error("Non-interactive shell does not support OAuth login.", stderr);
    return 1;
  }

  intro("Auth");

  let replaceExisting = false;
  if (hasStoredAuth(selectedProvider.id, env)) {
    replaceExisting = await promptConfirm(
      `Auth already configured for ${selectedProvider.name}. Replace?`,
    );
    if (!replaceExisting) {
      cancel("Cancelled.");
      return 0;
    }
    log.info(`Starting OAuth login for ${selectedProvider.name}...`);
  }

  try {
    const result = await loginWithOAuth({
      providerId: selectedProvider.id,
      env,
      replaceExisting,
      onAuth: (info) => {
        const opened = tryOpenBrowser(info.url);
        if (opened) {
          log.info(
            `Opened your browser. If it did not open, visit ${info.url}`,
          );
        } else {
          log.info(`Open ${info.url} to authenticate.`);
        }
        if (info.instructions) {
          log.info(info.instructions);
        }
      },
      onPrompt: async (prompt) => {
        const answer = await promptInput(
          prompt.message,
          prompt.allowEmpty ?? false,
        );
        if (answer === null && !prompt.allowEmpty) {
          throw new ProviderAuthError("OAuth cancelled.", "oauth_cancelled");
        }
        return answer ?? "";
      },
      onProgress: (message) => {
        if (message && message.trim().length > 0) {
          log.info(message);
        }
      },
      onManualCodeInput: selectedProvider.usesCallbackServer
        ? undefined
        : async () => {
            const manual = await promptInput("Enter authorization code");
            if (!manual) {
              throw new ProviderAuthError(
                "OAuth cancelled.",
                "oauth_cancelled",
              );
            }
            return manual;
          },
    });

    outro(`OAuth login complete for ${result.providerName}.`);
    return 0;
  } catch (error) {
    const authError = error instanceof ProviderAuthError ? error : undefined;
    const message = authError?.message ?? "OAuth failed.";
    if (authError?.code === "oauth_cancelled") {
      cancel(message);
      return 0;
    }
    log.error(message, stderr);
    return 1;
  }
}
