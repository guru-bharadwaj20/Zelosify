# Vendor - Hiring Manager Contract Management Module

This document covers what was added on top of the template, how to run it, and
the decisions behind the AI agent.

## What was added

**Backend (`Zelosify-Backend/Server`)**

- `Opening` and `hiringProfile` models, the `OpeningStatus` / `ProfileStatus`
  enums and a migration under
  `prisma/migrations/20250918064500_add_opening_and_hiring_profile`.
- Vendor APIs for listing openings, opening details, presigned uploads, profile
  submission, soft delete and backend file preview.
- Hiring manager APIs for own openings, submitted profiles with the AI
  recommendation, shortlist, reject and file preview.
- A Gemini tool-calling agent with a tool registry, schema validation, prompt
  injection filtering, retries and structured JSON logging.
- A seed script that creates the `Bruce Wayne Corp` tenant with 12 openings.

**Frontend (`Zelosify-Frontend`)**

- `/vendor/openings` and `/vendor/openings/:id` with drag and drop multi upload,
  soft delete and preview.
- `/hiring-manager/openings` and `/hiring-manager/openings/:id` with profile
  cards, score, confidence, explanation, processing time and the shortlist and
  reject actions.
- Redux slices, hooks and utils following `frontend-rules/FRONTEND_REDUX_STANDARDS_GUIDE.md`.
- Route guards in `src/middleware.js` so a vendor cannot open a hiring manager
  route and the other way round.

## Extra environment variables

Add these to `Zelosify-Backend/Server/.env` on top of the values from the setup
guide:

```
GEMINI_API_KEY=<your_gemini_api_key>
GEMINI_MODEL=gemini-3.6-flash
AGENT_BUDGET_MS=8000
```

`GEMINI_MODEL` and `AGENT_BUDGET_MS` are optional and fall back to the values
shown above. Without `GEMINI_API_KEY` the agent still returns a score through
the deterministic tools, and every run is logged with `fallbackUsed: true`.

No new npm packages were installed. The Gemini API is called over REST with the
`axios` dependency that was already in `package.json`, and PPTX text is read
with a small zip reader built on the Node `zlib` module.

## Running it

Follow the setup guide first (docker compose, Keycloak realm, roles, `.env`),
then:

```
cd Zelosify-Backend/Server
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Order for the demo data:

1. Register a `HIRING_MANAGER` user through `POST /api/v1/auth/register`.
   Any tenant works, the seed picks the tenant named `Bruce Wayne Corp` and
   creates it if it is missing.
2. Run `npx tsx src/scripts/seedOpenings.ts`.

The seed assigns all 12 openings to the first `HIRING_MANAGER` of that tenant.
If the tenant has no hiring manager yet it creates a placeholder row, prints a
note, and running the seed again after registering the real manager hands the
openings over. Register the `IT_VENDOR` user against the same tenant id so the
vendor sees those openings.

Tests:

```
npm run test
```

## API endpoints

All routes are mounted under `/api/v1` by the existing server.

| Method | Route | Role |
| --- | --- | --- |
| GET | `/vendor/openings` | IT_VENDOR |
| GET | `/vendor/openings/:id` | IT_VENDOR |
| POST | `/vendor/openings/:id/profiles/presign` | IT_VENDOR |
| POST | `/vendor/openings/:id/profiles/upload` | IT_VENDOR |
| DELETE | `/vendor/profiles/:profileId` | IT_VENDOR |
| GET | `/vendor/profiles/:profileId/preview` | IT_VENDOR |
| GET | `/hiring-manager/openings` | HIRING_MANAGER |
| GET | `/hiring-manager/openings/:id/profiles` | HIRING_MANAGER |
| POST | `/hiring-manager/profiles/:id/shortlist` | HIRING_MANAGER |
| POST | `/hiring-manager/profiles/:id/reject` | HIRING_MANAGER |
| GET | `/hiring-manager/profiles/:id/preview` | HIRING_MANAGER |

Profiles are stored at `<bucket>/<tenantId>/<openingId>/<timestamp>_<filename>`.
The browser never talks to S3 directly: the presign call returns an encrypted
token, and the file itself is posted to the backend which uploads it and then
writes all profile rows in one Prisma transaction.

## Agent architecture

```
controller -> recommendationService -> agentOrchestrator -> Gemini (tool calling)
                                            |
                                            v
                                       tool registry
                                  parse_resume, normalize_skills,
                                  extract_features, match_candidate,
                                         score_candidate
                                            |
                                            v
                              schema validator -> decision policy -> persist
