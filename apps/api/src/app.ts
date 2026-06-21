import cors from "@fastify/cors";
import Fastify from "fastify";
import { getAppConfig } from "./config/app-config.js";
import { registerSystemRoutes } from "./routes/system-routes.js";

export function buildApp() {
  const config = getAppConfig();
  const app = Fastify({
    logger: config.nodeEnv !== "test",
  });

  void app.register(cors, {
    origin: config.corsOrigin,
  });

  void app.register(registerSystemRoutes);

  return app;
}
