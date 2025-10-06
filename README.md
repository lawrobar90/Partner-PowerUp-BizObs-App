This repository contains only the BizObs application. It’s a Node.js + Express app with a Smartscape-like UI and dynamic per-step services that form a true sequential service chain with a 6-span trace.

## Project layout

```
partner-powerup-bizobs/
   package.json
   server.js
   public/
   routes/
   services/
   README.md
   .gitignore
```

## Prerequisites
- Node.js 18+
- Linux/macOS/Windows

## Install & run

```bash
cd partner-powerup-bizobs
npm ci --only=production
npm start
# App runs on http://127.0.0.1:4000
```

Optional local scripts (root directory):

```bash
./start-bizobs       # starts server and waits for health
./stop-bizobs        # stops server using server.pid
./restart-bizobs.sh  # convenience restart
```

## Key endpoints

- Health: GET `/api/health`
- Metrics: GET `/api/metrics` (basic placeholder)
- Journey routes: `/api/journey/*`
- Steps routes:
   - POST `/api/steps/step1` .. `/step6` (legacy single-step)
   - POST `/api/steps/step1-chained` (new chained flow; returns full 6-span trace)
- Admin:
   - POST `/api/admin/reset-ports` (stop all dynamic services, free ports)
   - GET `/api/admin/services` (list running dynamic services)

## 6-step chained flow (sequential services)

The chained route spins up per-step child processes and calls them sequentially. Each service appends a span with: `traceId`, `spanId`, `parentSpanId`, `stepName`.

Request example:

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

Response (trimmed):

```json
{
   "ok": true,
   "pipeline": "chained-child-services",
   "result": {
      "trace": [
         {"traceId":"...","spanId":"...","parentSpanId":null,"stepName":"ProductDiscovery"},
         {"traceId":"...","spanId":"...","parentSpanId":"...","stepName":"ProductSelection"},
         {"traceId":"...","spanId":"...","parentSpanId":"...","stepName":"AddToCart"},
         {"traceId":"...","spanId":"...","parentSpanId":"...","stepName":"CheckoutProcess"},
         {"traceId":"...","spanId":"...","parentSpanId":"...","stepName":"PaymentProcessing"},
         {"traceId":"...","spanId":"...","parentSpanId":"...","stepName":"OrderConfirmation"}
      ]
   }
}
```

## UI quick tour

- Open http://127.0.0.1:4000 and use these buttons:
   - “Run 6-Step Chained Flow”: Executes the sequential chain and prints the trace under it.
   - “Reset Dynamic Services”: Stops all dynamic child services, freeing ports.

## Environment

- `PORT` (default `4000`)
- Optional AI vars (if you add journey generation backends):
   - `PPLX_API_KEY`, `AI_PROVIDER`, `GCLOUD_PROJECT`, `VERTEX_LOCATION`, `VERTEX_MODEL`

## Ignore vegas app

Only push `partner-powerup-bizobs/` to GitHub. The `vegas-casino/` folder and related scripts are unrelated and should be excluded from commits or a separate repo.

## License

MIT
