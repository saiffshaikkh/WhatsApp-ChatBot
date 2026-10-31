# Glossary

| Term | Meaning in this project |
| --- | --- |
| CFS | Choice Furniture Superstore, the UK furniture retailer |
| Public resource | A legitimately accessible website resource; not permission to bypass restrictions |
| Authorized integration | An explicitly supplied or approved integration with documented access and scope |
| Business fact | Product data, price, stock, specification, URL, order status or delivery information requiring evidence |
| Provenance | Source location, collection time and context supporting a fact |
| Freshness | Whether evidence is recent enough for a specific use; thresholds remain undecided |
| RAG | Retrieval-augmented generation, where retrieved evidence supports an answer |
| pgvector | PostgreSQL extension planned for vector storage and similarity retrieval |
| Embedding | Numeric text representation for retrieval; model and dimensions are undecided |
| AIProvider | Application-owned interface shared by AI implementations |
| MistralProvider | Development/testing AIProvider implementation using Mistral |
| ClaudeProvider | Production AIProvider implementation using Claude |
| MockAIProvider | Deterministic AIProvider implementation for automated tests |
| Tool | Explicit application-defined operation with validated inputs and application authorization |
| Memory | Customer-scoped conversation state, separate from shared public knowledge |
| Authorization | Application checks deciding whether an authenticated principal may perform an action |
| Webhook | Incoming WhatsApp event delivery; handlers validate and dispatch with minimal logic |
| Idempotency | Processing a repeated event without repeating its effects |
| Prompt injection | Untrusted content attempting to alter instructions, permissions or behavior |
| ADR | Architecture decision record capturing context, decision and consequences |
| Stage gate | Explicit authorization and exit checks controlling progression |
