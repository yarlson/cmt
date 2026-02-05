import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type ConfigSource =
  | "flag"
  | "env"
  | "config"
  | "globalConfig"
  | "default";

export interface ScopeMapping {
  prefix: string;
  scope: string;
}

export interface CommitConfigDefaults {
  providerId: string;
  modelId: string;
  allowedTypes: string[];
  subjectMaxLength: number;
  maxDiffBytes: number;
  maxFileCount: number;
}

export interface CommitConfigFlags {
  providerId?: string;
  modelId?: string;
  types?: string[];
  subjectMaxLength?: number;
  maxDiffBytes?: number;
  maxFileCount?: number;
}

export interface CommitConfig {
  providerId: string;
  modelId: string;
  allowedTypes: string[];
  subjectMaxLength: number;
  maxDiffBytes: number;
  maxFileCount: number;
  scopeMappings: ScopeMapping[];
}

export interface CommitConfigResolution {
  effective: CommitConfig;
  sources: Record<keyof CommitConfig, ConfigSource>;
  configPath: string;
  configFound: boolean;
  configInvalid: boolean;
  invalidSections: string[];
  fallbackUsed: boolean;
  warnings: string[];
  hasSecrets: boolean;
}

const CONFIG_PATH_ENV = "CMT_CONFIG_PATH";
const PROVIDER_ENV = "CMT_PROVIDER";
const MODEL_ENV = "CMT_MODEL";
const TYPES_ENV = "CMT_TYPES";
const SUBJECT_MAX_ENV = "CMT_SUBJECT_MAX_LENGTH";
const MAX_DIFF_BYTES_ENV = "CMT_MAX_DIFF_BYTES";
const MAX_FILE_COUNT_ENV = "CMT_MAX_FILES";
const DEFAULT_CONFIG_FILE = ".cmt.json";
const GLOBAL_CONFIG_FILE = path.join(
  os.homedir(),
  ".config",
  "cmt",
  "config.json",
);
const SUPPORTED_SCHEMA_VERSION = 1;

interface ConfigFileV1 {
  schemaVersion?: number;
  provider?: string;
  model?: string;
  types?: string[];
  subjectMaxLength?: number;
  maxDiffBytes?: number;
  maxFileCount?: number;
  scopeMappings?: ScopeMapping[];
}

function buildDefaultConfig(
  defaults: CommitConfigDefaults,
): Required<
  Pick<
    ConfigFileV1,
    | "schemaVersion"
    | "provider"
    | "model"
    | "types"
    | "subjectMaxLength"
    | "maxDiffBytes"
    | "maxFileCount"
  >
> &
  Pick<ConfigFileV1, "scopeMappings"> {
  return {
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    provider: defaults.providerId,
    model: defaults.modelId,
    types: defaults.allowedTypes,
    subjectMaxLength: defaults.subjectMaxLength,
    maxDiffBytes: defaults.maxDiffBytes,
    maxFileCount: defaults.maxFileCount,
    scopeMappings: [],
  };
}

interface ConfigLoadResult {
  config?: ConfigFileV1;
  found: boolean;
  invalid: boolean;
  invalidSections: string[];
  warnings: string[];
  hasSecrets: boolean;
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parsePositiveInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function normalizeTypes(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const normalized = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const unique = Array.from(new Set(normalized));
  return unique.length > 0 ? unique : undefined;
}

function parseTypesFromEnv(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const unique = Array.from(new Set(normalized));
  return unique.length > 0 ? unique : undefined;
}

function normalizeScopeMappings(value: unknown): ScopeMapping[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const mappings: ScopeMapping[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const prefix = normalizeString(record.prefix);
    const scope = normalizeString(record.scope);
    if (prefix && scope) {
      mappings.push({ prefix, scope });
    }
  }
  return mappings.length > 0 ? mappings : undefined;
}

function resolveConfigPath(cwd: string, env: NodeJS.ProcessEnv): string {
  const override = env[CONFIG_PATH_ENV];
  if (override && override.trim().length > 0) {
    return path.resolve(cwd, override.trim());
  }
  return path.join(cwd, DEFAULT_CONFIG_FILE);
}

function containsSecretKeys(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (/(token|secret|password|apiKey|api_key|key)/i.test(key)) {
      if (typeof entry === "string" && entry.trim().length > 0) {
        return true;
      }
    }
    if (typeof entry === "object" && entry !== null) {
      if (containsSecretKeys(entry)) {
        return true;
      }
    }
  }
  return false;
}

