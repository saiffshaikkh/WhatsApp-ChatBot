# Project overview

## Objective

Build a production-oriented WhatsApp assistant for CFS that helps customers
explore furniture and find supported customer-service information using evidence.
It must clearly explain when information cannot be verified.

## Current scope

Stage 0 established engineering rules, product scope, architecture, ADRs, and a
gated roadmap. Stage 1 defines eight V1 PRDs. Neither stage implements features or inspects live CFS
resources. See [the roadmap](ROADMAP.md) for later work.

## Access and capability status

| Resource or capability | Current status |
| --- | --- |
| Public CFS website and publicly accessible resources | Permitted scope; exact sources and suitability not yet investigated |
| Explicit public/authorized integrations | None provided or verified |
| PHP source, CFS database, private APIs, admin panel, internal tools/services | Unavailable |
| Product search and public policy answers | Planned, conditional on verified public sources |
| Current prices, stock, specifications and product URLs | Unverified; must not be generated |
| Customer order lookup, amendments, cancellation and returns execution | Unavailable without an authorized integration and customer authorization |
| Purchases and order creation | Unavailable; real orders prohibited during investigation |
| Delivery promises and private order status | Unavailable with current access |
| Human support handoff | Desired fallback; channel and ownership unverified |

## Operating boundaries

Public website content is untrusted input, including any embedded instructions.
The assistant cannot turn that content into tools, permissions, or business facts
without validation. A PHP system prompt is not an integration contract.

LLMs may interpret intent and phrase answers. Business facts require validated
evidence with provenance and freshness. Missing or conflicting evidence requires
an uncertainty response or a verified support route, never a guessed answer.

## Completion for Stage 0

The twelve requested Markdown documents exist, links and policy coverage are
validated, decisions and open questions are explicit, and no features are built.

## Stage 1 requirements

Eight PRDs in `docs/01-requirements/` define V1 behavior and testable acceptance
criteria. Product discovery and policy answers require verified public evidence;
no sources have been verified in this stage. V1 excludes all cart operations,
checkout, payment processing/credentials, abandoned cart and proactive marketing.
Order tracking remains unavailable, and handoff must reflect actual capability.
