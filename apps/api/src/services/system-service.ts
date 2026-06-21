import { getAppConfig } from "../config/app-config.js";
import type { HealthCheck, VersionInfo } from "../domain/system.js";

export function getHealthCheck(): HealthCheck {
  return {
    status: "ok",
    uptimeSeconds: Math.floor(process.uptime()),
  };
}

export function getVersionInfo(): VersionInfo {
  const config = getAppConfig();

  return {
    name: config.appName,
    version: config.version,
    environment: config.nodeEnv,
  };
}