```

- Controllers only read the request and map errors to status codes.
- The model chooses which tools to call and in what order. It never reads a
  Prisma model and never sees raw resume text in its system prompt.
- `parse_resume` is the only step that touches S3. It downloads the file,
  extracts the text, runs it through the injection filter and returns the
  structured schema.
- Every tool output is validated with Ajv before it goes back to the model or
  into the database.
- A malformed final answer is sent back for correction up to two times. If the
  model still fails, the time budget runs out, or the API key is missing, the
  deterministic pipeline produces the result and the run is marked as a
  fallback.
- Token usage, latency, parsing time, matching time, the final score and errors
  are written as single line JSON logs.

## Measured behaviour of the live agent

A run against the real Gemini API on a free tier key looks like this:

```
turn 1: parse_resume
turn 2: match_candidate
turn 3: score_candidate
turn 4: {"recommended": true, "score": 1, "confidence": 1, "reason": "..."}
3201 tokens, 6.6 seconds
```

Two things follow from that and they shaped the defaults:

1. Four round trips to the model take roughly 6.6 seconds, so a budget of
   1500 ms would cut the agent off on every run. `AGENT_BUDGET_MS` therefore
   defaults to 8000. The upload API never waits for any of this: profiles are
   written and returned first, and the agent runs in the background, so no
   request is blocked and the UI does not freeze. Setting
   `AGENT_BUDGET_MS=1500` enforces the strict per profile cap instead, and the
   deterministic engines then produce the result in about 10 ms.
2. The free tier allows 5 requests per minute. Submitting several profiles at
   once will hit a 429 on the later ones, which is caught, logged, and answered
   with the deterministic result rather than an error.

## Scoring

```
experience: below min -> 0, inside range -> 1, above max -> 0.8
skills:     matched required skills / required skills
location:   remote -> 1, exact match -> 1, onsite mismatch -> 0.5

finalScore = 0.5 * skill + 0.3 * experience + 0.2 * location
```

Decision: `>= 0.75` recommended, `0.5 - 0.74` borderline, `< 0.5` not
recommended.

The score always comes from the scoring tool. If the model returns a different
number it is logged and the engine value is kept, so the explanation stays
consistent with the number shown in the UI.

## Notes on the schema

Three fields were added to the models given in the task:

- `Opening.requiredSkills` - the skill match is defined as
  `overlap / requiredSkills`, so the opening needs a skill list to compare
  against.
- `hiringProfile.reasoningTrace` - stores the feature vector, the score
  breakdown and the tool steps of the run, which is the intermediate reasoning
  metadata the task asks to persist.
- `hiringProfile.tokensUsed` - token usage for the run.

`Tenants` gained an `openings` relation field, which the `Opening` relation
requires.

## Tests

`npm run test` runs 79 tests:

- Matching engine: experience boundaries, skill overlap, location rules.
- Scoring engine: the weighted formula and its edge cases.
- Decision policy: the three thresholds and the score override rule.
- Sanitizer: prompt injection patterns.
- Schema validator: malformed agent and tool output.
- RBAC: a vendor token on a hiring manager route, a forged token, a missing
  token.
- Tenant isolation: every query is checked for its tenant filter and cross
  tenant reads are refused.
- Integration: presign, submit, recommend and shortlist end to end with S3, the
  database and Gemini mocked.
- Performance: 100 profiles, p95 well under the 2000 ms budget.

Gemini, S3 and the database are mocked in the tests, so `npm run test` needs no
API key and no running containers. The live model path was verified separately
against the real API, see the section above.

## One behaviour change in an existing file

`src/middleware.js` used to send `IT_VENDOR` to `/vendor/payments` after login.
It now sends them to `/vendor/openings`, which is the module built here. The
payments page is untouched and still reachable from the sidebar.
