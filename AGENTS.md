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

Stage 6 EcommerceProvider abstraction is complete within its authorized internal contract/model/mock scope.
It is independent of unfinished Stage 5 work: implement only product read contracts,
Zod-normalized Product/ProductVariant/InventoryStatus models and a deterministic
MockEcommerceProvider. Stage 2 supports public product evidence, not a documented
commerce API, unrestricted search/collection or private order access. No live CFS
adapter, ingestion, AI integration, order capabilities/models, cart or checkout is
in scope. Stop after Stage 6; no subsequent stage is authorized.

Stage 5 remains paused at the owner's request. Its code/local-service verification
is complete, but main-database migration, Meta configuration/setup, current-contract
review and live WhatsApp verification remain pending. WhatsApp stays disabled.
The temporary dependency gate below remains active until Stage 5 is fully complete.

## Temporary Stage 5 dependency gate

This temporary rule applies while Stage 5 remains paused or incompletely verified.
Before implementing any newly requested stage:

1. Read its requested scope and relevant documentation/code. Tell the user whether
   that work depends on unfinished Stage 5 work, naming the specific dependency.
2. If independent, start the explicitly authorized stage after stating that finding.
   Stage 5's pending live verification alone must not block independent work.
3. If dependent, discuss the concrete limitations, blocked work and any independently
   testable subset with the user before starting implementation. Do not silently
   narrow scope or treat mocks as proof of live WhatsApp behavior. Proceed only with
   the scope resolved in that discussion.
4. Keep Stage 5 paused and its remaining migration, configuration, Meta setup and
   live verification work accurately recorded. Starting another stage does not
   complete Stage 5 or automatically authorize unrelated stages or capabilities.
5. When Stage 5 is fully complete, remove this entire temporary section and its
   temporary notices in README.md and docs/00-project/ROADMAP.md in the same handoff
   update. Completion requires the authorized target migration, complete valid
   configuration, Meta webhook/subscription setup, current API contract review and
   successful real send/receive verification, with required checks passing and
   failures resolved. Credentials alone or mocked tests do not satisfy completion.
   Preserve the factual verification history and permanent engineering rules;
   update resolved blocker/status text rather than retaining stale pending claims.
   The owner's separate Docker daemon deferral remains unchanged.

## Agent handoff snapshot

Last updated: 2026-11-01. This snapshot records observed results, not a substitute
for inspecting current files or running fresh verification after code changes.

| Stage                           | Recorded state                                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 0: Documentation                | Completed: project foundation, engineering rules and five ADRs                                                                    |
| 1: Requirements                 | Completed: eight PRDs in docs/01-requirements/                                                                                    |
| 2: Public website investigation | Completed: evidence register, capability classifications, limits and blockers                                                     |
| 3: Backend foundation           | Completed: local and live-service verification passed; Docker daemon checks deferred                                              |
| 4: Durable memory               | Completed: five models, scoped repositories/services, versioned Redis context and live isolation tests                            |
| 5: WhatsApp                     | Implemented: signed webhooks, scoped persistence, durable idempotency/replies, client and worker; live Meta checks pending        |
| 6: Ecommerce abstraction        | Completed: product read interface, validated product/variant/stock models and deterministic mock; no live adapter or order access |
| Later stages                    | Not implemented or authorized by this snapshot                                                                                    |

### Existing code and responsibilities

- `src/app.ts`: creates Express without opening a listener.
- `src/server.ts`: validates environment, creates connections and manages process signals.
- `src/features/health/`: GET /health, GET /ready and local HTTP integration tests.
- `src/features/memory/`: scoped repository/service, reusable identity/message helpers, temporary context and isolation tests.
- `src/features/whatsapp/`: config, signatures, schemas/normalization, thin routes, conversation resolution, durable repository, workflow/client/worker and tests.
- `src/features/ecommerce/`: EcommerceProvider, normalized models/observed URL checks, MockEcommerceProvider and unit contract tests. Not wired into HTTP, WhatsApp or AI.
- `src/shared/`: Zod config, Prisma/Upstash connections, safe JSON logging,
  centralized errors, startup/shutdown and tests.
- `prisma/schema.prisma`: five memory models plus WhatsAppDelivery and a nullable conversation receiver channel. The Stage 5 additive migration is tested but not deployed to the main database.
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

WhatsApp has deterministic placeholder replies only. Ecommerce has internal read contracts and a mock only. No live product search/catalogue adapter, AI, RAG, order, cart or checkout feature is implemented.
Do not assume the documented AIProvider classes exist in code yet.

### Stage 4 verification record

On 2026-10-31, 20 local tests and all 8 live integration tests passed without filters.
TypeScript, ESLint, Prettier, build and Prisma schema validation passed. The reviewed
20261031000000_memory migration deployed successfully to authorized Neon without
resetting existing data. Tests used isolated synthetic schemas and scoped Upstash
keys, cleaned up after completion. Earlier fixture timeout and transaction wait
failures were diagnosed, fixed and re-tested; no known verification failure remains.
At Stage 4, memory was internal without transport integration. Stage 5 now connects authenticated WhatsApp messages; AI and RAG remain unimplemented.
See ADR-003 for trusted scope, preference consent, cache TTL/versioning and limits.

