import fs from "node:fs/promises";
import path from "node:path";

export type ConfigSource = "flag" | "env" | "config" | "default";

export interface ScopeMapping {
  prefix: string;
  scope: string;
}

export interface CommitConfigDefaults {
  providerId: string;
  modelId: string;
  allowedTypes: string[];
  subjectMaxLength: number;
}

export interface CommitConfigFlags {
  providerId?: string;
  modelId?: string;
  types?: string[];
  subjectMaxLength?: number;
}

export interface CommitConfig {
  providerId: string;
  modelId: string;
  allowedTypes: string[];
  subjectMaxLength: number;
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
const DEFAULT_CONFIG_FILE = ".cmt.json";
const SUPPORTED_SCHEMA_VERSION = 1;

interface ConfigFileV1 {
  schemaVersion?: number;
  provider?: string;
  model?: string;
  types?: string[];
  subjectMaxLength?: number;
  scopeMappings?: ScopeMapping[];
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

async function loadConfigFile(configPath: string): Promise<ConfigLoadResult> {
  const warnings: string[] = [];
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
        warnings: ["Config file is not valid JSON; using defaults."],
        hasSecrets: false,
      };
    }

    if (!parsed || typeof parsed !== "object") {
      return {
        found: true,
        invalid: true,
        invalidSections: ["schema"],
        warnings: ["Config file has invalid schema; using defaults."],
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
          `Unsupported config schema version ${schemaVersion}; using defaults.`,
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
          warnings: ["Config file not found; using defaults."],
          hasSecrets: false,
        };
      }
    }

    return {
      found: false,
      invalid: true,
      invalidSections: ["read"],
      warnings: ["Config file could not be read; using defaults."],
      hasSecrets: false,
    };
  }
}

function resolveWithPrecedence<T>(options: {
  flag?: T;
  env?: T;
  config?: T;
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
    return { value: options.flag, source: "flag", ignored };
  }
  if (options.env !== undefined) {
    const ignored: ConfigSource[] = [];
    if (options.config !== undefined) {
      ignored.push("config");
    }
    return { value: options.env, source: "env", ignored };
  }
  if (options.config !== undefined) {
    return { value: options.config, source: "config", ignored: [] };
  }
  return { value: options.fallback, source: "default", ignored: [] };
}

function warnForOverrides(
  warnings: string[],
  label: string,
  ignored: ConfigSource[],
): void {
  if (ignored.length === 0) {
    return;
  }
  const sources = ignored.map((source) => source.toUpperCase()).join(", ");
  warnings.push(`Ignoring ${label} from ${sources} due to higher precedence.`);
}

export async function resolveCommitConfig(options: {
  cwd: string;
  env: NodeJS.ProcessEnv;
  flags?: CommitConfigFlags;
  defaults: CommitConfigDefaults;
}): Promise<CommitConfigResolution> {
  const configPath = resolveConfigPath(options.cwd, options.env);
  const loadResult = await loadConfigFile(configPath);
  const warnings = [...loadResult.warnings];
  if (loadResult.hasSecrets) {
    warnings.push("Config file appears to contain secrets; remove them.");
  }

  const config = loadResult.config ?? {};
  const env = options.env;
  const flags = options.flags ?? {};

  const envProvider = normalizeString(env[PROVIDER_ENV]);
  const envModel = normalizeString(env[MODEL_ENV]);
  const envTypes = parseTypesFromEnv(env[TYPES_ENV]);
  const envSubjectMaxLength = parsePositiveInt(env[SUBJECT_MAX_ENV]);

  if (env[TYPES_ENV] && !envTypes) {
    warnings.push("Ignoring invalid CMT_TYPES; using defaults.");
  }
  if (env[SUBJECT_MAX_ENV] && !envSubjectMaxLength) {
    warnings.push("Ignoring invalid CMT_SUBJECT_MAX_LENGTH; using defaults.");
  }

  const flagProvider = normalizeString(flags.providerId);
  const flagModel = normalizeString(flags.modelId);
  const flagTypes = flags.types?.length ? flags.types : undefined;
  const flagSubjectMaxLength =
    typeof flags.subjectMaxLength === "number" && flags.subjectMaxLength > 0
      ? flags.subjectMaxLength
      : undefined;

  if (flags.types && !flagTypes) {
    warnings.push("Ignoring empty --types flag; using defaults.");
  }

  const providerResolution = resolveWithPrecedence({
    flag: flagProvider,
    env: envProvider,
    config: config.provider,
    fallback: options.defaults.providerId,
  });
  warnForOverrides(warnings, "provider", providerResolution.ignored);

  const modelResolution = resolveWithPrecedence({
    flag: flagModel,
    env: envModel,
    config: config.model,
    fallback: options.defaults.modelId,
  });
  warnForOverrides(warnings, "model", modelResolution.ignored);

  const typesResolution = resolveWithPrecedence({
    flag: flagTypes,
    env: envTypes,
    config: config.types,
    fallback: options.defaults.allowedTypes,
  });
  warnForOverrides(warnings, "types", typesResolution.ignored);

  const subjectResolution = resolveWithPrecedence({
    flag: flagSubjectMaxLength,
    env: envSubjectMaxLength,
    config: config.subjectMaxLength,
    fallback: options.defaults.subjectMaxLength,
  });
  warnForOverrides(warnings, "subject length", subjectResolution.ignored);

  if (subjectResolution.value < 20 || subjectResolution.value > 120) {
    warnings.push(
      `Subject length ${subjectResolution.value} may be hard to read; consider 50-72.`,
    );
  }

  const scopeMappings = config.scopeMappings ?? [];
  const scopeSource: ConfigSource =
    scopeMappings.length > 0 ? "config" : "default";

  const fallbackUsed =
    !loadResult.found ||
    loadResult.invalid ||
    loadResult.invalidSections.length > 0;

  return {
    effective: {
      providerId: providerResolution.value,
      modelId: modelResolution.value,
      allowedTypes: typesResolution.value,
      subjectMaxLength: subjectResolution.value,
      scopeMappings,
    },
    sources: {
      providerId: providerResolution.source,
      modelId: modelResolution.source,
      allowedTypes: typesResolution.source,
      subjectMaxLength: subjectResolution.source,
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
