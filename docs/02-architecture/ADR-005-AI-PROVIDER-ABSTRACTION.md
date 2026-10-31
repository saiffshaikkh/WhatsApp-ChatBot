# ADR-005: Application-owned AI provider abstraction

Status: Accepted for future implementation. Date: 2026-10-31.

## Context

Development/testing uses Mistral, production uses Claude, and automated tests must
be deterministic without real provider credentials or network calls.

## Decision

Define an application-owned `AIProvider` interface with `MistralProvider`,
`ClaudeProvider` and `MockAIProvider` implementations. Application services depend
on AIProvider, not provider-specific request formats. No implementation is created
in Stage 0.

The future contract must represent conversation input, evidence context, explicit
tool definitions, proposed tool calls, final text and normalized failures. Finalize
the exact TypeScript types only in the authorized implementation stage.

Providers translate transport formats and normalize responses. Application code
validates outputs with Zod, enforces authorization and limits, executes tools and
checks factual support. A model can propose a tool call but cannot authorize it.
No provider grants arbitrary HTTP access or treats generated facts as truth.

## Consequences

Use Mistral for manual development/testing, Claude for production, and
MockAIProvider for automated tests. Do not silently fall back from Claude to
Mistral with production customer data. Use sanitized fixtures for provider
contract tests, including invalid tool calls, malformed output and failures.

Model versions, timeouts, token budgets and any embedding provider remain open.
Do not assume either provider supplies a required embedding capability. Provider
adapters do not remove the need to verify SDK behavior against current official
documentation during implementation.
