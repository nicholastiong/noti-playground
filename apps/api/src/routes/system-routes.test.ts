import { buildApp } from "../app.js";

describe("system routes", () => {
  it("returns service health", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/healthz",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ok",
    });

    await app.close();
  });

  it("returns version metadata", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/version",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      name: "@noti-playground/api",
      version: "0.1.0",
      environment: "test",
    });

    await app.close();
  });
});
