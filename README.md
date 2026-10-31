# CFS WhatsApp Assistant

Documentation foundation for an AI-powered WhatsApp furniture shopping and
customer-support assistant for Choice Furniture Superstore (CFS), a UK retailer.

**Status: Stage 4 memory infrastructure complete.** No business features or external services are provisioned.

## Read first

- [Engineering rules](AGENTS.md)
- [Project overview](docs/00-project/PROJECT_OVERVIEW.md)
- [Product vision](docs/00-project/PRODUCT_VISION.md)
- [Roadmap and stage gates](docs/00-project/ROADMAP.md)
- [Glossary](docs/00-project/GLOSSARY.md)
- [Architecture](docs/02-architecture/ARCHITECTURE.md)

## Architecture decisions

- [ADR-001: Technology stack](docs/02-architecture/ADR-001-TECH-STACK.md)
- [ADR-002: No LangChain](docs/02-architecture/ADR-002-NO-LANGCHAIN.md)
- [ADR-003: Memory](docs/02-architecture/ADR-003-MEMORY.md)
- [ADR-004: Ecommerce integration](docs/02-architecture/ADR-004-ECOMMERCE-INTEGRATION.md)
- [ADR-005: AI provider abstraction](docs/02-architecture/ADR-005-AI-PROVIDER-ABSTRACTION.md)

## Access boundary

Only legitimate public website resources and explicitly provided public or
authorized integrations may be used. No CFS private backend access is available.
Public source observations and capability limits are recorded in the investigation report
for this stage. Order lookup and order creation remain unavailable with current access.

## Fixed stack

Node.js, TypeScript, ExpressJS, Zod, PostgreSQL on Neon, Prisma, Upstash Redis,
PostgreSQL with pgvector, WhatsApp Business Cloud API, Vitest, Docker and Docker
Compose. Use Mistral for development/testing, Claude for production, and
MockAIProvider for automated tests through AIProvider. Codex is the coding agent.

## Eventual environment variables

These are planned names, not usable configuration. No credentials are included.

| Variable                   | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `NODE_ENV`                 | Runtime environment                                       |
| `DATABASE_URL`             | Application PostgreSQL connection to Neon                 |
| `DATABASE_URL_UNPOOLED`    | Direct Neon connection for supported migration operations |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST connection URL                         |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST credential                             |
| `MISTRAL_API_KEY`          | Mistral credential for development/testing                |
| `ANTHROPIC_API_KEY`        | Claude credential for production                          |
| `WHATSAPP_ACCESS_TOKEN`    | WhatsApp Business Cloud API credential                    |
| `WHATSAPP_VERIFY_TOKEN`    | Webhook subscription verification token                   |
| `WHATSAPP_PHONE_NUMBER_ID` | Authorized WhatsApp sender identifier                     |

This list is not exhaustive. Webhook signature verification will also require a
Meta app secret; finalize its configuration name during the messaging stage.
The webhook verify token does not authenticate incoming message payloads.

## Verification and next work

Documentation validation covers paths, links, policy coverage, consistency,
and basic Markdown formatting. Runtime scripts and tests now cover the backend foundation.
Follow the permanent verification policy in AGENTS.md for all code changes.
Later stages require explicit authorization; stop after Stage 4.

## V1 requirements

- [PRD-001-CORE-BOT](docs/01-requirements/PRD-001-CORE-BOT.md)
- [PRD-002-PRODUCT-DISCOVERY](docs/01-requirements/PRD-002-PRODUCT-DISCOVERY.md)
- [PRD-003-CONVERSATION-MEMORY](docs/01-requirements/PRD-003-CONVERSATION-MEMORY.md)
- [PRD-004-ORDER-TRACKING](docs/01-requirements/PRD-004-ORDER-TRACKING.md)
- [PRD-005-RAG-KNOWLEDGE](docs/01-requirements/PRD-005-RAG-KNOWLEDGE.md)
- [PRD-006-HUMAN-HANDOFF](docs/01-requirements/PRD-006-HUMAN-HANDOFF.md)
- [PRD-007-SECURITY](docs/01-requirements/PRD-007-SECURITY.md)
- [PRD-008-OBSERVABILITY](docs/01-requirements/PRD-008-OBSERVABILITY.md)

V1 excludes add to cart, get cart, update cart, remove cart, checkout, payment
processing, payment credentials, abandoned cart and proactive marketing.

## Public website investigation

See [Stage 2 findings and blockers](docs/03-integrations/ECOMMERCE-INTEGRATION.md).

## Backend foundation setup

Requires Node.js 24 and npm. Use authorized project Neon and Upstash resources,
never CFS private infrastructure. Memory models and their additive migration exist; later business features do not.

```powershell
npm ci --ignore-scripts
Copy-Item .env.example .env
# Fill .env locally with authorized credentials; never commit or paste them into chat.
npm run prisma:generate
npm run dev
```

Both database URLs must use a Neon host, credentials and `sslmode=verify-full`.
Use the pooled URL for DATABASE_URL and a direct host without `-pooler` for
DATABASE_URL_UNPOOLED. Upstash requires an HTTPS \*.upstash.io REST URL and token.
PORT defaults to 3000. Only foundation variables are required now; AI and WhatsApp
credentials are future configuration and are not read in this stage.

