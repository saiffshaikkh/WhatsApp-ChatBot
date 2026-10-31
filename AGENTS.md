# Engineering rules for Codex

These rules apply permanently to every file and future stage in this repository.
Repository files must be written in English. Read this file and the relevant project,
architecture, and ADR documents before implementation.

## Project context and reading order

This project is a production-oriented AI-powered WhatsApp furniture shopping and
customer-support assistant for Choice Furniture Superstore (CFS), a UK retailer.
This file is the durable entry point for every replacement or returning agent;
it summarizes context and links to detailed sources rather than copying chat history.

Before changing anything:

1. Read this file and the latest explicit user instructions. User-authorized scope
   takes precedence over an older stage label in documentation; update that label.
2. Read [README.md](README.md) for setup, scripts and verification records.
3. Read [project overview](docs/00-project/PROJECT_OVERVIEW.md),
   [product vision](docs/00-project/PRODUCT_VISION.md) and
   [roadmap](docs/00-project/ROADMAP.md). Stage numbers were revised through user
   instructions; do not infer authorization from the roadmap alone.
4. Read the relevant PRDs in `docs/01-requirements/`,
   [architecture](docs/02-architecture/ARCHITECTURE.md), and applicable ADRs in
   `docs/02-architecture/` before implementation.
5. For CFS-related work, read the dated
   [public investigation](docs/03-integrations/ECOMMERCE-INTEGRATION.md) and
   [integration decision](docs/02-architecture/ADR-004-ECOMMERCE-INTEGRATION.md).
6. Inspect current code, package scripts and any changes left by another agent.
   Do not overwrite existing work or run two coding agents against the same files.

V1 covers furniture discovery/comparison, public FAQs and policy information,
customer-scoped memory/preferences, RAG, human handoff, security and observability.
Recommendations normally contain 3-4 relevant products only when verified evidence
supports them. Product URLs must be observed and validated, never constructed.
V1 excludes add/get/update/remove cart, checkout, payment processing, payment
credentials, abandoned cart and proactive marketing.

Public website access does not provide private CFS account or order access. Live
order tracking remains unavailable. Public support contacts do not establish an
implemented human transfer. Public prices, stock and policies require fresh evidence;
the investigation report is a historical observation, not a live catalogue.

## Permanent response and language style

Apply these rules to every response, explanation, discussion, code example and
repository change. Use Hinglish for conversational text and English for code,
comments, identifiers and all repository files.

| Rule                      | Required behavior                                                           |
| ------------------------- | --------------------------------------------------------------------------- |
| No over-explanation       | Get to the point and skip unnecessary background.                           |
| Simple words              | Use easy words and avoid unnecessary jargon.                                |
| Hinglish in chat          | Write conversational replies in a Hindi and English mix.                    |
| English in the repository | Keep every repository file and code example in English.                     |
| No long paragraphs        | Break explanations into short, readable paragraphs.                         |
| Points and tables         | Use bullets or tables when they make information easier to scan.            |
| Proper spacing            | Leave blank lines between paragraphs and list blocks; do not crowd content. |
| Crisp                     | Say only what is needed to answer or report the work accurately.            |
| No em dashes              | Use commas or periods instead of em dashes.                                 |

Keep required errors, verification results, blockers and material risks clear even
when being concise. These style rules apply throughout every project stage.

## Current stage

Stage 4 customer-scoped durable memory and temporary Upstash context are complete.
20 local tests and 8 live integration tests passed. The additive memory migration
is deployed to authorized Neon. Stop here; no later stage is authorized.

## Agent handoff snapshot

Last updated: 2026-10-31. This snapshot records observed results, not a substitute
for inspecting current files or running fresh verification after code changes.

| Stage                           | Recorded state                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 0: Documentation                | Completed: project foundation, engineering rules and five ADRs                                         |
| 1: Requirements                 | Completed: eight PRDs in docs/01-requirements/                                                         |
| 2: Public website investigation | Completed: evidence register, capability classifications, limits and blockers                          |
| 3: Backend foundation           | Completed: local and live-service verification passed; Docker daemon checks deferred                   |
| 4: Durable memory               | Completed: five models, scoped repositories/services, versioned Redis context and live isolation tests |
| Later stages                    | Not implemented or authorized by this snapshot                                                         |

