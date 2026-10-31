# PRD-006: Human handoff

Status: V1 requirement; destination, staffing and transfer integration unverified.

## Problem

Some requests need a person, but a bot must not pretend a transfer happened when
no working support channel or authorized integration exists.

## Goal

Provide an honest escalation path with minimal, consented customer data sharing.

## User stories

- As a customer, I can ask for human help or receive an escalation offer after failure.
- As a customer, I know whether I must contact support or a transfer was accepted.

## Functional requirements

- Offer escalation for explicit human requests, repeated unresolved questions and
  unavailable capabilities. Do not force unnecessary automated loops.
- Minimum V1 behavior is a verified public support contact route when available.
  Giving contact instructions is not a transfer and must be described accordingly.
- If no verified route exists, state that handoff is unavailable. Do not invent
  phone numbers, links, opening hours, response times or support ownership.
- A direct transfer is conditional on an explicitly authorized integration and
  operational ownership. Do not implement or claim it before those are established.
- Before any direct transfer, show the minimal intended summary and request consent
  to share it with the verified destination. Do not transfer the full history by default.
- Report a direct transfer as submitted/accepted only with integration confirmation;
  this does not mean a human has read it. Prevent duplicate transfers on retries.
- Define bot pause/resume ownership before enabling direct transfer to avoid competing replies.

## Non-functional requirements

Keep escalation instructions clear and accessible. Verify route freshness; agree
staffing, ownership and response expectations before promising service levels.

## Error cases

Unverified or stale contact route, declined consent, transfer outage or ambiguous
acceptance requires an honest status and safe fallback, not a fabricated ticket ID.

## Security considerations

Apply PRD-007. Use a destination allowlist, minimal disclosure, customer scope and
access-controlled transfer records. No data goes to a guessed recipient.

## Acceptance criteria

- An explicit human request receives a verified route or a clear unavailable response.
- Contact instructions do not say that a live transfer has occurred.
- Declined consent prevents direct transfer of customer context.
- Failed or uncertain submission is not described as successful.
- Repeated processing cannot create avoidable duplicate handoffs.

## Dependencies

PRD-001, PRD-003, PRD-005, PRD-007 and PRD-008; verified support channel and owners.
Direct transfer additionally requires an authorized integration; none exists yet.

## Out of scope

All V1 exclusions in PRD-001 apply. Building a support console, inventing a ticketing
system, unapproved third-party messaging and guaranteed live-agent availability.
