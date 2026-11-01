# ADR-006: Durable WhatsApp processing and conservative send recovery

Status: Accepted for Stage 5 implementation. Date: 2026-11-01.

## Context

Meta can redeliver webhooks. Process crashes and API timeouts can happen between
acceptance and sending. Redis alone cannot be the only record of accepted work.
The user authorized WhatsApp transport with deterministic replies, excluding AI,
product search, ecommerce, RAG, orders, cart and checkout.

## Decision

Use a PostgreSQL WhatsAppDelivery record as the inbox identity and pending reply
in the same transaction as the scoped incoming Message. Enforce a unique
(phoneNumberId, messageId) pair. Reuse the memory customer resolver and transactional
message writer. Use one ongoing conversation per customer/business-number pair,
with a nullable channel so existing memory-only conversations remain unchanged.

Keep routes responsible only for HTTP verification, authentication, validation,
normalization and delegation. Resolve identity from signed message.from and check
the configured receiver before any customer lookup. Workflow owns deterministic
replies; a database-polling worker processes durable pending jobs outside the
webhook response. No queue dependency or Redis-based durable lock is introduced.

Atomic guarded claims prevent overlapping attempts across processes. Retry only
explicit HTTP 429 responses, after 60 seconds and at most three total attempts.
Treat network/timeout/5xx/malformed-success and abandoned claims as UNCERTAIN,
without automatic resend. Persist API acceptance and assistant history atomically.
Expire free-form replies five minutes before the 24-hour reply window ends.

## Alternatives

Synchronous sends inside the webhook would couple acknowledgment to provider
latency and make redelivery harder to control. An in-memory queue could lose
acknowledged work on restart. Redis-only acceptance would violate the durable
memory boundary. A second queue framework/provider is unnecessary for this stage.

## Consequences and limits

Accepted work survives restart and duplicate delivery without duplicate local
messages. The API and database cannot provide one atomic commit, so exactly-once
outbound delivery is not promised. Uncertain work requires provider evidence and
operator reconciliation; neither receipt reconciliation nor an operator UI is
implemented here. Polling is deliberately bounded, not a throughput guarantee.

WhatsApp remains disabled by default until complete configuration and the additive
migration are available. Real-customer privacy/lifecycle policy, ingress controls
and production operations remain gates. Live Meta tests are blocked by unavailable
credentials/setup. No later project stage is authorized.

See [the integration contract and operational limits](../03-integrations/WHATSAPP-INTEGRATION.md).
