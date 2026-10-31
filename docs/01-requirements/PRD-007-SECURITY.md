# PRD-007: Security and privacy

Status: Mandatory V1 requirements, not implemented or security-certified.

## Problem

Untrusted messages, public website content and AI output cross boundaries containing
customer data, credentials and application privileges.

## Goal

Enforce application-owned authorization, strict isolation and safe evidence access.

## User stories

- As a customer, my history and preferences remain private to my authorized scope.
- As an operator, I can reject malicious requests without exposing secrets or data.

## Functional requirements

- Validate configuration, events, extracted content, model output and tool arguments
  using Zod at trust boundaries. Reject invalid input with safe errors.
- Authenticate WhatsApp event payloads with the official signature mechanism;
  subscription verification tokens alone do not authenticate message payloads.
- Derive identity from authenticated context; authorize every data and tool operation
  in application code, including background processing, caches and observability access.
- Strictly isolate customers. Never accept a model-supplied customer identifier as authority.
- Allow only explicitly defined tools. AI must never make arbitrary HTTP requests,
  execute SQL/code or select unrestricted destinations. Validate redirects and resources.
- Keep secrets outside tracked files and logs; never hardcode credentials. Restrict
  service permissions and protect traffic and stored data with appropriate encryption.
- Treat website data and memory as untrusted, and test prompt-injection resistance.
- Enforce bounded request sizes, rates, retries, timeouts and resource consumption.
- Apply data minimization, consent, retention and deletion controls under PRD-003.
- Never bypass authentication, CAPTCHA, rate limits or access controls, exploit the
  website or create real purchases/orders during investigation.

## Non-functional requirements

Fail closed for authorization. Define resource limits, secret rotation, deployment
region, provider data handling, backup access and incident ownership before production.
Security claims require tests and review; this PRD does not establish legal compliance.

## Error cases

Invalid signatures, forged scope, malicious source text, unavailable authorization
state and malformed tool calls must be denied safely without revealing internals.
Secrets or unsolicited payment information must not be echoed or persisted in logs.

## Security considerations

These controls apply end to end, not only in prompts. Protect support and telemetry
access, separate environments and prevent silent production fallback to development
providers. No private CFS integration is authorized by this document.

## Acceptance criteria

- Forged or tampered events do not enter customer processing.
- Cross-customer read, write, cache, deletion and job attempts fail without disclosure.
- Model output cannot add tools, override authorization or fetch an arbitrary URL.
- Prompt-injection fixtures cannot expose credentials or change business truth rules.
- Secret and personal-data redaction checks pass for errors and telemetry.
- Important business/security logic has targeted Vitest coverage and follows AGENTS.md checks.

## Dependencies

All PRDs, AGENTS.md, official integration documentation, secure deployment
configuration, Meta app secret and agreed privacy/incident policies.

## Out of scope

All V1 exclusions in PRD-001 apply, including payment credentials. No bypass testing
against CFS, offensive exploitation or unsupported compliance certification.
