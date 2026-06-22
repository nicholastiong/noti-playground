import { z } from "zod";

const envSchema = z.object({
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  VAPID_PRIVATE_KEY: z.string().default(""),
  VAPID_PUBLIC_KEY: z.string().default(""),
  VAPID_SUBJECT: z
    .string()
    .default("mailto:dev@noti-playground.local"),
  npm_package_name: z.string().default("@noti-playground/api"),
  npm_package_version: z.string().default("0.1.0"),
});

export function getAppConfig() {
  const env = envSchema.parse(process.env);

  return {
    appName: env.npm_package_name,
    version: env.npm_package_version,
    nodeEnv: env.NODE_ENV,
    host: env.API_HOST,
    port: env.API_PORT,
    corsOrigin: env.CORS_ORIGIN,
    vapid: {
      publicKey: env.VAPID_PUBLIC_KEY,
      privateKey: env.VAPID_PRIVATE_KEY,
      subject: env.VAPID_SUBJECT,
    },
  };
}
