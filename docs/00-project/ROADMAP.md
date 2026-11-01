# Roadmap

Each stage requires explicit authorization. Complete and verify only the current
stage, report its result, and stop. The roadmap is not permission to continue.

| Stage                                                    | Scope                                                                                                  | Exit evidence                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 0: Documentation, completed                              | Rules, vision, architecture, ADRs and glossary                                                         | Twelve files, valid links, policy coverage and consistency reviewed                       |
| 1: Requirements, completed                               | Eight V1 PRDs, capability limits and acceptance criteria                                               | Required sections, V1 coverage and contradiction review; documentation only               |
| 2: Public website investigation, completed               | Legitimate public sources, mechanisms, access limits and blockers; no implementation                   | Dated evidence, capability matrix and ADR-004 update                                      |
| 3: Backend foundation, completed                         | Config, Express, Prisma/Neon, Upstash, lifecycle, health, logging, tests and containers                | Tests, type check, lint, formatting and build pass; report live-service and Docker limits |
| 4: Durable memory, completed                             | Customer/conversation models, scoped persistence and temporary Upstash context                         | Persistence, relationships, isolation, cache and failure tests; normal verification       |
| 5: WhatsApp, implemented; live Meta verification pending | Verified webhooks, durable processing, deduplication and replies                                       | Signature, replay/duplicate, retry and relevant end-to-end checks pass                    |
| 6: Ecommerce abstraction, completed                      | Read-only EcommerceProvider, normalized models and deterministic mock; no live adapter or order access | Product/URL/stock/provider tests and normal local verification                            |
| Future: Production readiness, not authorized             | Privacy operations, monitoring, deployment, evaluations and runbooks                                   | Agreed acceptance thresholds, recovery tests and operational review                       |

Dependencies can be refined through documented decisions before the relevant
stage. For example, embedding selection must be resolved before RAG implementation.
No stage may silently add access to CFS private systems.

## Temporary Stage 5 dependency gate

Stage 5 is paused at the owner's request. For every new explicit stage request,
first state whether it depends on unfinished Stage 5 work. If independent, proceed
within that request's authorized scope. If dependent, discuss limitations and agree
the workable scope before implementation. A pending live WhatsApp gate alone does
not block independent work, and no roadmap label authorizes a stage automatically.

Follow the [temporary gate in AGENTS.md](../../AGENTS.md#temporary-stage-5-dependency-gate).
Once Stage 5 is fully complete, remove this temporary section and the corresponding
sections in AGENTS.md and README.md, while preserving accurate verification history.
Credentials or mock tests alone do not establish completion.

## Open questions and decision gates

- Which exact CFS domain, public pages, feeds or structured resources are valid
  sources, and what collection rules and reuse permissions apply?
- What source refresh cadence and evidence age are acceptable for each fact type?
- Is any authorized CFS integration available for private order support? Currently no.
- Which embedding model, vector dimensions and migration approach will be used?
- What customer identity mapping, retention, deletion, consent and deployment region
  policies are required? How will production model-provider data handling be agreed?
- Who owns support escalation, and what verified channel may the assistant offer?
- What WhatsApp business setup, messaging permissions and operating constraints apply?
- What model versions, operational limits, costs and release criteria are acceptable?
- Which additional secrets, including the Meta app secret, are required at implementation?

Do not block requirements documentation on these future decisions, and do not answer them by assumption.

## Requirements scope and source prerequisite

Stage 1 is the requirements stage defined by the latest project instruction; it
supersedes the earlier Stage 1 public-source investigation label. Source investigation
was authorized as Stage 2 before source-dependent implementation;
no investigation was performed as part of Stage 1 requirements documentation. Backend foundation was subsequently authorized as Stage 3; live-service verification passed on 2026-10-31; Docker daemon checks remain deferred by the owner. RAG implementation remains separately gated future work.

V1 covers shopping, public support information, memory, RAG, human handoff, security
and observability. Cart operations, checkout, payment processing/credentials,
abandoned cart and proactive marketing are excluded even if later integrations
become available. Live order tracking remains unavailable. Direct handoff remains
conditional; verified public contact guidance is the minimum handoff path.

## Stage 1 contradiction review

- Recommendation count is a normal 3-4 target, never permission to invent filler.
- Required recommendation fields must be verified; incomplete details are clearly
  labeled and are not complete recommendations. Images are optional when unavailable.
- Public delivery/cancellation/returns information does not execute order actions
  or establish customer-specific status, rights or delivery promises.
- Conversation identity does not authorize CFS account/order access.
- Long-term preferences require agreement and remain separate from public RAG.
- Human contact instructions are not a confirmed transfer; direct transfer requires
  an authorized integration, destination and consent.
- No application features or live source verification are part of this stage.

Stage 4 was explicitly re-scoped to durable customer memory by the project owner.
AI orchestration, RAG and live ecommerce integration remain future work requiring
separate stage authorization. Roadmap labels do not grant implementation permission.

Stage 5 WhatsApp transport is explicitly authorized as of 2026-11-01, with deterministic placeholder replies only. AI, product search, ecommerce, RAG, orders, cart and checkout are excluded. Live Meta verification remains pending credentials/setup. Stage 6 abstraction work is now separately authorized; no subsequent stage is authorized.

Stage 5 verification on 2026-11-01: 47 local tests and 18 real-service tests passed, with mocked outbound WhatsApp. Typecheck, lint, format, Prisma validation/generation and build passed. Migration remains undeployed to the main database. Stage 5 is not fully verified until the live Meta gate passes.

Stage 6 was explicitly re-scoped to EcommerceProvider abstraction by the owner on
2026-11-01. It does not depend on unfinished Stage 5 activation. Only product read
contracts, normalized models and mock behavior are authorized. Collection/live
adapters remain conditional on Stage 2 blockers and separate authorization.
Order access remains unavailable. Stage 5 stays paused and its temporary gate
must not be removed until its own remaining work is complete.

Stage 6 verification on 2026-11-01: 38 targeted ecommerce tests and all 85 local tests passed. Typecheck, lint, format, Prisma generation and build passed. No service interactions changed, so existing service integrations were not rerun. No live CFS provider is implemented. Stop after this stage.
