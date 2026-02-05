export interface DiffLimits {
  maxDiffBytes: number;
  maxFileCount: number;
  subjectMaxLength: number;
}

export interface DiffLimitsResolution {
  limits: DiffLimits;
  warnings: string[];
  fallbackUsed: boolean;
}

export const DEFAULT_LIMITS: DiffLimits = {
  maxDiffBytes: 20000,
  maxFileCount: 50,
  subjectMaxLength: 72,
};

function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function resolveLimit(
  value: string | undefined,
  label: string,
  fallback: number,
  warnings: string[],
): number {
  const parsed = parsePositiveInt(value);
  if (!value) {
    return fallback;
  }
  if (!parsed) {
    warnings.push(`Ignoring invalid ${label}; using default ${fallback}.`);
    return fallback;
  }
  return parsed;
}

export function resolveDiffLimits(
  env: NodeJS.ProcessEnv = process.env,
): DiffLimitsResolution {
  const warnings: string[] = [];
  const maxDiffBytes = resolveLimit(
    env.CMT_MAX_DIFF_BYTES,
    "CMT_MAX_DIFF_BYTES",
    DEFAULT_LIMITS.maxDiffBytes,
    warnings,
  );
  const maxFileCount = resolveLimit(
    env.CMT_MAX_FILES,
    "CMT_MAX_FILES",
    DEFAULT_LIMITS.maxFileCount,
    warnings,
  );

  return {
    limits: {
      maxDiffBytes,
      maxFileCount,
      subjectMaxLength:
        parsePositiveInt(env.CMT_SUBJECT_MAX_LENGTH) ??
        DEFAULT_LIMITS.subjectMaxLength,
    },
    warnings,
    fallbackUsed: warnings.length > 0,
  };
}

export function getDiffLimits(
  env: NodeJS.ProcessEnv = process.env,
): DiffLimits {
  return resolveDiffLimits(env).limits;
}
