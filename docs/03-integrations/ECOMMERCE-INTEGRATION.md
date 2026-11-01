# Ecommerce public website investigation

Stage: 2, public investigation only. Observed: 2026-10-31, approximately 14:30-14:42 UTC.
No integration or application code was implemented during Stage 2.

## Scope and method

Read AGENTS.md, all eight PRDs and the existing architecture/ADRs before investigation.
Inspect only legitimate public resources on the supplied CFS domain. No PHP source,
database, private API, admin panel or internal tool access exists.

Used an isolated, signed-out browser context, read-only DOM/JSON-LD inspection,
passive network inspection and small sequential batches of GET requests to observed
public links, scripts and sitemaps. Did not submit search/filter/order/account forms,
change product selections, replay frontend POST requests, enumerate hidden routes,
log in, solve CAPTCHA, spoof crawler identities, purchase or alter customer data.
The website itself loaded ordinary analytics and challenge-platform scripts; those
passive requests are not a discovered integration and were not replayed.

The web extraction tool returned a product cache miss, could not read robots.txt
and did not support sitemap XML. PowerShell requests could not connect. Ordinary
browser access returned the public content without manual challenge intervention.
These tool limitations are not evidence that the website is unavailable.

This is a small sample: homepage, one room category, one listing, two product pages,
five policy/support pages, three sitemap children and public script inspection.
It is not a catalogue crawl, legal review, load test or freshness guarantee.
No customer reviews or personal reviewer information are retained in this report.

## Classification meaning

| Status              | Meaning                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| AVAILABLE           | Directly observed public evidence for the stated capability in the sample |
| PARTIALLY_AVAILABLE | Some evidence exists, with access, completeness or consistency limits     |
| UNKNOWN             | Not established by permitted inspection; absence is not proven            |
| NOT_AVAILABLE       | Cannot be used with the project's current legitimate access               |

Availability describes observed information, not permission for unrestricted
collection, a stable API contract or a guarantee for the whole catalogue.

## Evidence register

All entries below were observed on 2026-10-31. IDs are local report references.
Browser fetch status 200 was observed for E02-E05 and E09-E13; E01 was also a
200 document in the passive network log. E06-E08 were rendered browser pages.