Prisma 7 uses prisma.config.ts for the direct CLI datasource and PrismaPg for the
runtime pooled connection. Generation and builds do not connect to the database.
No migration or schema push runs automatically. The Redis REST client has no TCP
connection to close; disconnecting Prisma releases its PostgreSQL resources.

```powershell
npm test
npm run typecheck
npm run lint
npm run format:check
npm run prisma:validate
npm run build
# Requires separately authorized real Neon/Upstash credentials:
node --env-file=.env node_modules/vitest/vitest.mjs run --config vitest.integration.config.ts
```

The default test suite includes local HTTP integration tests with controlled
readiness dependencies; it needs no external credentials. test:integration performs
only SELECT 1 and PING on the configured services and never skips missing credentials.

GET /health reports process liveness. GET /ready returns 200 only when dependency
probes pass and shutdown is not underway, otherwise 503 without service details.
Startup checks dependencies before listening and exits nonzero on failure. SIGINT
and SIGTERM initiate idempotent shutdown: mark unready, drain HTTP, disconnect Prisma;
a 10-second deadline forces exit if draining/cleanup stalls. Dependency probes have
5-second transport/query timeouts and no Redis retries. Structured JSON logs allow
only fixed events, generated request IDs, status and duration, never raw exceptions,
URLs, headers, bodies or environment values.

```powershell
npm run build
node --env-file=.env dist/server.js
# Optional container workflow, daemon checks deferred by owner:
docker compose up --build
```

Compose runs the app only and connects to Neon/Upstash externally, without local
SQL or Redis substitutes. Keep PORT=3000 with the supplied Compose mapping. The
runtime image uses the node user and receives secrets at runtime, not build time.
Keep health endpoints behind infrastructure controls to limit probe traffic.

The minimatch 11.0.3 override addresses GHSA-g3hv-75wg-m249 in lint tooling; remove it once upstream dependencies require a patched version. No audit suppression is used.

## Stage 3 verification record

- 16 unit/local HTTP integration tests passed, including safe configuration errors,
  readiness failure, error redaction, startup cancellation, request drain and shutdown timeout.
- TypeScript checking, ESLint, Prettier, Prisma generation/validation and production build passed.
- Dependency audit after patch updates reported zero vulnerabilities on 2026-10-31.
- Live test:integration passed on 2026-10-31 against authorized Neon/Upstash services using read-only SELECT 1/PING probes.
- The compiled application started successfully; GET /health and GET /ready both returned 200 with real dependencies.
- Docker daemon build/run checks were not performed at the owner's request.

Stage 3 is complete within the authorized scope and explicit Docker daemon deferral. Earlier missing-configuration failures are resolved. Credentials remain local and untracked.
No later-stage feature is implemented or authorized by this verification record.

## Stage 4 memory infrastructure

Five Prisma models cover customers, their conversations/messages/summaries and
consented preferences. Internal code is under src/features/memory/. No memory
HTTP endpoint, AI generation or WhatsApp transport is implemented.

```powershell
npm run prisma:generate
npm run prisma:migrate:deploy
npm run test:integration
```

Migrate deploy uses the authorized direct Neon URL and never resets the database.
Integration tests create/drop only a generated memory*test*\* schema and clean their
scoped synthetic Upstash keys. They do not insert test customers into public tables.
Database permissions to create/drop that isolated schema are required for tests.

Create connections using createConnections(config). Resolve an already verified
WhatsApp identity through resolveCustomer(db, identity). Bind createMemoryRepository
once to the resulting trusted customer.id, then createMemoryService(repository,
createRecentContext(redis, log)). Do not let external callers choose that scope.

The service supports getCustomer, createConversation, getConversation, saveMessage,
getRecentMessages, saveSummary, getSummary, savePreference and getPreferences.
Messages accept role USER/ASSISTANT and nonempty content up to 8,000 characters.
Summary text has the same limit and is supplied by the caller, never AI-generated.
Preferences accept a bounded lowercase key, value up to 1,000 characters and
consent=true. See ADR-003 for customer isolation, freshness and privacy limitations.

Redis stores at most 20 recent messages per versioned customer/conversation key,
with a five-minute TTL. Durable authorization and version lookup precede cache reads.
Redis outages cannot turn a failed database save into success or block durable
message persistence; recent reads fall back to PostgreSQL without logging contents.

### Stage 4 verification

On 2026-10-31, 20 local tests and 8 live integration tests passed. TypeScript,
ESLint, Prettier, build, Prisma generation and schema validation passed. Migration
20261031000000_memory was deployed successfully to authorized Neon. Synthetic
persistence, relationships, customer/conversation/preference isolation, Upstash
context TTL/version changes and Redis failure fallback were verified. No test was
disabled to resolve failures. Docker daemon checks remain deferred by the owner.

Save-message transaction acquisition and execution are bounded to five seconds.
This aligns acquisition with the existing connection timeout. The Stage 3 /ready
contract still requires both Neon and Upstash; memory-service Redis fallback does
not change that readiness policy. No real customer histories were ingested.
