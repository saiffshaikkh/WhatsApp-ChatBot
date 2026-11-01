# ADR-004: Public evidence and explicit ecommerce access

Status: Accepted for future implementation. Date: 2026-10-31.
Updated after Stage 2 investigation and Stage 6 abstraction authorization. No live integration is implemented.

## Context

There is no access to CFS PHP source, database, private APIs, admin panel or internal
tools/services. Stage 2 inspected the public website in a signed-out browser.
The [investigation report](../03-integrations/ECOMMERCE-INTEGRATION.md) records dated
sources, 34 inspection topics, capability classifications and blockers.

Public product HTML, Product/Offer and ProductGroup JSON-LD, specification tables,
category links and sitemaps were observed. Visible and structured SKU namespaces
differ in the sample. Public policies contain conflicts. Generic robots rules
restrict search/filter handlers. No supported public API contract was established;
a browser HTTP request or a PHP prompt naming a function proves no API entitlement.

## Decision

Use only legitimate, approved public evidence or explicitly authorized integrations.
Condition any future collection on permission, robots restrictions, an approved
source scope and refresh/rate budget. Do not replay restricted search/filter
handlers or impersonate an exempt crawler.

Prefer permitted sitemap/category discovery and validated product/policy HTML with
JSON-LD, followed by application-owned search/filter/sort and RAG over PostgreSQL
on Neon. Preserve observed URLs exactly, field provenance, distinct identifier
namespaces and variant-specific offers. Do not construct product URLs, treat stale
prices/stock as current, or resolve conflicting policies by model inference.

Website content and model output are untrusted. Application code owns validation,
authorization, destination allowlists and explicit tools. Never bypass authentication,
CAPTCHA, rate limits or access controls, exploit the site, access private endpoints
or create real purchases/orders during investigation.

## Consequences and unavailable capabilities

- Live order status, order mutations and customer-specific delivery remain
  NOT_AVAILABLE with current access. Retain PRD-004's honest fallback.
- Public support contacts are PARTIALLY_AVAILABLE for guidance; direct transfer is
  NOT_AVAILABLE without an authorized integration, consent and operational ownership.
- Public prices and stock wording are PARTIALLY_AVAILABLE evidence, not a live feed.
  Freshness, catalogue coverage, identifier mapping and policy conflict resolution
  are blockers for the affected production behavior.
- Collection/reuse permission and a numeric rate budget remain UNKNOWN. Availability
  of HTML or sitemaps does not establish unrestricted reuse rights.
- Product-specific warranty duration remains unverified; do not present optional
  protection cover as a universal manufacturer warranty.
- V1 excludes all cart operations, checkout, payment processing/credentials,
  abandoned cart and proactive marketing regardless of website functionality.

A later explicitly supplied authorized API/feed requires contract review,
application authorization and relevant tests before use. Stage 2 stops at evidence
and documentation; no adapter, schema, ingestion job or application feature is authorized.

## Stage 6 abstraction decision

The user authorized a read-only EcommerceProvider interface, Product/ProductVariant/
InventoryStatus models and MockEcommerceProvider. This does not depend on live
WhatsApp activation. Contracts cover search over permitted application-owned
evidence, product lookup and public availability observations, not live stock.
Stage 6 implements only the deterministic mock, with no HTTP adapter or ingestion.
No order methods/models are added because Stage 2 did not establish order access.

Normalize adapter-projected unknown data with Zod, strip unmodeled fields and
preserve missing facts, separate SKU namespaces, variant scope and observed times.
Product/image URLs must pass both the Stage 2 source-host policy and exact membership
in application-owned observed URL sets. Valid host syntax alone is not provenance.
Never let AI/user input supply evidence metadata. Return source URLs unchanged;
reject links requiring rewriting. Source metadata comes from an authorized adapter,
which still needs to establish freshness, field agreement, permissions and access.

Mark mock observations explicitly and never wire them as a silent runtime fallback.
No AI website access, cart, checkout or private customer order capability is added.
See the [Stage 6 contract and limits](../03-integrations/ECOMMERCE-PROVIDER.md).
