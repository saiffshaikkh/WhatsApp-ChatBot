# EcommerceProvider abstraction

Stage 6 scope: internal read-only contracts, Zod-normalized models and an injected,
deterministic mock catalogue. This stage is independent of unfinished Stage 5
WhatsApp activation. No HTTP route, AI tool, live CFS adapter, scraper, ingestion
job, database change or runtime provider selection is introduced.

## Evidence and capability limits

The [Stage 2 investigation](ECOMMERCE-INTEGRATION.md) and
[ADR-004](../02-architecture/ADR-004-ECOMMERCE-INTEGRATION.md) support public product
observations. They establish neither a documented commerce API nor permission to
replay restricted search/filter endpoints. Automated collection/reuse, refresh
budgets, identifier mapping and catalogue coverage remain unresolved.

| Contract                            | Meaning in this stage                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `searchProducts(query)`             | Case-insensitive name/identifier search over injected mock records only; no website search or full-catalogue claim                         |
| `getProduct(productId)`             | Exact source product-ID lookup; absent IDs return null, no SKU-to-ID inference                                                             |
| `checkStock(productId, variantId?)` | Availability observation with source wording, provenance/time and mock marker; no live warehouse quantity, reservation or delivery promise |

Private customer orders and live order status are NOT_AVAILABLE with current
legitimate access. No order methods, Order or OrderItem models are created.
Cart, checkout, payment, AI and RAG remain excluded.

## Models and normalization boundary

Code lives under `src/features/ecommerce/`. `EcommerceProvider` is the only commerce
interface future application workflows may call. Future AI orchestration must use
explicit application-owned tools backed by this interface, never a fetch tool or
direct CFS access. No AI exists or is wired in this stage.

`normalizeProduct(data, evidence)` validates an adapter-projected candidate and
application-owned observation metadata. This candidate is an internal extraction
contract, not a claimed CFS API response shape. A future authorized adapter must
parse/reconcile actual HTML/JSON-LD into it before returning a Product. Unknown
fields, raw responses and nested unmodeled data are stripped. Errors are fixed
safe messages without raw input or Zod diagnostics.

| Model                | Representation                                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product              | Required nonempty name; optional source ID, visible SKU, structured SKU, MPN, exact GBP price and observed product URL; specifications, images, availability, variants and source observation |
| ProductVariant       | Separately scoped optional identifiers/name/offer/specifications/images/URL; at least one identifying field; URL-only variants are allowed                                                    |
| InventoryStatus      | `in_stock`, `out_of_stock`, `preorder`, `backorder` or `unknown`                                                                                                                              |
| InventoryObservation | Normalized status and original source wording, plus source URL, observed time and source kind                                                                                                 |

Visible and structured SKUs remain separate namespaces. No identifier is generated
or silently copied into another namespace. Exact money is a nonnegative decimal
string with two places and GBP currency; no floating-point conversion, voucher
calculation or currency conversion occurs. Price qualifications are preserved.
This minimal contract does not turn a price range into an exact price; an adapter
must omit an unsupported exact price rather than pick a value from a range.

Missing commercial facts stay absent, empty lists or unknown availability. Missing
name is invalid. Variant offers/specifications/stock are never inherited from the
parent. Unknown availability wording becomes unknown with its wording preserved;
no numeric stock, guarantee or delivery date is inferred.

## URL trust boundary

Product URLs are treated as source data, not generated identifiers. A CFS hostname
alone does not prove that a product exists. Every returned product/variant URL must
exactly match the adapter's observed product-URL set. Images similarly require an
exact match in the observed image-URL set. The source page itself must be in the
observed product-URL set. No slug, variant query or image filename is constructed.

The policy accepts canonical absolute HTTPS product URLs on the Stage 2 observed
www.choicefurnituresuperstore.co.uk `/p/` paths and images on the observed
images.choicefurnituresuperstore.co.uk host. Relative links, foreign/lookalike
hosts, credentials, fragments, nonstandard ports and URLs requiring serialization
changes are rejected rather than rewritten. Observed variant queries survive
unchanged. No URL is fetched, followed or validated for current reachability here.
New hosts, path families or redirect behavior require a separately reviewed source
policy; the allowlist is not a universal list of all legitimate CFS resources.

Observation metadata must come from trusted application code after permitted
source inspection. Neither the AI nor user input may supply the evidence sets or
assert provenance. Runtime syntax/membership checks cannot independently prove
that an observation happened, that source fields agree or that reuse is permitted.
A future adapter must establish those facts, bind each variant correctly, enforce
permissions/redirects and apply agreed field-specific freshness rules before
customer use. There is no default freshness threshold invented in Stage 6.

## Mock behavior

`MockEcommerceProvider` receives records explicitly, validates/normalizes each one
and marks every returned observation `source.kind = mock`. It contains no default
CFS catalogue and makes no network calls. The empty constructor yields an empty
catalogue. Synthetic fixtures use Stage 2 observed URL strings, never fabricated
CFS paths; synthetic names/prices/identifiers are test data, not retailer facts.

Duplicate product IDs or duplicate IDs within one product's variants are rejected.
Missing product/variant IDs return null. Missing optional IDs do not gain synthetic
lookup identities. Search is a small deterministic substring match over product
names and identifier namespaces, not semantic search, filters or recommendations.
Caller input and returned results cannot mutate the mock's private catalogue.
There is no runtime fallback that could substitute mock facts for live evidence.

## Verification and remaining gates

Unit tests cover the provider interface, normalized and incomplete products,
malformed data, distinct identifiers, exact observed URLs, unsafe/unobserved links,
stock mapping, variant isolation, empty/malformed mocks and mutation/network safety.
This pure module does not access Neon, Upstash or Meta. Existing service integration
tests are not required to verify these new operations; there is no live ecommerce
integration to test. No fresh CFS website observation or collection was performed.

A separately authorized live adapter still needs collection/reuse permission,
source/identifier mapping, refresh policy and access/contract verification. Stage 6
completion means this abstraction/mock scope is verified, not that a live catalogue
or AI shopping workflow exists. Stage 5 remains paused and its temporary dependency
gate stays in place. Stop after Stage 6.

## Future source discussed after Stage 6

The owner reports that CFS uses MySQL and may request authorized read-only product
access from the senior. Hosting/schema/access remain unverified. Keep the provider
boundary; the proposal does not replace it with direct AI/database access.
Read the [saved MySQL access and implementation handoff](CFS-MYSQL-ACCESS-HANDOFF.md)
before resuming. A future database adapter needs explicit scope/stack authorization,
source mapping, correct database provenance and relevant tests. No adapter or
configuration is added by this documentation update.