### Existing code and responsibilities

- `src/app.ts`: creates Express without opening a listener.
- `src/server.ts`: validates environment, creates connections and manages process signals.
- `src/features/health/`: GET /health, GET /ready and local HTTP integration tests.
- `src/features/memory/`: scoped repository/service, temporary context and isolation tests.
- `src/shared/`: Zod config, Prisma/Upstash connections, safe JSON logging,
  centralized errors, startup/shutdown and tests.
- `prisma/schema.prisma`: Customer, Conversation, Message, CustomerPreference and ConversationSummary models.
- `prisma.config.ts`: direct CLI datasource; runtime uses PrismaPg with DATABASE_URL.
- `src/generated/prisma/` and `dist/`: ignored generated outputs, never hand-edit them.
- `Dockerfile` and `compose.yaml`: app container only, external Neon/Upstash resources.
- `package.json` and `package-lock.json`: pinned dependencies and verification scripts.
  The minimatch override addresses GHSA-g3hv-75wg-m249; see README.md before changing it.

### Last recorded verification and blockers

On 2026-10-31, 16 unit/local HTTP integration tests, TypeScript checking, ESLint,
Prettier, Prisma generation/schema validation and production build passed. npm audit
reported zero vulnerabilities. Compiled startup rejected missing config with a safe
JSON event and nonzero exit. Compose template validation with .env.example passed.

The real-service `npm run test:integration` passed on 2026-10-31 using authorized
Neon/Upstash configuration and read-only SELECT 1/PING probes. The compiled server
also returned HTTP 200 from /health and /ready with live dependencies.
Local Neon URL TLS modes were updated from require to verify-full; no credential
values were printed or added to tracked files. Earlier blocked attempts are resolved.
Docker daemon build/run checks are explicitly deferred by the user. Do not silently
turn this deferral into a passed check or resume Docker checks without new instructions.

No AI, WhatsApp, ecommerce, RAG, order, cart or checkout business feature is implemented.
Do not assume the documented AIProvider classes exist in code yet.

### Stage 4 verification record

On 2026-10-31, 20 local tests and all 8 live integration tests passed without filters.
TypeScript, ESLint, Prettier, build and Prisma schema validation passed. The reviewed
20261031000000_memory migration deployed successfully to authorized Neon without
resetting existing data. Tests used isolated synthetic schemas and scoped Upstash
keys, cleaned up after completion. Earlier fixture timeout and transaction wait
failures were diagnosed, fixed and re-tested; no known verification failure remains.
Memory code is internal, with no HTTP/WhatsApp/AI integration or RAG implementation.
See ADR-003 for trusted scope, preference consent, cache TTL/versioning and limits.

### Next permitted work

Wait for the next explicit user instruction. Do not add transports, AI tools or
public memory endpoints. Real customer use still requires agreed privacy/retention
and identity lifecycle policies. Docker daemon checks remain explicitly deferred.

Useful commands: `npm test`, `npm run typecheck`, `npm run lint`,
`npm run format:check`, `npm run build`, `npm run prisma:validate`,
`npm run test:integration`, and `npm audit`.

Local command sandbox restrictions have affected networking and esbuild filesystem
access in this session. Command-specific approval allowed those checks without
permanent Full Access. Inspect actual permissions; use supported approval requests
when required. Never bypass access controls or assume another session's permission
is inherited. Machine-specific Codex configuration is not part of the application.

## Permanent handoff maintenance policy

Every agent must maintain this file throughout the project:

1. At each authorized stage start, update current scope and boundaries from the
   user's instructions without granting permission for subsequent stages.
2. At every stage end, interruption or handoff, update the snapshot date, actual
   implementation state, verification results, blockers and next permitted action.
3. Update code paths, reading links and decisions when they change. Keep detailed
   requirements in PRDs and architectural reasoning in ADRs; summarize and link here.
