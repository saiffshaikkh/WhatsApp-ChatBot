# PRD-001: Core WhatsApp bot

Status: V1 requirements, not implemented. Source verification is pending.

## Problem

Customers need one conversational entry point for furniture shopping and support.
The bot must distinguish supported information from unavailable actions.

## Goal

Provide useful, evidence-backed WhatsApp conversations without transaction features.

## User stories

- As a customer, I can ask follow-up shopping and support questions on WhatsApp.
- As a returning customer, I can continue my own conversation without seeing others' data.
- As a customer, I receive clear limitations and a verified support route when needed.

## Functional requirements

- Accept and reply to customer-initiated WhatsApp conversations through the WhatsApp
  Business Cloud API. Keep webhook handlers thin and processing application controlled.
- Identify the conversation customer using trusted, authenticated messaging context.
  A WhatsApp identity is not proof of CFS account ownership or order authorization.
- Route shopping requests to PRD-002, memory to PRD-003, order questions to PRD-004,
  knowledge questions to PRD-005, and escalation to PRD-006.
- Support FAQs, delivery, warranty, returns, cancellation and installation information
  only from verified public evidence. Information does not execute a service request.
- Ask a focused clarification when intent or product identity is ambiguous.
- Deduplicate incoming events, durably accept work before acknowledgment, and bound
  retries and outbound processing. Do not claim an uncertain send succeeded.
- Explicitly decline excluded actions and explain unavailable capabilities honestly.

## Non-functional requirements

- Use concise, accessible messages and bounded context; avoid flooding the conversation.
- Follow the fixed stack, AIProvider abstraction and feature-based folder structure.
- Define latency, throughput, retry budgets and messaging-policy configuration before
  production; their numeric targets are not decided in this stage.

## Error cases

- Invalid signatures or malformed events: reject safely without processing customer data.
- Duplicate or delayed events: avoid repeated effects and misleading conversational order.
- Provider, storage or messaging failures: bounded recovery, observable failure and honest fallback.
- Unsupported media or intent: explain the limitation and offer a text clarification.

## Security considerations

Apply PRD-007 to every path. Validate external inputs, isolate customer scope, protect
credentials, and never allow model output to authorize tools or network destinations.

## Acceptance criteria

- A valid customer message receives an appropriate supported response or explicit limitation.
- A repeated event does not trigger repeated business processing or an avoidable duplicate reply.
- A spoofed sender or model-supplied identity cannot load another customer's context.
- FAQ and policy intents use PRD-005 evidence checks, not model recollection.
- Every excluded V1 action is declined without executing a transaction or campaign.

## Dependencies

PRD-002 through PRD-008; authorized WhatsApp setup; verified source inventory; future
foundation implementation and agreed operating limits. No runtime exists yet.

## Out of scope

V1 excludes add to cart, get cart, update cart, remove cart, checkout, payment
processing, payment credentials, abandoned cart and proactive marketing. These
exclusions apply to every PRD, including tools, reminders and handoff automation.
No application code, service provisioning or live investigation in Stage 1.
