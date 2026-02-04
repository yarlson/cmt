export interface DiffLimits {
  maxDiffBytes: number;
  maxFileCount: number;
  subjectMaxLength: number;
}

const DEFAULT_LIMITS: DiffLimits = {
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

export function getDiffLimits(
  env: NodeJS.ProcessEnv = process.env,
): DiffLimits {
  return {
    maxDiffBytes:
      parsePositiveInt(env.CMT_MAX_DIFF_BYTES) ?? DEFAULT_LIMITS.maxDiffBytes,
    maxFileCount:
      parsePositiveInt(env.CMT_MAX_FILES) ?? DEFAULT_LIMITS.maxFileCount,
    subjectMaxLength:
      parsePositiveInt(env.CMT_SUBJECT_MAX_LENGTH) ??
      DEFAULT_LIMITS.subjectMaxLength,
  };
}
