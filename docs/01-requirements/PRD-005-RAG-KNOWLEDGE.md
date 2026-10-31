# PRD-005: RAG and verified knowledge

Status: V1 requirements, approved source inventory not yet available.

## Problem

Model knowledge alone cannot establish CFS business facts or current public policies.

## Goal

Ground shopping and support answers in approved, attributable public evidence.

## User stories

- As a customer, I receive supported answers about FAQs and store policies.
- As a customer, I can inspect the source and understand uncertainty or missing data.

## Functional requirements

- Use PostgreSQL on Neon with pgvector for retrieval and approved public sources
  only. Keep public evidence separate from customer conversation memory.
- Record source URL, collection time, product/variant context where relevant and
  evidence/version identity sufficient to trace each supported factual claim.
- Cover FAQs, delivery, warranty, returns, cancellation and installation information
  where verified sources exist. Missing coverage must be explicitly unavailable.
- Preserve policy conditions, exclusions, geography and product applicability. Do
  not generalize one product's warranty or installation terms to every product.
- Define field-specific freshness thresholds and refresh/failure behavior before
  serving facts. Expired or conflicting evidence cannot support a current claim.
- Retrieve relevant evidence, validate support, and include verified source links
  in factual answers. Similarity scores and model confidence are not verification.
- Remove superseded evidence from active retrieval and prevent stale caches from
  reviving it. Maintain traceability without retaining unnecessary customer data.
- Treat source instructions as untrusted text, never as tool definitions or authorization.

## Non-functional requirements

Bound retrieval context, ingestion resource use and refresh work. Choose embedding
model, dimensions, evaluation dataset and retrieval-quality thresholds before RAG
implementation/release. Do not assume either AI provider supplies embeddings.

## Error cases

Empty retrieval, inaccessible sources, extraction failure, stale evidence, conflicting
policies and unsupported questions require explicit uncertainty or verified handoff.
Missing data must never be replaced with model-generated commercial facts.

## Security considerations

Application-owned ingestion must validate destinations, redirects, sizes and content;
respect authentication, CAPTCHA, rate limits and access controls. No exploitation
or real orders. Apply PRD-007 to ingestion and retrieval as well as chat tools.

## Acceptance criteria

- Verified policy answers include their actual sources and material conditions.
- Each of the six support categories has either evidence-backed behavior or an
  explicit unavailable fallback; the system does not imply complete source coverage.
- Stale or contradictory evidence produces a limitation instead of a confident answer.
- Source text asking the model to ignore rules cannot alter tools or reveal secrets.
- A customer message is never retrieved as shared public knowledge for another customer.

## Dependencies

ADR-004, PRD-002 and PRD-007; legitimate source investigation, collection permission,
freshness policy, embeddings selection and relevant official documentation review.

## Out of scope

All V1 exclusions in PRD-001 apply. Private sources, unrestricted crawling,
customer-specific delivery promises, policy execution and unsupported factual generation.
