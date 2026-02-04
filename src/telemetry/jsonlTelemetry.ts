import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type TelemetryEventName =
  | "commit_flow_started"
  | "repo_validation_failed"
  | "diff_truncated"
  | "proposal_generated"
  | "preview_shown"
  | "commit_confirmed"
  | "commit_succeeded"
  | "commit_failed";

export interface TelemetryEvent {
  name: TelemetryEventName;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface Telemetry {
  emit: (name: TelemetryEventName, data?: Record<string, unknown>) => void;
}

function resolveTelemetryPath(env: NodeJS.ProcessEnv): string {
  const override = env.CMT_TELEMETRY_PATH;
  if (override && override.trim().length > 0) {
    return override;
  }

  return path.join(os.homedir(), ".config", "cmt", "telemetry.jsonl");
}

export function createTelemetry(
  env: NodeJS.ProcessEnv = process.env,
): Telemetry {
  const telemetryPath = resolveTelemetryPath(env);

  return {
    emit(name, data) {
      try {
        fs.mkdirSync(path.dirname(telemetryPath), { recursive: true });
        const event: TelemetryEvent = {
          name,
          timestamp: new Date().toISOString(),
          data,
        };
        fs.appendFileSync(telemetryPath, `${JSON.stringify(event)}\n`, "utf8");
      } catch {
        // ignore telemetry failures
      }
    },
  };
}
