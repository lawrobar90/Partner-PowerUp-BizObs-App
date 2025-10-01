# Partner PowerUp BizObs

Dynatrace Business Observability app with Smartscape-inspired UI and Node.js backend.

## Features
- Tailwind CSS UI with Smartscape look (dark theme, glowing nodes, animated connectors)
- Inputs for Customer, Region, Journey Type, and details
- /api/generateJourney to call AI (mocked) to produce a 6-step journey with substeps
- /api/simulateEvents to emit simulated business events (WebSocket + in-memory store)
- /api/metrics returning Grail-style summaries
- JSON payloads include userId, email, cost, nps, timestamp, journeyStep

## Run
- Node.js 18+

```bash
cd partner-powerup-bizobs
npm install --production
npm start
```

Open http://YOUR_SERVER_IP:4000

## Env
- PORT (default 4000)
- PPLX_API_KEY (optional) — Perplexity API key to enable web-researched journeys
 - AI_PROVIDER=vertex to enable Gemini via Vertex AI (with Google Search grounding)
 - GCLOUD_PROJECT, VERTEX_LOCATION (default us-central1), VERTEX_MODEL (default gemini-1.5-pro-001)
 - Perplexity fallback: PPLX_API_KEY (optional)

## Notes
- AI call uses Perplexity (if PPLX_API_KEY is set) to research the web and produce a 6-step journey. If not set, a deterministic mock is returned.
 - AI call prefers Vertex AI Gemini with Google Search grounding when AI_PROVIDER=vertex and GCLOUD_PROJECT are set. If not configured, it falls back to Perplexity (when PPLX_API_KEY is set), else to the deterministic mock.
- OneAgent/Grail integration hooks can be added where events are recorded and emitted.