### Stage 5 verification record

On 2026-11-01, 47 local tests and all 18 service integration tests passed. WhatsApp
service tests used isolated synthetic Neon schemas and a mocked outgoing client;
they are not live Meta delivery tests. TypeScript, ESLint, Prettier, Prisma
generation/schema validation and build passed. Early type/lint/format issues were
fixed and rechecked; no known local/service verification failure remains. A compiled smoke check with live Neon/Upstash returned 200 from /health and /ready, and 404 from the disabled WhatsApp route.

Unique receiver/message IDs, transactional incoming/reply persistence, existing
customer/conversation reuse, concurrent claims, restart recovery, scoped isolation,
429 retry limits, timeout uncertainty and HTTP-to-workflow behavior were verified.
The additive 20261101000000_whatsapp migration was applied only to isolated test
schemas, which were cleaned up. It has not been deployed to the main database.
No Meta credentials were added and no real WhatsApp messages were sent.

WhatsApp defaults to disabled. Enable only after migration, complete credentials,
Meta subscription setup and applicable privacy gates. Uncertain sends are not
blindly retried; API acceptance is not confirmed delivery. See
[WhatsApp integration](docs/03-integrations/WHATSAPP-INTEGRATION.md) and
[ADR-006](docs/02-architecture/ADR-006-WHATSAPP-PROCESSING.md). Official Meta webhook
document retrieval returned 429; full current-contract/live compatibility review
remains pending. Docker daemon checks remain deferred.

### Stage 6 verification record

On 2026-11-01, all 38 ecommerce unit tests and the full 85-test local suite passed.
TypeScript checking, ESLint, Prettier, Prisma generation and production build passed.
Tests cover the provider interface, malformed/missing fields, distinct identifiers,
variant isolation, unknown stock, exact observed URL membership, unsafe URL rejection,
mock behavior and absence of network access. Early URL handling and optional-property
typing failures were fixed and all affected checks rerun without weakening assertions.

The product boundary returns normalized data only, preserving application-owned
source observations and separate identifier namespaces. Stock is public wording,
not a live warehouse claim. Stage 2 did not establish legitimate order access, so
no order methods/models exist. No live CFS adapter, ingestion, database migration,
provider credentials, AI or WhatsApp wiring was added by Stage 6.

Live ecommerce integration is not implemented or claimed. Service integration tests
were not rerun in Stage 6 because this pure module changes no database/cache/transport
behavior; the 18 service-test passes above remain the Stage 5 historical record.
No fresh CFS observations were collected. Collection/reuse, freshness, identity
mapping and a reviewed live source remain gates for a separately authorized adapter.
See [the provider contract](docs/03-integrations/ECOMMERCE-PROVIDER.md) and ADR-004.
Stage 5 remains paused and the temporary dependency gate is preserved. Docker daemon
checks remain deferred. Stop here; no subsequent stage is authorized.

### Future CFS MySQL source handoff

The owner reports CFS uses MySQL, but hosting, version, schema, permissions and
connectivity are unverified. The intended future flow is application workflow ->
EcommerceProvider -> authorized read-only CFS MySQL adapter -> parameterized queries
-> Zod-normalized results. Neon remains the application database. No credentials,
connection attempt, connector implementation or new stage is authorized yet.

Read [the MySQL access/resume handoff](docs/03-integrations/CFS-MYSQL-ACCESS-HANDOFF.md)
before resuming this work. It preserves the senior request, required connection and
network/TLS details, approved product-only permissions, proposed variable names,
schema/business mapping and test/wiring sequence. The fixed-stack MySQL prohibition
requires an explicit external-source exception before adding a connector. Current
public_website/mock provenance must not be misused to label future database results.
Do not ask the owner to repeat this flow; ask only for missing access, authorization
or mapping details when work is explicitly resumed. Stage 5 stays paused.

This update is documentation only. Formatting, local links and policy consistency
were checked; no runtime/database checks or code changes were performed.

### Next permitted work

Maintenance verification on 2026-11-01: a parallel service run passed 16/18 tests,
with a query-read timeout and a transaction-acquisition timeout. The same suites
passed 18/18 with sequential files. Integration configuration now sets
fileParallelism=false; the default npm run test:integration passed 18/18 in 186s.
Concurrent delivery/claim tests, runtime timeouts and per-test budgets remain
unchanged. All 85 local tests, typecheck, lint, formatting, Prisma validation and
generation/build passed after the change. See README.md for the investigation.
Separate suite pools share remote services; sequential scheduling removes their
overlap, but the exact Neon/network latency cause and production behavior remain
unproven. Normal sandbox networking remains blocked; approved commands worked.
No migration or Stage 5 activation occurred. Docker daemon checks remain deferred.

Stage 6 is complete. Wait for the next explicit stage instruction and apply the temporary Stage 5 dependency gate before implementation. Stage 5 remains paused; its activation needs the authorized migration target, Meta credentials/setup and live verification. No subsequent stage is authorized. Real customer use still requires agreed privacy/retention
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
