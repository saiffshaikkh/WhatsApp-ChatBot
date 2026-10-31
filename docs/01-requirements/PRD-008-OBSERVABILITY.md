# PRD-008: Observability

Status: V1 requirements, operational targets and tooling not selected.

## Problem

Failures in messaging, retrieval, providers or handoff can appear as silent success
unless operators can trace outcomes without inspecting private conversations.

## Goal

Make reliability, factual grounding and capability limits observable with minimal data.

## User stories

- As an operator, I can trace a failed message through processing and delivery states.
- As an operator, I can detect stale evidence or repeated provider failures safely.

## Functional requirements

- Use sanitized correlation identifiers across inbound acceptance, processing,
  retrieval, provider/tool calls, outbound sends and handoff attempts.
- Record structured event type, duration, outcome and safe failure category. Track
  duplicate handling, retries, provider failures, unsupported-fact fallbacks,
  freshness failures, rejected authorization and handoff status.
- Distinguish accepted, processing, sent, failed and uncertain outcomes based on actual
  evidence; never label API acceptance as confirmed customer delivery or human review.
- Measure latency, error rate, retrieval coverage, provider usage/cost where reported,
  and fallback frequency. Avoid phone numbers and other high-cardinality personal labels.
- Do not log message bodies, raw provider prompts/responses, credentials, order numbers
  or customer preferences by default. Redact errors before telemetry export.
- Provide access-controlled operational inspection and alerts for sustained failures;
  agree thresholds, retention, recipients and incident runbooks before production.
- Trace evidence identifiers and versions without copying private context into logs.

## Non-functional requirements

Bound telemetry volume and storage; define operational targets before launch.
Telemetry outages must not bypass authorization or falsely mark work successful.
Required processing/audit state must not depend solely on best-effort logs.

## Error cases

Telemetry export outage, malformed labels, missing correlation or repeated retries
must be detectable with safe local status where possible, without logging secrets
as a fallback. Monitoring failures need bounded recovery, not infinite retry loops.

## Security considerations

Apply PRD-007 to logs, metrics, traces, exports and operator access. Define redaction,
retention and deletion for any pseudonymous identifiers; do not share customer
content with monitoring services by default.

## Acceptance criteria

- A simulated provider or retrieval failure has a traceable sanitized failure outcome.
- Duplicate events and retries are visible without repeated raw customer payloads.
- A stale-evidence fallback can be counted and linked to evidence version identifiers.
- Redaction fixtures containing secrets and personal data do not appear in telemetry.
- Unauthorized operators cannot inspect customer-scoped records through observability.
- Telemetry export failure does not change authorization or fabricate delivery success.

## Dependencies

PRD-001 through PRD-007; operational ownership, approved telemetry destination,
alert thresholds, retention and runbooks. No monitoring vendor is assumed.

## Out of scope

All V1 exclusions in PRD-001 apply. Marketing analytics, customer profiling,
raw conversation surveillance and invented production reliability guarantees.