async function loadConfigFile(
  configPath: string,
  label: string,
  options?: { warnOnMissing?: boolean },
): Promise<ConfigLoadResult> {
  const warnings: string[] = [];
  const warnOnMissing = options?.warnOnMissing ?? true;
  try {
    const raw = await fs.readFile(configPath, "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        found: true,
        invalid: true,
        invalidSections: ["schema"],
        warnings: [`${label} is not valid JSON; using defaults.`],
        hasSecrets: false,
      };
    }

    if (!parsed || typeof parsed !== "object") {
      return {
        found: true,
        invalid: true,
        invalidSections: ["schema"],
        warnings: [`${label} has invalid schema; using defaults.`],
        hasSecrets: false,
      };
    }

    const record = parsed as Record<string, unknown>;
    const schemaVersion = parsePositiveInt(record.schemaVersion);
    if (schemaVersion && schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
      return {
        found: true,
        invalid: true,
        invalidSections: ["schemaVersion"],
        warnings: [
          `Unsupported ${label} schema version ${schemaVersion}; using defaults.`,
        ],
        hasSecrets: containsSecretKeys(record),
      };
    }

    const invalidSections: string[] = [];
    const provider = normalizeString(record.provider);
    if (record.provider !== undefined && !provider) {
      invalidSections.push("provider");
    }
    const model = normalizeString(record.model);
    if (record.model !== undefined && !model) {
      invalidSections.push("model");
    }
    const types = normalizeTypes(record.types);
    if (record.types !== undefined && !types) {
      invalidSections.push("types");
    }
    const subjectMaxLength = parsePositiveInt(record.subjectMaxLength);
    if (record.subjectMaxLength !== undefined && !subjectMaxLength) {
      invalidSections.push("subjectMaxLength");
    }
    const maxDiffBytes = parsePositiveInt(record.maxDiffBytes);
    if (record.maxDiffBytes !== undefined && !maxDiffBytes) {
      invalidSections.push("maxDiffBytes");
    }
    const maxFileCount = parsePositiveInt(record.maxFileCount);
    if (record.maxFileCount !== undefined && !maxFileCount) {
      invalidSections.push("maxFileCount");
    }
    const scopeMappings = normalizeScopeMappings(record.scopeMappings);
    if (record.scopeMappings !== undefined && !scopeMappings) {
      invalidSections.push("scopeMappings");
    }

    if (invalidSections.length > 0) {
      warnings.push(
        `Ignoring invalid config sections: ${invalidSections.join(", ")}.`,
      );
    }

    return {
      found: true,
      invalid: false,
      invalidSections,
      warnings,
      hasSecrets: containsSecretKeys(record),
      config: {
        schemaVersion,
        provider,
        model,
        types,
        subjectMaxLength,
        maxDiffBytes,
        maxFileCount,
        scopeMappings,
      },
    };
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        return {
          found: false,
          invalid: false,
          invalidSections: [],
          warnings: warnOnMissing
            ? [`${label} not found; using defaults.`]
            : [],
          hasSecrets: false,
        };
      }
    }

    return {
      found: false,
      invalid: true,
      invalidSections: ["read"],
      warnings: [`${label} could not be read; using defaults.`],
      hasSecrets: false,
    };
  }
}

