import { buildApp } from "./app.js";
import { getAppConfig } from "./config/app-config.js";

const config = getAppConfig();
const app = buildApp();

try {
  await app.listen({
    port: config.port,
    host: config.host,
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