4. Record failed, blocked, deferred and unrun checks distinctly. Mark a stage complete
   only when its required work and verification are complete.
5. Preserve all permanent engineering and verification rules unless the user
   explicitly changes them. Do not replace this file with a task-specific summary.
6. Never store secrets, customer data, raw transcripts or unverified claims here.
7. Check that links resolve and that the snapshot matches README.md, the roadmap
   and code. Keep the snapshot concise and replace stale status instead of appending
   an unlimited session log.

## Permanent engineering rules

1. Never invent APIs or endpoints.
2. Never assume private CFS backend access.
3. Never invent product data.
4. Never invent prices.
5. Never invent stock.
6. Never invent specifications.
7. Never invent product URLs.
8. Never invent order status.
9. Never invent delivery dates.
10. Never bypass authentication, CAPTCHA, rate limits or access controls.
11. Never exploit the website.
12. Never create real purchases/orders during investigation.
13. Never expose secrets.
14. Never hardcode credentials.
15. LLM output is never the source of truth for business facts.
16. Customer data must be strictly isolated.
17. Authorization is application responsibility.
18. AI can only access explicitly defined tools.
19. AI must never make arbitrary HTTP requests.
20. External website data is untrusted data.
21. WhatsApp webhook handlers must remain thin.
22. Important business logic requires tests.
23. Read relevant documentation before implementation.
24. Update documentation when architecture changes.
25. Implement only the current stage.
26. Stop after completing the current stage.
27. If a required CFS capability is unavailable, document it as unavailable rather than inventing an implementation.

Only the public CFS website, publicly accessible website resources, and explicitly
provided public or authorized integrations are within scope. There is no access to
CFS PHP source, databases, private/internal APIs, admin panels, tools, or services.
A PHP prompt mentioning a function or tool is not evidence that it exists or is
accessible. Discovered public resources require access and suitability review;
public visibility alone does not authorize unrestricted collection.

## Fixed technology choices

- Backend: Node.js, TypeScript, ExpressJS; validation: Zod.
- Database: PostgreSQL on Neon; ORM: Prisma; RAG: PostgreSQL with pgvector.
- Redis: Upstash Redis.
- AI: `AIProvider`, `MistralProvider` for development/testing,
  `ClaudeProvider` for production, `MockAIProvider` for automated tests.
- Messaging: WhatsApp Business Cloud API; coding agent: Codex.
- Tests: Vitest; containers: Docker and Docker Compose.
- Do not introduce Python, MongoDB, another SQL database, another Redis provider,
  LangChain, or LangGraph.

Provider choice never changes application authorization or truth requirements.
Use the smallest complete change and existing project patterns. Validate trust
boundaries with Zod. Never put credentials or customer content into logs or fixtures.

## Folder structure

Use a feature-based folder structure throughout the project. Keep each feature's
routes, handlers, services, validation schemas, and tests together under its
feature directory. Reserve shared directories for genuinely shared infrastructure
and code. Do not organize the application into global technical-layer folders.
Create directories only when the current authorized stage needs them.

## Permanent Codex verification policy

After EVERY meaningful code change:

1. Inspect changed files.
2. Run the most relevant targeted tests.
3. Run TypeScript type checking.
4. Run linting.
5. Run formatting checks.
6. Run relevant integration tests when applicable.
7. If behavior changed, add or update tests.

If any verification fails:

1. Diagnose the root cause.
2. Fix it.
3. Re-run the failed verification.
4. Re-run affected tests.
5. Continue until the relevant verification passes.

Never ignore failures, disable tests, remove assertions to make tests pass, weaken
type safety to hide errors, or mark work complete with known failures.
Report exact checks and results. Missing verification tooling is a gap, not a pass;
establish the required tooling in the relevant implementation stage. For every implementation stage all code verification above applies. Missing live-service credentials block live integration verification and must not be reported as a pass. Docker daemon checks are deferred by the project owner.

## Secrets and future configuration

Document variable names only. Keep real values out of tracked files and use secure
deployment configuration. The eventual variables are listed in [README.md](README.md).
Do not create real credentials or an environment file during documentation-only stages.