async function ensureGlobalConfigFile(
  configPath: string,
  defaults: CommitConfigDefaults,
  warnings: string[],
): Promise<void> {
  const payload = JSON.stringify(buildDefaultConfig(defaults), null, 2);
  try {
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, `${payload}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EEXIST") {
        return;
      }
    }
    warnings.push("Global config file could not be created; using defaults.");
  }
}

export async function ensureGlobalConfig(options: {
  defaults: CommitConfigDefaults;
  warnings?: string[];
}): Promise<void> {
  const warnings = options.warnings ?? [];
  await ensureGlobalConfigFile(GLOBAL_CONFIG_FILE, options.defaults, warnings);
}

function resolveWithPrecedence<T>(options: {
  flag?: T;
  env?: T;
  config?: T;
  globalConfig?: T;
  fallback: T;
}): { value: T; source: ConfigSource; ignored: ConfigSource[] } {
  if (options.flag !== undefined) {
    const ignored: ConfigSource[] = [];
    if (options.env !== undefined) {
      ignored.push("env");
    }
    if (options.config !== undefined) {
      ignored.push("config");
    }
    if (options.globalConfig !== undefined) {
      ignored.push("globalConfig");
    }
    return { value: options.flag, source: "flag", ignored };
  }
  if (options.env !== undefined) {
    const ignored: ConfigSource[] = [];
    if (options.config !== undefined) {
      ignored.push("config");
    }
    if (options.globalConfig !== undefined) {
      ignored.push("globalConfig");
    }
    return { value: options.env, source: "env", ignored };
  }
  if (options.config !== undefined) {
    const ignored: ConfigSource[] = [];
    if (options.globalConfig !== undefined) {
      ignored.push("globalConfig");
    }
    return { value: options.config, source: "config", ignored };
  }
  if (options.globalConfig !== undefined) {
    return { value: options.globalConfig, source: "globalConfig", ignored: [] };
  }
  return { value: options.fallback, source: "default", ignored: [] };
}

function formatSource(source: ConfigSource): string {
  return source === "globalConfig" ? "GLOBAL_CONFIG" : source.toUpperCase();
}

function warnForOverrides(
  warnings: string[],
  label: string,
  ignored: ConfigSource[],
): void {
  if (ignored.length === 0) {
    return;
  }
  const sources = ignored.map((source) => formatSource(source)).join(", ");
  warnings.push(`Ignoring ${label} from ${sources} due to higher precedence.`);
}

export async function resolveCommitConfig(options: {
  cwd: string;
  env: NodeJS.ProcessEnv;
  flags?: CommitConfigFlags;
  defaults: CommitConfigDefaults;
}): Promise<CommitConfigResolution> {
  const configPath = resolveConfigPath(options.cwd, options.env);
  const globalConfigPath = GLOBAL_CONFIG_FILE;
  const loadResult = await loadConfigFile(configPath, "Config file");
  const globalResult = await loadConfigFile(
    globalConfigPath,
    "Global config file",
    { warnOnMissing: false },
  );
  const warnings = [...loadResult.warnings, ...globalResult.warnings];
  if (!globalResult.found && !globalResult.invalid) {
    await ensureGlobalConfigFile(globalConfigPath, options.defaults, warnings);
  }
  if (loadResult.hasSecrets) {
    warnings.push("Config file appears to contain secrets; remove them.");
  }
  if (globalResult.hasSecrets) {
    warnings.push(
      "Global config file appears to contain secrets; remove them.",
    );
  }

  const config = loadResult.config ?? {};
  const globalConfig = globalResult.config ?? {};
  const env = options.env;
  const flags = options.flags ?? {};

  const envProvider = normalizeString(env[PROVIDER_ENV]);
  const envModel = normalizeString(env[MODEL_ENV]);
  const envTypes = parseTypesFromEnv(env[TYPES_ENV]);
  const envSubjectMaxLength = parsePositiveInt(env[SUBJECT_MAX_ENV]);
  const envMaxDiffBytes = parsePositiveInt(env[MAX_DIFF_BYTES_ENV]);
  const envMaxFileCount = parsePositiveInt(env[MAX_FILE_COUNT_ENV]);

  if (env[TYPES_ENV] && !envTypes) {
    warnings.push("Ignoring invalid CMT_TYPES; using defaults.");
  }
  if (env[SUBJECT_MAX_ENV] && !envSubjectMaxLength) {
    warnings.push("Ignoring invalid CMT_SUBJECT_MAX_LENGTH; using defaults.");
  }
  if (env[MAX_DIFF_BYTES_ENV] && !envMaxDiffBytes) {
    warnings.push("Ignoring invalid CMT_MAX_DIFF_BYTES; using defaults.");
  }
  if (env[MAX_FILE_COUNT_ENV] && !envMaxFileCount) {
    warnings.push("Ignoring invalid CMT_MAX_FILES; using defaults.");
  }

  const flagProvider = normalizeString(flags.providerId);
  const flagModel = normalizeString(flags.modelId);
  const flagTypes = flags.types?.length ? flags.types : undefined;
  const flagSubjectMaxLength =
    typeof flags.subjectMaxLength === "number" && flags.subjectMaxLength > 0
      ? flags.subjectMaxLength
      : undefined;
  const flagMaxDiffBytes =
    typeof flags.maxDiffBytes === "number" && flags.maxDiffBytes > 0
      ? flags.maxDiffBytes
      : undefined;
  const flagMaxFileCount =
    typeof flags.maxFileCount === "number" && flags.maxFileCount > 0
      ? flags.maxFileCount
      : undefined;

  if (flags.types && !flagTypes) {
    warnings.push("Ignoring empty --types flag; using defaults.");
  }

  const providerResolution = resolveWithPrecedence({
    flag: flagProvider,
    env: envProvider,
    config: config.provider,
    globalConfig: globalConfig.provider,
    fallback: options.defaults.providerId,
  });
  warnForOverrides(warnings, "provider", providerResolution.ignored);

  const modelResolution = resolveWithPrecedence({
    flag: flagModel,
    env: envModel,
    config: config.model,
    globalConfig: globalConfig.model,
    fallback: options.defaults.modelId,
  });
  warnForOverrides(warnings, "model", modelResolution.ignored);

  const typesResolution = resolveWithPrecedence({
    flag: flagTypes,
    env: envTypes,
    config: config.types,
    globalConfig: globalConfig.types,
    fallback: options.defaults.allowedTypes,
  });
  warnForOverrides(warnings, "types", typesResolution.ignored);

  const subjectResolution = resolveWithPrecedence({
    flag: flagSubjectMaxLength,
    env: envSubjectMaxLength,
    config: config.subjectMaxLength,
    globalConfig: globalConfig.subjectMaxLength,
    fallback: options.defaults.subjectMaxLength,
  });
  warnForOverrides(warnings, "subject length", subjectResolution.ignored);

  const maxDiffBytesResolution = resolveWithPrecedence({
    flag: flagMaxDiffBytes,
    env: envMaxDiffBytes,
    config: config.maxDiffBytes,
    globalConfig: globalConfig.maxDiffBytes,
    fallback: options.defaults.maxDiffBytes,
  });
  warnForOverrides(warnings, "max diff bytes", maxDiffBytesResolution.ignored);

  const maxFileCountResolution = resolveWithPrecedence({
    flag: flagMaxFileCount,
    env: envMaxFileCount,
    config: config.maxFileCount,
    globalConfig: globalConfig.maxFileCount,
    fallback: options.defaults.maxFileCount,
  });
  warnForOverrides(warnings, "max files", maxFileCountResolution.ignored);

  if (subjectResolution.value < 20 || subjectResolution.value > 120) {
    warnings.push(
      `Subject length ${subjectResolution.value} may be hard to read; consider 50-72.`,
    );
  }

  const localScopeMappings = config.scopeMappings ?? [];
  const globalScopeMappings = globalConfig.scopeMappings ?? [];
  const scopeMappings =
    localScopeMappings.length > 0 ? localScopeMappings : globalScopeMappings;
  const scopeSource: ConfigSource =
    localScopeMappings.length > 0
      ? "config"
      : globalScopeMappings.length > 0
        ? "globalConfig"
        : "default";

  const fallbackUsed =
    !loadResult.found ||
    loadResult.invalid ||
    loadResult.invalidSections.length > 0 ||
    globalResult.invalid ||
    globalResult.invalidSections.length > 0;

  return {
    effective: {
      providerId: providerResolution.value,
      modelId: modelResolution.value,
      allowedTypes: typesResolution.value,
      subjectMaxLength: subjectResolution.value,
      maxDiffBytes: maxDiffBytesResolution.value,
      maxFileCount: maxFileCountResolution.value,
      scopeMappings,
    },
    sources: {
      providerId: providerResolution.source,
      modelId: modelResolution.source,
      allowedTypes: typesResolution.source,
      subjectMaxLength: subjectResolution.source,
      maxDiffBytes: maxDiffBytesResolution.source,
      maxFileCount: maxFileCountResolution.source,
      scopeMappings: scopeSource,
    },
    configPath,
    configFound: loadResult.found,
    configInvalid: loadResult.invalid,
    invalidSections: loadResult.invalidSections,
    fallbackUsed,
    warnings,
    hasSecrets: loadResult.hasSecrets,
  };
}

export function resolveScopeFromMappings(
  files: string[],
  mappings: ScopeMapping[],
): string | undefined {
  if (files.length === 0 || mappings.length === 0) {
    return undefined;
  }

  const sorted = [...mappings].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );

  for (const mapping of sorted) {
    for (const file of files) {
      if (file.startsWith(mapping.prefix)) {
        return mapping.scope;
      }
    }
  }

  return undefined;
}
