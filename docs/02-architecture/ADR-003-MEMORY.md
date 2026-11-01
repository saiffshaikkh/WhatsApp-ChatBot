# ADR-003: Customer-scoped memory

Status: Accepted for future implementation. Date: 2026-10-31.

## Context

Conversation continuity is useful, but customer information must never leak across
conversations or become shared product knowledge. LLM memory is not business truth.

## Decision

Use Neon PostgreSQL through Prisma for required durable conversation state. Use
Upstash Redis for bounded, short-lived state and coordination. Keep public RAG
evidence separate from private customer memory.

Derive customer scope from trusted application context, enforce it on every read,
write, cache operation and background job, and never let the model choose another
customer's identity. Historical messages and summaries remain untrusted context.
Past quotes about prices or stock do not establish current facts.

## Consequences

Define retention, deletion, consent, identity mapping and access policies before
persisting real customer data. Minimize stored data and provider context; apply
deletion to durable records, caches and any derived customer state. Define backup
retention and deletion handling before production. Redis loss must not lose the
only durable record of accepted work.

Retention periods and real-customer lifecycle policies remain undecided; Stage 4 schema and cache limits are defined below. Future tests must cover
cross-customer reads/writes, cache key collisions, background processing and
deletion. Do not treat a WhatsApp identity as authorization for private CFS data.

## Stage 4 implementation

- Customer has a unique WhatsApp identity and UUID. `resolveCustomer` is an internal
  resolver for an already verified transport identity, not authentication or an API
  that customers can call to choose another identity. Stage 5 now supplies authenticated WhatsApp transport context; see ADR-006.
- A repository/service instance binds to one trusted customer UUID. Never derive
  this scope from an untrusted request body or model output. Customer lookup returns
  only the bound customer; conversation lookup includes both conversation and owner.
- Conversation belongs to Customer; messages and one updatable summary belong to
  Conversation. Composite foreign keys bind both conversation and customer IDs.
  Customer preferences have a unique (customerId, key) pair and explicit consent time.
- Save-message and contextVersion increment commit in one PostgreSQL transaction.
  Redis never participates in durable commits. Summary stores the message version
  observed when supplied text was saved; it does not generate summaries or assert
  that the supplied text covers every message.
- Recent context contains at most 20 messages, returned oldest to newest with a
  stable createdAt/id ordering. Redis TTL is 300 seconds. Keys include customer UUID,
  conversation UUID and a durable PostgreSQL contextVersion, preventing stale cache
  rewrites from replacing newer context. Old versions expire naturally.
- Every recent-context request checks conversation ownership/version in PostgreSQL
  before reading Redis. Cached messages are Zod-validated for shape, bounds and scope.
  Redis miss, invalid data or read/write failure falls back to PostgreSQL. Database
  failure propagates; Redis is never an authorization or durable-history fallback.
- Preferences require consent=true at the service boundary. User-supplied text and
  remembered preferences remain untrusted context, never product/business truth.
- Customer deletion cascades to durable dependent rows. No deletion API or retention
  job is implemented in this stage. Old Redis versions can remain for up to 300s but
  cannot be retrieved through the service after the durable conversation is removed.
  This is not a promise that all privacy deletion/backup obligations are implemented.
- Repository code is application-internal. RLS/database-role isolation is not claimed;
  code with unrestricted Prisma access is privileged and must not handle untrusted scopes.
- Migration adds these five tables, enum, indexes and foreign keys without resetting
  existing data. Integration tests use a generated isolated schema and synthetic
  records only, plus scoped Upstash keys; they clean up their own schema and keys.

Production use with real customer content still requires agreed retention, consent,
identity lifecycle, deletion, backup and provider-context policies from PRD-003.
This infrastructure stage does not authorize ingestion of real customer histories.

## Stage 4 verification result

The additive migration was deployed to authorized Neon on 2026-10-31. All 20 local
tests and 8 live integration tests passed. Foreign-key violations, cascade deletion,
customer/conversation/preference isolation, persisted reloads, Redis expiry/version
changes and Redis outage fallback were tested. Transaction acquisition/execution
budgets are five seconds. Retention and real-customer privacy decisions remain
production gates, not invented or assumed completed policies.
