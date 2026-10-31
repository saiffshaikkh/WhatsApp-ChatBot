# PRD-004: Order-tracking requests and capability limits

Status: Live order tracking is unavailable with current access. V1 provides honest
request handling and supported public guidance only.

## Problem

Customers ask where their order is, but there is no authorized CFS order source.
A convincing invented status would mislead them and risk exposing personal data.

## Goal

Handle order questions honestly without pretending to have order access.

## User stories

- As a customer, I learn clearly that the assistant cannot look up my order.
- As a customer, I receive verified general guidance or a verified support route.

## Functional requirements

- Detect order-status and customer-specific delivery requests and explain that live
  order lookup is unavailable. Do not simulate a lookup, tool call or backend response.
- Provide verified general delivery policy through PRD-005, clearly separated from
  a customer's order status, dispatch date or promised arrival date.
- Offer PRD-006 handoff only within its verified capability and consent limits.
- Do not ask for order numbers, addresses or account credentials for a lookup that
  cannot be performed. Redact unsolicited sensitive identifiers in telemetry.
- Explain that returns/cancellation policy information does not cancel or amend an order.
- Any later live tracking capability requires explicit authorization, a verified
  integration contract, ownership checks and a requirements update before implementation.

## Non-functional requirements

Unavailable-order responses must remain consistent across AI providers and rephrased
requests. No connection to private CFS systems is a dependency of this fallback.

## Error cases

An unsolicited order number, repeated request or claimed admin permission must not
cause fabricated status, guessed delivery dates or unauthorized endpoint discovery.
If no verified support route exists, state that limitation rather than invent one.

## Security considerations

WhatsApp identity alone does not establish order ownership. Apply PRD-007; never
request credentials or expose another customer's order data.

## Acceptance criteria

- Asking for an order status produces an explicit unavailable response, not a status.
- A supplied order number does not trigger private requests or a simulated lookup.
- Public delivery estimates are never phrased as that customer's delivery promise.
- Asking to cancel an order returns supported policy guidance without claiming cancellation.

## Dependencies

PRD-001, PRD-005, PRD-006 and PRD-007. Live tracking has no authorized integration
and is unavailable; this is a documented capability gap, not a mocked business feature.

## Out of scope

All V1 exclusions in PRD-001 apply. Live tracking, order mutation, shipment guarantees,
private customer records, purchases and real orders during investigation are excluded.
