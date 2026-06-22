# API

Fastify TypeScript backend for `noti-playground`.

## Development

```bash
pnpm dev:api
```

The app runs on `http://localhost:4000` by default.

Generate local VAPID keys for Web Push:

```bash
pnpm --filter @noti-playground/api vapid:keys
```

Copy `apps/api/.env.example` to `apps/api/.env`, then set the printed
`VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` values. The API `dev` and `start`
scripts load `apps/api/.env` automatically.

## Endpoints

- `GET /healthz`
- `GET /version`
- `GET /push/vapid-public-key`
- `POST /push/subscriptions`
- `POST /push/send`
