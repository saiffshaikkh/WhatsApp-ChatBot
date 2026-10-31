# PRD-002: Product discovery

Status: V1 requirements, conditional on verified public product sources.

## Problem

Customers need relevant furniture choices and comparable facts without fabricated
products, prices, availability, specifications or links.

## Goal

Support product search, recommendations, details and comparison using verified evidence.

## User stories

- As a customer, I can search by furniture type, budget, size, material and preferences.
- As a customer, I can compare relevant options and inspect a specific variant.
- As a customer, I can open the actual verified product page.

## Functional requirements

- Search approved evidence and clarify ambiguous names, units, variants or constraints.
- Normally recommend approximately 3-4 relevant products when appropriate. Return fewer
  when fewer eligible matches exist; never pad results or silently relax hard constraints.
- Each recommendation must use a verified product name, price with currency, availability,
  relevant specifications and actual product URL. Include a verified image where available.
- Only products with verified required fields and freshness eligibility qualify for a
  complete recommendation. If data is missing, explain the gap and offer clarification
  or a verified partial detail response, clearly distinguished from a complete recommendation.
- Bind prices, availability, specifications and images to the same product/variant.
  Preserve source qualifications, price ranges and stock wording; do not invent totals,
  discounts, quantities, delivery promises or a precise price from a range.
- Never construct or guess product URLs. Use only source-observed, validated product URLs;
  user-supplied URLs require independent source validation before being presented as verified.
- Product details may disclose unavailable fields explicitly. Comparisons must align
  comparable units/variants and label unknown fields rather than infer equality or superiority.
- Use customer preferences only within PRD-003 controls. Explain recommendations through
  verified matching attributes, not unsupported quality claims.

## Non-functional requirements

Provenance and field-specific freshness must be traceable under PRD-005. Results must
fit readable WhatsApp messages. An image failure must not block otherwise valid text.

## Error cases

No match, incomplete data, stale price/availability, conflicting variants, inaccessible
source, broken URL or unavailable image must produce an honest limitation or fewer results.

## Security considerations

Treat catalogue text and images as untrusted. The application validates approved
hosts, redirects and resource limits. The model cannot fetch arbitrary URLs or
follow instructions embedded in descriptions. Apply PRD-007.

## Acceptance criteria

- Given four eligible matching products, the normal response offers 3-4 with all
  required verified fields and available verified images.
- Given two eligible products, only those two are recommended without invented filler.
- Given stale availability or missing required evidence, the item is not presented as
  a complete verified recommendation; the limitation is clear.
- Every returned product URL exactly comes from validated source evidence, never a
  slug or path composed by the model.
- Comparison of differing variants preserves their identities and flags unknown values.
- Missing images result in text-only output without fabricated image links.

## Dependencies

PRD-001, PRD-003, PRD-005 and PRD-007; source discovery, product identity mapping,
freshness rules and verified public catalogue coverage. These remain unverified.

## Out of scope

All V1 exclusions in PRD-001 apply. No cart, checkout, purchases, reservations,
private catalogue assumptions or real-time stock guarantee.
