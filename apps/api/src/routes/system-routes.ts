import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getHealthCheck, getVersionInfo } from "../services/system-service.js";

const healthResponseSchema = z.object({
  status: z.literal("ok"),
  uptimeSeconds: z.number().int().nonnegative(),
});

const versionResponseSchema = z.object({
  name: z.string(),
  version: z.string(),
  environment: z.string(),
});

export async function registerSystemRoutes(app: FastifyInstance) {
  app.get("/healthz", async () => {
    return healthResponseSchema.parse(getHealthCheck());
  });

  app.get("/version", async () => {
    return versionResponseSchema.parse(getVersionInfo());
  });
}
