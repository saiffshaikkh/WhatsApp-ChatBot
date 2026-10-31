# Architecture

Status: Stage 3 foundation and Stage 4 scoped memory infrastructure are implemented. AI, messaging, ecommerce and RAG components below remain planned. See README.md for setup and operational limits.

## Folder structure

Use a feature-based folder structure throughout the project. Future application
code belongs under `src/features/<feature>/`, with each feature's routes, handlers,
services, validation schemas, and tests kept together. Shared infrastructure and
code belong outside features only when genuinely shared. Cross-feature access
should use explicit feature interfaces rather than reaching into private files.
Do not create global routes, controllers, or services folders. Create feature
directories only as required by an authorized implementation stage; Stage 0
retains the requested documentation layout and creates no application scaffold.

## Fixed components and responsibilities

| Component                      | Responsibility                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| Node.js, TypeScript, ExpressJS | HTTP transport and application execution                                             |
| Zod                            | Validate configuration, external inputs, provider outputs and tool arguments         |
| Application services           | Conversation flow, authorization, evidence rules and tool dispatch                   |
| AIProvider                     | Provider-neutral generation contract with Mistral, Claude and mock implementations   |
| Prisma with Neon PostgreSQL    | Durable application state and customer-scoped records                                |
| PostgreSQL with pgvector       | Public evidence and vector retrieval; database access remains application controlled |
| Upstash Redis                  | Short-lived customer-scoped state, rate control and processing coordination          |
| WhatsApp Business Cloud API    | Authorized inbound and outbound messaging                                            |
| Vitest                         | Unit, provider contract and relevant integration tests                               |
| Docker and Docker Compose      | Reproducible application/container workflows in later stages                         |

Neon remains the database provider and Upstash remains the Redis provider in
container workflows. Do not substitute local database providers. Test isolation
and externally supplied test credentials must be designed before integration tests.

## Planned message flow

1. Thin WhatsApp webhook handlers validate subscription challenges separately
   from message signatures. Authenticate incoming payloads before processing them.
2. Validate event shape, deduplicate using trusted event identifiers, durably accept
   work, and acknowledge promptly. Do not acknowledge undurable work as accepted.
3. Application processing resolves the customer scope from trusted transport context,
   loads only that scope's memory, and retrieves relevant permitted public evidence.
4. AIProvider receives bounded context and explicit tool definitions. It proposes
   responses or tool calls; it cannot grant permissions or execute network requests.
5. Application services validate and authorize each tool call, execute permitted
   operations, and validate results. Tool scope comes from the application, not the LLM.
6. Check factual support and freshness before sending through the authorized
   WhatsApp adapter. Unsupported or conflicting facts cause an honest fallback.
7. Persist only the required customer-scoped history and delivery/processing state.

The durable processing mechanism, retries and recovery design remain to be
selected in the foundation/messaging stages. Redis is not the sole durable record.

## Public evidence flow

An application-controlled ingestion process may collect approved public resources
after investigation. Use bounded requests, approved hosts and redirects, resource
limits, access-policy checks, provenance, and freshness metadata. Validate and
sanitize extracted content before storage. Do not execute page instructions.

RAG retrieves candidate evidence; similarity is not proof of correctness or
freshness. Commercial facts need source support and fact-specific freshness rules.
Stage 2 public source observations and blockers are recorded in ADR-004 and its linked investigation report. No authorized API contract was established. Embedding provider and
vector dimensions are open decisions. See [ADR-004](ADR-004-ECOMMERCE-INTEGRATION.md).

## Security and privacy boundaries

- Isolate customer records, caches, retrieval filters and logs by trusted customer
  scope; never accept scope overrides from prompts or model output.
- WhatsApp sender identity alone does not authorize access to private CFS orders.
- Public knowledge is separate from private conversations; never index customer
  messages into shared public RAG or send another customer's data to a provider.
- Keep secrets outside source control; redact logs and minimize provider context.
- Validate model output as untrusted input. Use explicit tool allowlists and output
  checks. No arbitrary HTTP, SQL, URLs or code execution from AI output.
- Future external requests require application-owned destinations, timeouts,
  response limits and redirect validation to avoid unintended access.
- Privacy retention/deletion, encryption configuration, support access, provider
  processing terms and deployment region require resolution before production.

## Failure behavior and observability

Missing or stale evidence must produce a clear limitation, not a guessed fact.
Provider outages require bounded retries and an honest fallback; do not silently
route production customer data to a development provider. Track sanitized
correlation identifiers, failures and latency without logging secrets or message
content by default. Retry and idempotency rules must cover outbound delivery as
well as inbound events; do not claim exactly-once delivery without evidence.

## Verification

Follow [AGENTS.md](../../AGENTS.md). Future tests must cover customer isolation,
authorization, prompt injection, unsupported facts, freshness, provider contract
behavior, webhook authenticity, duplicate delivery and failure recovery.
No production readiness or integration compatibility is claimed in Stage 0.

## Stage 3 implementation boundary

Only health endpoints and shared foundation infrastructure are implemented.
`src/app.ts` constructs Express without listening; `src/server.ts` owns configuration,
connections, signals and startup/shutdown. Health routes and tests live together
under `src/features/health/`; shared code covers validation, connections, logging,
errors and lifecycle. Generated Prisma code is ignored and recreated during build.

Use Prisma 7 with PrismaPg and verified TLS to Neon. The direct connection belongs
to Prisma CLI configuration; runtime uses DATABASE_URL. Stage 3 had no business models or migrations. Stage 4 now adds the scoped memory models and migration described below; RAG and ingestion remain unimplemented. Redis uses the Upstash REST SDK with bounded
requests, no telemetry and no retries. Container workflows use external Neon/Upstash.

Local verification and real-service Neon/Upstash probes passed on 2026-10-31. The compiled health and readiness endpoints both returned HTTP 200 with live dependencies. Docker daemon execution is deferred by the owner. See README.md for
commands and the dated verification record. Future message flow remains a design.

## Stage 4 memory boundary

Customer-scoped memory repositories/services use Prisma and Neon as durable truth.
Upstash contains bounded, expiring versioned recent context. No HTTP or AI tools
are exposed by this module. See [ADR-003](ADR-003-MEMORY.md) for scope validation,
composite ownership constraints, transaction behavior, cache fallback and limits.
