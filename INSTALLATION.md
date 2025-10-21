# Partner PowerUp BizObs — Installation & Usage

This guide covers installing, running, and validating the BizObs app. It also lists endpoints, the 6-step chained flow, and admin utilities.

## Requirements
- Node.js 18+
- Linux/macOS/Windows

## Quick start

```bash
cd partner-powerup-bizobs
npm ci --only=production
npm start
# App runs on http://127.0.0.1:4000
```

Optional helper scripts (from repo root):

```bash
./start-bizobs       # starts server and waits for health
./stop-bizobs        # stops server using server.pid
./restart-bizobs.sh  # convenience restart
```

## Configuration

Environment variables:
- PORT (default: 4000)
- Optional AI variables (only if you enable AI generation):
  - PPLX_API_KEY
  - AI_PROVIDER=vertex, GCLOUD_PROJECT, VERTEX_LOCATION, VERTEX_MODEL

## Endpoints

- Health: GET `/api/health` → `{ ok: true, port: 4000 }`
- Metrics: GET `/api/metrics` → basic placeholder
- Journey (UI helpers): `/api/journey/*`
- Steps:
  - POST `/api/steps/step1` .. `/step6` (single-step variants)
  - POST `/api/steps/step1-chained` (sequential 6-step chain; returns full trace)
- Admin:
  - POST `/api/admin/reset-ports` → stop all dynamic services and free ports
  - GET `/api/admin/services` → list active dynamic services

## 6-step chained flow

The chained route spins up per-step child services and calls them sequentially. Each hop appends a span with: `traceId`, `spanId`, `parentSpanId`, `stepName`.

Example request:

```bash
curl -s -X POST http://127.0.0.1:4000/api/steps/step1-chained \
  -H 'Content-Type: application/json' \
  -d '{
        "thinkTimeMs": 100,
        "steps": [
          {"stepName":"ProductDiscovery"},
          {"stepName":"ProductSelection"},
          {"stepName":"AddToCart"},
          {"stepName":"CheckoutProcess"},
          {"stepName":"PaymentProcessing"},
          {"stepName":"OrderConfirmation"}
        ]
      }'
```

Expected result (trimmed):

```json
{
  "ok": true,
  "result": {
    "trace": [
      {"stepName":"ProductDiscovery","spanId":"...","parentSpanId":null},
      {"stepName":"ProductSelection","spanId":"...","parentSpanId":"..."},
      {"stepName":"AddToCart","spanId":"...","parentSpanId":"..."},
      {"stepName":"CheckoutProcess","spanId":"...","parentSpanId":"..."},
      {"stepName":"PaymentProcessing","spanId":"...","parentSpanId":"..."},
      {"stepName":"OrderConfirmation","spanId":"...","parentSpanId":"..."}
    ]
  }
}
```

## UI walkthrough

Open http://127.0.0.1:4000 and use:
- “Run 6-Step Chained Flow” → executes the sequence; trace appears under the button
- “Reset Dynamic Services” → stops child services and frees ports

## Dynatrace notes

- Each dynamic child process runs as its own service and calls the next service sequentially.
- We don’t inject manual trace headers; OneAgent links spans automatically if present.
- Service naming and port mapping are consistent based on the serviceName to keep a true linear flow (no fan-out).

## Troubleshooting

- “ECONNREFUSED … 41xx” on first hop: wait a second and retry; you can also hit `/api/admin/reset-ports` and run the chained flow again.
- If ports get stuck: use `/api/admin/reset-ports` before retrying.
- Verify health at `/api/health` and watch server logs in `partner-powerup-bizobs/server.log`.

## License

MIT
