import { ModelRegistry } from "@mariozechner/pi-coding-agent";
import { createAuthStorage } from "../provider-auth/authStorage.js";
import { listOAuthProviders } from "../provider-auth/index.js";

export type OutputFormat = "table" | "markdown" | "short";

export interface ProvidersCommandOptions {
  env?: NodeJS.ProcessEnv;
  format?: OutputFormat;
}

export interface ModelsCommandOptions {
  provider?: string;
  env?: NodeJS.ProcessEnv;
  format?: OutputFormat;
}

type ProviderRow = Record<"provider" | "name" | "oauth" | "models", string>;

type ModelRow = Record<
  "model" | "context" | "maxOut" | "thinking" | "images",
  string
>;

type ModelRowWithProvider = Record<
  "provider" | "model" | "context" | "maxOut" | "thinking" | "images",
  string
>;

function formatTokenCount(count: number): string {
  if (count >= 1_000_000) {
    const millions = count / 1_000_000;
    return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
  }
  if (count >= 1_000) {
    const thousands = count / 1_000;
    return thousands % 1 === 0 ? `${thousands}K` : `${thousands.toFixed(1)}K`;
  }
  return count.toString();
}

function printTable<Keys extends string>(
  headers: Record<Keys, string>,
  rows: Array<Record<Keys, string>>,
): void {
  if (rows.length === 0) {
    return;
  }
  const keys = Object.keys(headers) as Keys[];
  const widths = Object.fromEntries(
    keys.map((key) => {
      const maxCell = Math.max(
        headers[key].length,
        ...rows.map((row) => row[key].length),
      );
      return [key, maxCell];
    }),
  ) as Record<Keys, number>;
  const headerLine = keys
    .map((key) => headers[key].padEnd(widths[key]))
    .join("  ");
  console.log(headerLine);
  for (const row of rows) {
    const line = keys.map((key) => row[key].padEnd(widths[key])).join("  ");
    console.log(line);
  }
}

function printMarkdownTable<Keys extends string>(
  headers: Record<Keys, string>,
  rows: Array<Record<Keys, string>>,
): void {
  if (rows.length === 0) {
    return;
  }
  const keys = Object.keys(headers) as Keys[];
  const headerLine = `| ${keys.map((key) => headers[key]).join(" | ")} |`;
  const separatorLine = `| ${keys.map(() => "---").join(" | ")} |`;
  console.log(headerLine);
  console.log(separatorLine);
  for (const row of rows) {
    const line = `| ${keys.map((key) => row[key]).join(" | ")} |`;
    console.log(line);
  }
}

function buildProviderRows(
  providers: string[],
  modelsByProvider: Map<string, string[]>,
  oauthNames: Map<string, string>,
  oauthProviders: Set<string>,
): ProviderRow[] {
  return providers.map((provider) => {
    const modelCount = modelsByProvider.get(provider)?.length ?? 0;
    return {
      provider,
      name: oauthNames.get(provider) ?? "-",
      oauth: oauthProviders.has(provider) ? "yes" : "no",
      models: modelCount.toString(),
    };
  });
}

function buildModelRows(
  models: {
    id: string;
    contextWindow: number;
    maxTokens: number;
    reasoning?: boolean;
    input: string[];
  }[],
): ModelRow[] {
  return models.map((model) => ({
    model: model.id,
    context: formatTokenCount(model.contextWindow),
    maxOut: formatTokenCount(model.maxTokens),
    thinking: model.reasoning ? "yes" : "no",
    images: model.input.includes("image") ? "yes" : "no",
  }));
}

function createRegistry(env: NodeJS.ProcessEnv): ModelRegistry {
  const authStorage = createAuthStorage(env);
  return new ModelRegistry(authStorage);
}

function reportLoadError(registry: ModelRegistry): void {
  const loadError = registry.getError();
  if (loadError) {
    console.error(loadError);
  }
}

export async function runProvidersCommand(
  options: ProvidersCommandOptions,
): Promise<number> {
  const env = options.env ?? process.env;
  const format = options.format ?? "table";
  const registry = createRegistry(env);
  reportLoadError(registry);

  const models = registry.getAll();
  const modelsByProvider = new Map<string, string[]>();
  for (const model of models) {
    const entries = modelsByProvider.get(model.provider) ?? [];
    entries.push(model.id);
    modelsByProvider.set(model.provider, entries);
  }

  const oauthList = listOAuthProviders(env);
  const oauthNames = new Map(oauthList.map((entry) => [entry.id, entry.name]));
  const oauthProviders = new Set(oauthList.map((entry) => entry.id));

  const providerIds = Array.from(
    new Set([...modelsByProvider.keys(), ...oauthProviders]),
  ).sort((a, b) => a.localeCompare(b));

  if (providerIds.length === 0) {
    console.error("No providers available.");
    return 1;
  }

  const rows = buildProviderRows(
    providerIds,
    modelsByProvider,
    oauthNames,
    oauthProviders,
  );
  if (format === "short") {
    for (const row of rows) {
      console.log(row.provider);
    }
    return 0;
  }

  const headers = {
    provider: "provider",
    name: "name",
    oauth: "oauth",
    models: "models",
  };
  if (format === "markdown") {
    printMarkdownTable(headers, rows);
    return 0;
  }
  printTable(headers, rows);
  return 0;
}

export async function runModelsCommand(
  options: ModelsCommandOptions,
): Promise<number> {
  const env = options.env ?? process.env;
  const format = options.format ?? "table";
  const registry = createRegistry(env);
  reportLoadError(registry);

  const models = registry.getAll();
  const providerFilter = options.provider?.trim();
  const filtered = providerFilter
    ? models.filter((model) => model.provider === providerFilter)
    : models;

  if (filtered.length === 0) {
    if (providerFilter) {
      console.error(`Unknown provider or no models found: ${providerFilter}`);
      console.error("Run: cmt providers");
      return 1;
    }
    console.error("No models available.");
    return 1;
  }

  const sorted = filtered.sort((a, b) => {
    if (a.provider !== b.provider) {
      return a.provider.localeCompare(b.provider);
    }
    return a.id.localeCompare(b.id);
  });

  if (providerFilter) {
    if (format === "short") {
      for (const model of sorted) {
        console.log(model.id);
      }
      return 0;
    }

    const rows = buildModelRows(sorted);
    const headers = {
      model: "model",
      context: "context",
      maxOut: "max-out",
      thinking: "thinking",
      images: "images",
    };
    if (format === "markdown") {
      printMarkdownTable(headers, rows);
      return 0;
    }
    printTable(headers, rows);
    return 0;
  }

  if (format === "short") {
    for (const model of sorted) {
      console.log(`${model.provider}/${model.id}`);
    }
    return 0;
  }

  const rows: ModelRowWithProvider[] = sorted.map((model) => ({
    provider: model.provider,
    model: model.id,
    context: formatTokenCount(model.contextWindow),
    maxOut: formatTokenCount(model.maxTokens),
    thinking: model.reasoning ? "yes" : "no",
    images: model.input.includes("image") ? "yes" : "no",
  }));
  const headers = {
    provider: "provider",
    model: "model",
    context: "context",
    maxOut: "max-out",
    thinking: "thinking",
    images: "images",
  };
  if (format === "markdown") {
    printMarkdownTable(headers, rows);
    return 0;
  }
  printTable(headers, rows);
  return 0;
}
