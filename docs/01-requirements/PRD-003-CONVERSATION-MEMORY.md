# PRD-003: Conversation memory and preferences

Status: V1 requirements, persistence policies unresolved.

## Problem

Customers repeat context across messages and visits, while unrestricted memory
could expose private information or preserve stale business facts.

## Goal

Provide isolated conversation continuity and controlled long-term customer preferences.

## User stories

- As a customer, I can refer to a previously discussed item in my conversation.
- As a customer, I can choose to remember, correct or forget my furniture preferences.

## Functional requirements

- Scope all history and preferences to trusted application-resolved customer identity.
- Preserve bounded recent context and required durable history in Neon PostgreSQL
  through Prisma; use Upstash Redis only for temporary state and coordination.
- Store long-term shopping preferences, such as size or style, only after explicit
  customer agreement. Do not infer sensitive traits or save everything by default.
- Allow customers to review, update, opt out of and request deletion of remembered
  preferences and retained conversation data under the agreed deletion policy.
- Current explicit constraints override older preferences; clarify conflicts when needed.
- Store provenance for preferences as customer-provided preferences, not verified
  product facts. Revalidate price and availability references before reusing them.
- Keep summaries private and untrusted; never place customer memory into shared RAG.
- Explain retention and deletion behavior before persistence of real customer data.
  Confirm deletion only after applicable stores have completed it; report pending work honestly.

## Non-functional requirements

Bound context size and cache lifetime. Define retention periods, backup expiry,
identity lifecycle, deletion completion targets and provider processing policy
before real customer persistence. Cache loss must not lose required durable state.

## Error cases

Ambiguous references require clarification. Storage outages must not report that a
preference was saved. Partial deletion must remain tracked and retryable without
restoring deleted preferences from stale caches or summaries.

## Security considerations

Apply PRD-007 to database queries, cache keys, summaries, background jobs and deletion.
A phone-number change or claimed identity must not automatically transfer old history.
Minimize data and provider context; exclude credentials and payment information.

## Acceptance criteria

- A follow-up resolves an item from the same customer's context only.
- A preference is not persisted long term before explicit agreement.
- Updated constraints replace conflicting preferences in recommendation behavior.
- Customer A cannot read, change or delete customer B's records or cache entries.
- Forgetting removes applicable active records, summaries and caches and documents
  backup expiry; no immediate backup-erasure claim is made without support.
- Recalled prices are refreshed or marked unverifiable rather than treated as current.

## Dependencies

ADR-003, PRD-001, PRD-007 and PRD-008; approved retention, consent, identity and
deletion policies. Exact schema and TTLs remain future implementation decisions.

## Out of scope

All V1 exclusions in PRD-001 apply. No cross-customer profiling, inferred sensitive
preferences, private CFS account access or marketing based on remembered preferences.
