# ADR-001: Fixed technology stack

Status: Accepted for future implementation. Date: 2026-10-31.

## Context

The project requires a typed backend, evidence retrieval, customer isolation and
WhatsApp messaging. The technology choices are fixed by the project owner.

## Decision

Use Node.js, TypeScript and ExpressJS, with Zod for validation. Use PostgreSQL on
Neon with Prisma; use PostgreSQL with pgvector for RAG. Use Upstash Redis.
Use Mistral for development/testing, Claude for production and MockAIProvider for
automated tests. Use WhatsApp Business Cloud API, Vitest, Docker and Docker Compose.
Codex is the coding agent.

Do not introduce Python, MongoDB, another SQL database, another Redis provider,
LangChain or LangGraph.

## Consequences

No services or packages are created in Stage 0. Versions, Neon pgvector setup,
Prisma vector-query support, migration workflows and container connectivity must
be verified against relevant official documentation during implementation.
Use reviewed, parameterized SQL where vector operations require it; never execute
model-generated SQL. Do not claim an ORM feature exists without checking it.

## Stage 3 implementation detail

Node.js 24, Prisma 7 with PrismaPg, verified TLS Neon URLs and Upstash REST are used.
Exact dependency versions and security overrides are pinned in package.json and
package-lock.json. No business schema or alternate local data provider is introduced.
