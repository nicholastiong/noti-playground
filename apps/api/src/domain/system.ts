export type HealthStatus = "ok";

export type HealthCheck = {
  status: HealthStatus;
  uptimeSeconds: number;
};

export type VersionInfo = {
  name: string;
  version: string;
  environment: string;
};