| ID   | Source                                                                                                              | Observation                                                                                |
| ---- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| E01  | [Homepage](https://www.choicefurnituresuperstore.co.uk/)                                                            | Public navigation, product links, GET search form, JSON-LD and frontend requests           |
| E02  | [robots.txt](https://www.choicefurnituresuperstore.co.uk/robots.txt)                                                | Generic crawler restrictions and sitemap declarations                                      |
| E03  | [Sitemap index](https://www.choicefurnituresuperstore.co.uk/sitemap.xml)                                            | Category, brand, product, image, blog, static, local, range and release sitemap references |
| E04  | [Category sitemap](https://www.choicefurnituresuperstore.co.uk/categories-sitemap.xml)                              | XML URL discovery, sampled without following all links                                     |
| E05  | [Product sitemap 1](https://www.choicefurnituresuperstore.co.uk/products-sitemap-1.xml)                             | Product and image locations; raw loc counts mix namespaces and are not product counts      |
| E06  | [Living room category](https://www.choicefurnituresuperstore.co.uk/living-room-furniture)                           | Room/category description and reported item count                                          |
| E07  | [Coffee tables listing](https://www.choicefurnituresuperstore.co.uk/coffee-tables)                                  | Cards, filters, sort control, pagination, inline request code and CollectionPage JSON-LD   |
| E08a | [Chelsea dressing table](https://www.choicefurnituresuperstore.co.uk/p/chelsea-mirrored-6-drawer-dressing-table)    | Product HTML, identifiers, specifications, canonical URL, Product and Offer JSON-LD        |
| E08b | [Milan dining table](https://www.choicefurnituresuperstore.co.uk/p/milan-white-marble-dining-table-sizes-available) | ProductGroup JSON-LD and three size options with distinct offers                           |
| E09  | [Delivery](https://www.choicefurnituresuperstore.co.uk/i/delivery)                                                  | Coverage, estimates, assembly and delivery service conditions                              |
| E10  | [Returns](https://www.choicefurnituresuperstore.co.uk/i/return-policy)                                              | Cancellation, returns, collection and made-to-order sections                               |
| E11  | [FAQs](https://www.choicefurnituresuperstore.co.uk/i/frequently-asked-questions)                                    | Shopping, delivery, returns and account/contact order-progress guidance                    |
| E12  | [Terms](https://www.choicefurnituresuperstore.co.uk/i/terms-and-conditions)                                         | Prices, availability, delivery, cancellation and assembly terms                            |
| E13  | [Customer service](https://www.choicefurnituresuperstore.co.uk/i/customer-service)                                  | Public support guidance, not an order lookup integration                                   |
| E14  | [Static sitemap](https://www.choicefurnituresuperstore.co.uk/static-sitemap.xml)                                    | Public policy/support source discovery                                                     |
| E15  | Homepage and E07 public scripts                                                                                     | Search configuration and filter/sort mechanisms described below; no endpoint replay        |

## Capability inventory

| #   | Capability                                                  | Status              | Evidence and limit                                                                                        |
| --- | ----------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Homepage                                                    | AVAILABLE           | E01 public document and DOM                                                                               |
| 2   | Category pages                                              | AVAILABLE           | E06 room category                                                                                         |
| 3   | Product listing pages                                       | AVAILABLE           | E07 cards and pagination; full coverage untested                                                          |
| 4   | Product detail pages                                        | AVAILABLE           | E08a and E08b rendered details                                                                            |
| 5   | Search                                                      | PARTIALLY_AVAILABLE | E01 form and search configuration; results not submitted due to E02 restrictions                          |
| 6   | Filters                                                     | PARTIALLY_AVAILABLE | E07 controls/code; result endpoint disallowed for generic crawlers, not replayed                          |
| 7   | Sorting                                                     | PARTIALLY_AVAILABLE | E07 select and handler inspected; result correctness untested                                             |
| 8   | Product IDs                                                 | PARTIALLY_AVAILABLE | E08a data-product-id/iProductId=158029; durability and mapping unconfirmed                                |
| 9   | SKU                                                         | PARTIALLY_AVAILABLE | E08a visible SKU differs from JSON-LD SKU; keep separate namespaces                                       |
| 10  | Product names                                               | AVAILABLE           | E08a/E08b headings and structured names                                                                   |
| 11  | Prices                                                      | PARTIALLY_AVAILABLE | E08 offers and displayed GBP prices; no real-time/feed guarantee                                          |
| 12  | Discounts/promotions                                        | PARTIALLY_AVAILABLE | E08 strike prices, percentages and voucher display; eligibility not independently confirmed               |
| 13  | Product variants                                            | PARTIALLY_AVAILABLE | E08b select values and ProductGroup; selection/deep-link behavior untested                                |
| 14  | Specifications                                              | PARTIALLY_AVAILABLE | E08 HTML tables; field completeness and variant alignment require validation                              |
| 15  | Dimensions                                                  | AVAILABLE           | E08a W/D/H and E08b size-specific measurements                                                            |
| 16  | Materials                                                   | AVAILABLE           | E08a MDF and mirrored; E08b engineered marble                                                             |
| 17  | Images                                                      | AVAILABLE           | E08 JSON-LD image URLs and gallery references; reuse permission/complete delivery unverified              |
| 18  | Availability/stock wording                                  | PARTIALLY_AVAILABLE | E08 text and Offer availability; no warehouse quantity or freshness SLA                                   |
| 19  | Product URLs                                                | AVAILABLE           | E08 canonical/structured URLs, E07 card links; never derive slugs                                         |
| 20  | Structured data                                             | AVAILABLE           | Product, Offer, ProductGroup, ItemList, CollectionPage, BreadcrumbList and FAQPage sampled                |
| 21  | JSON-LD                                                     | AVAILABLE           | application/ld+json scripts directly parsed in E01/E07/E08                                                |
| 22  | sitemap.xml                                                 | AVAILABLE           | E03 index and sampled children, not complete catalogue coverage                                           |
| 23  | robots.txt                                                  | AVAILABLE           | E02 read in browser; restrictions constrain integration choice                                            |
| 24  | Public frontend network requests                            | AVAILABLE           | E01 passive log, including public guide loading and scripts; not API authorization                        |
| 25  | Public JavaScript resources                                 | AVAILABLE           | E15 script sources and selected public code inspected                                                     |
| 26  | Public search mechanism                                     | PARTIALLY_AVAILABLE | GET form, SearchAction and autocomplete configuration; no supported API contract                          |
| 27  | Public category mechanism                                   | AVAILABLE           | E06/E07 navigation, HTML and category ID; numeric ID is not an API contract                               |
| 28  | Public order-tracking functionality                         | PARTIALLY_AVAILABLE | E11 refers users to account/contact; no public anonymous lookup verified. Bot live tracking NOT_AVAILABLE |
| 29  | Public policy pages                                         | PARTIALLY_AVAILABLE | E09-E12 readable, but conflicts require resolution                                                        |
| 30  | FAQ pages                                                   | AVAILABLE           | E11 and sampled page-specific FAQ JSON-LD                                                                 |
| 31  | Delivery pages                                              | PARTIALLY_AVAILABLE | E09/E12 readable, disagree on Scotland charges                                                            |
| 32  | Returns pages                                               | PARTIALLY_AVAILABLE | E10/E12 readable, differ in made-to-order language                                                        |
| 33  | Warranty pages/information                                  | PARTIALLY_AVAILABLE | E08 generic manufacturer guarantee text; definitive duration/standalone warranty policy UNKNOWN           |
| 34  | Installation pages/information                              | PARTIALLY_AVAILABLE | E09 assembly section, E08 product-specific assembly; eligibility conflicts need review                    |
| 35  | Documented public commerce API                              | UNKNOWN             | No authorized/documented API contract found in inspected resources                                        |
| 36  | Private order status/customer-specific delivery             | NOT_AVAILABLE       | No authorized source or order ownership mechanism available                                               |
| 37  | Production-safe automated collection permission/rate budget | UNKNOWN             | robots is not blanket reuse permission; no numeric rate contract established                              |

## Confirmed sample product data and identifiers

These are time-bound website observations, not a live product catalogue or permanent
facts. Revalidate before customer use. Do not promote this document into live RAG
product evidence after its observation time.

| Field                      | Chelsea, E08a                            | Milan, E08b                                                        |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| Product heading            | Chelsea Mirrored 6 Drawer Dressing Table | Milan White Marble Dining Table - Sizes Available                  |
| Brand                      | Humz                                     | Humz                                                               |
| Product code / MPN         | CFS08                                    | HT01-160cm for default 160cm option                                |
| Visible SKU                | 158029                                   | 144250                                                             |
| Structured SKU             | CFSUD-537                                | CFSUD-069-V16985745 for 160cm variant                              |
| Observed current GBP price | 417.99                                   | 589.99 for 160cm, 739.99 for 180cm, 839.99 for 200cm               |
| Observed strike price      | GBP 759.98                               | GBP 1179.98 for 160cm                                              |
| Displayed availability     | In Stock                                 | In Stock in size-option labels                                     |
| Material                   | MDF and Mirrored                         | Engineered Marble                                                  |
| Dimensions                 | W 122cm x D 41cm x H 82cm                | 160cm: W 160 x D 90 x H 75cm; 180/200cm widths with D 100 x H 75cm |
| Assembly wording           | Assembled                                | Free Assembly; product-specific complimentary white-glove wording  |

Chelsea's DOM exposes data-product-id and hidden iProductId 158029, matching the
visible numeric SKU but not the structured SKU. This does not establish that every
SKU equals the application product ID. Preserve raw names and their provenance;
do not silently collapse product code, MPN, WHS code, numeric IDs and JSON-LD SKUs.

Milan's select iProAttrId exposes option IDs 16985745, 16985746 and 16985747.
ProductGroup.hasVariant includes corresponding source-authored URLs and offers.
Example observed URL, not constructed by this project:
[160cm variant](https://www.choicefurnituresuperstore.co.uk/p/milan-white-marble-dining-table-sizes-available?variant=16985745).
The deep link was read from JSON-LD but not navigated; selection persistence is UNKNOWN.
Additional colour variants were URL-only objects, so do not assume every hasVariant
object contains complete specifications or an offer.

Example source-observed image:
[Chelsea image](https://images.choicefurnituresuperstore.co.uk/images2/Bedrooms/Dressing-Tables/Chelsea-Mirrored-6-Drawer-Dressing-Table.jpg).
Use published image URLs only; do not invent filenames or assume image reuse rights.

## Price and stock mechanisms

E08a Product.offers contains priceCurrency GBP, price 417.99, a strikethrough
UnitPriceSpecification, InStock availability, validFrom and priceValidUntil for
2026-10-31. E08b supplies offers per size variant. These are published assertions,
not proof that data refreshes continuously. A same-day validity field is not an SLA.

Product HTML shows separate sale/reference prices, discount percentages and BLACK15
voucher wording. Do not calculate an unconditional voucher-adjusted price or claim
stackability without verified terms. Checkout is excluded and was not used to
validate the payable total. A recommendation must preserve the exact selected
variant, currency and qualifications and use field-specific freshness rules.

Stock comes from visible wording and schema.org availability, not a warehouse API.
Delivery estimates such as the sampled 3-5 days are product estimates, never order
status or guaranteed arrival dates. Stock quantity, reservation, dispatch and live
synchronization mechanisms remain UNKNOWN/NOT_AVAILABLE as applicable.

## URLs, category, search, filter and sort mechanisms

- Product URLs come from anchors, canonical links and Product/Offer URL fields.
  Observed modern /p/ paths do not authorize slug construction. Sitemaps are another
  discovery source; validate the fetched identity and redirects before use.
- E06/E07 are linked room/type category routes. E07 contains iCategoryId=27,
  CollectionPage/ItemList and an observed next-page link to
  [coffee tables page 2](https://www.choicefurnituresuperstore.co.uk/coffee-tables?page=2).
  Page 2 was not fetched. Reported totals do not prove extractable or complete coverage.
- E01 has a GET form targeting /search with input q. WebSite.SearchAction independently
  describes the same query mechanism. The homepage data-search-endpoint is
  /autoCompleteAction_aj.php, also referenced in the loaded global header script.
  Search results and autocomplete responses were not invoked. This is frontend
  behavior, not documentation of a supported search API.
- E07 exposes filter names for brands, material/finish, colour, shape, style,
  features, price and category. Inline getCheckedFilterData collects selected values
  and prepares POST /getCategoryFilterProducts.php with query parameters, then inserts
  responseText as HTML. This is observed public code, not a request made by the agent
  or proof of endpoint availability, authorization or a JSON API.
- Sort select cfs-plp-sort offers Featured (empty value), Low To High (lth), High To
  Low (htl), Popularity (byPop). sortOrderBy sets orderBy and invokes the same filter
  function. Results, secondary sort order and completeness were not tested.

E02 generic User-agent restrictions disallow /search, /search.php, /keyword and their
listed equivalents, and /getCategoryFilterProducts.php. Named search-engine exceptions
must not be borrowed by impersonation. Search/filter/sort replay is not recommended.

## Structured data and public frontend evidence

E01 supplies FAQPage, WebSite.SearchAction, store and ItemList metadata. E07 supplies
CollectionPage, ItemList, BreadcrumbList, FAQPage and ImageObject data. E08a supplies
Product/Offer; E08b supplies ProductGroup/hasVariant with variant offers. This is useful
public extraction input, not inherently trusted or complete business truth.

Inspected public global script:
[header behavior](https://www.choicefurnituresuperstore.co.uk/js/cfs_global_2027_heading_20260928.min.js?v=20261028-inp-state2).
A second public header enhancement script was read; its sampled suggestions were
navigation recommendations, so they were not mistaken for a commerce search API.
Filter/sort code was inspected inline on E07.

The homepage passive network log showed successful GETs for versioned product-card
scripts, a /showHiddenContentUniv.php?mode=homeExpertGuides request and an AI widget
JavaScript resource under /api/ai/widget/. Do not infer callable AI tools or internal
commerce APIs from those filenames. No widget messages were submitted, endpoints
replayed, credentials collected or private services inspected.

## Public policy and order sources

| Topic                    | Source and usable scope                      | Limitation                                                                                                                  |
| ------------------------ | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| FAQs                     | E11 and page-specific FAQ content            | Current website statements only; preserve applicability                                                                     |
| Delivery                 | E09                                          | General coverage/service/estimate information; conflicting Scotland charge requires clarification                           |
| Returns and cancellation | E10 and E12                                  | Information only; made-to-order wording conflicts, no execution capability                                                  |
| Warranty                 | E08a/E08b guarantee section                  | Generic manufacturer applicability; no verified universal duration. Optional five-year protection is not universal warranty |
| Installation/assembly    | E09 assembly section and E08 product details | Product-specific exceptions and regional/order conditions; do not generalize free assembly                                  |
| Support/handoff          | E09-E13                                      | Public contact guidance; no transfer/ticket API or staffed WhatsApp takeover verified                                       |
| Order progress           | E11 account/contact guidance                 | No anonymous tracking form/API established; no account pages or customer records accessed                                   |

E09/E13 publish 0116 296 3800 and general support information; E10 publishes
customerservice@cfsonline.co.uk for returns. These are observed public routes, not
permission to send customer information or claim a transfer has happened.

Confirmed conflicts needing source-owner resolution:

1. E09 describes a mainland Scotland delivery charge while E12 describes free
   delivery for serviceable mainland Scotland. Do not choose a fee by guessing.
2. E10 made-to-order language restricts cancellation once production begins; E12
   distinguishes production after order from legally personalized specifications.
   Do not decide a customer's cancellation eligibility from inconsistent text.
3. E08b advertises complimentary assembly for that product, while E09/E12 describe
   paid/conditional general assembly. Preserve product-specific context and ask CFS
   to confirm applicability where conflicting; never promise a service for all items.

This investigation records website statements, not legal advice or a legal ruling.
Do not turn generic JSON-LD return metadata into universal policy eligibility.

## Restrictions, technical limits and blockers

| ID  | Blocker or limitation                                                    | Required next evidence                                                                                   |
| --- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| B01 | Live order tracking and private customer-specific delivery NOT_AVAILABLE | Explicit authorized integration and application ownership checks; otherwise retain PRD-004 fallback      |
| B02 | Generic crawler search/filter routes restricted by E02                   | Explicit permission/contract before using them; otherwise search/filter our own permitted evidence index |
| B03 | Automated collection/reuse terms and rate budget UNKNOWN                 | Resolve production collection permission, source allowlist, image reuse and refresh budget               |
| B04 | Prices/availability have no established freshness SLA                    | Agree freshness thresholds, refresh validation and fail-closed stale-data behavior                       |
| B05 | SKU namespaces and variant completeness unresolved                       | Explicit mapping and sample-based tests; keep raw source fields separate                                 |
| B06 | Policy conflicts                                                         | Source-owner clarification or withhold conflicting claims and offer verified support guidance            |
| B07 | Universal warranty terms UNKNOWN                                         | Product/brand-specific verified terms; state unknown where absent                                        |
| B08 | Direct human transfer NOT_AVAILABLE with current integrations            | Authorized destination/integration and operating owner; public contact route only until then             |
| B09 | Catalogue coverage, pagination and deep-link behavior untested           | Bounded permitted sampling and validation in a separately authorized stage                               |

No numeric rate limit or Retry-After was observed in the sampled robots/sitemap
responses, and no 429 appeared in the inspected homepage request sample. This is
not evidence of unlimited access. No throughput or challenge-threshold testing was
performed. Challenge-platform scripts were present; stop future automation on any
challenge, 401/403, CAPTCHA or 429, respect Retry-After and never rotate identity to evade limits.

## Recommended integration mechanism

Recommendation, conditional on B03 and future explicit implementation authorization:

1. Use permitted sitemap locations and category anchors for discovery. Read only
   approved product and policy HTML, parse JSON-LD plus visible specification tables,
   and retain source URL, observed time, raw identifiers, variant and field provenance.
2. Store validated public evidence in Neon PostgreSQL, using Prisma and pgvector as
   already decided. Build application-controlled product search/filter/sort and RAG
   over that evidence rather than coupling the bot to restricted frontend handlers.
3. Validate and reconcile HTML/JSON-LD per variant. Withhold conflicting, stale or
   incomplete commercial claims; never fill gaps with LLM output or constructed URLs.
4. Set conservative, bounded, permission-compatible refresh behavior. Stop on access
   restrictions, sanitize untrusted content and restrict destination hosts/redirects.
5. Expose only explicit application-owned read tools through AIProvider orchestration.
   Preserve customer isolation and all V1 exclusions. Do not implement fake order tools.
6. Prefer a documented, explicitly authorized feed/API if CFS supplies one later;
   evaluate its contract separately. None was established by this investigation.

Do not start an ingestion job, create a schema, implement tools or build an adapter
in Stage 2. Blockers are findings, not permission to bypass restrictions.

## Verification and completion

Validate all 34 requested inspection topics plus API/order/rate capability entries,
source references, allowed classification values, Markdown formatting, local links
and consistency with ADR-004 and V1 exclusions. Runtime tests, type checking and
code linting are not applicable to this documentation-only stage. No integration
compatibility, full catalogue coverage or production readiness is claimed.

## Stage 6 follow-up

Stage 6 implements only a read-only abstraction, normalized product models and a
mock, independently of unfinished Stage 5 activation. It does not refresh this
report, collect CFS data, replay restricted routes or create a live adapter.
No private order access was established, so order capabilities/models are absent.
The historical observations and B01-B09 limits above remain unchanged. See the
[provider contract and trust boundary](ECOMMERCE-PROVIDER.md).
