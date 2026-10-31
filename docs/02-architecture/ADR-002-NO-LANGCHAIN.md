# ADR-002: No LangChain or LangGraph

Status: Accepted for future implementation. Date: 2026-10-31.

## Context

The assistant needs explicit control of authorization, evidence, provider behavior
and tool execution. LangChain and LangGraph are explicitly prohibited.

## Decision

Implement the required orchestration in application services using TypeScript and
the AIProvider contract. Use direct provider integrations as appropriate after
documentation review. Keep tools explicit and application controlled.

## Consequences

The application owns bounded tool execution, timeouts, retries, validation and
error handling. Add only what the authorized stage requires. Do not build a
general-purpose agent framework or introduce either prohibited dependency.
