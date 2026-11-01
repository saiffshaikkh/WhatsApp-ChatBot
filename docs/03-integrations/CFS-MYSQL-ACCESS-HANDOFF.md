# Future authorized CFS MySQL source handoff

Recorded: 2026-11-01. Status: discussion and future-work handoff only.
The owner reports that the CFS database is MySQL. Hosting, version, schema,
credentials, network access, permissions and data semantics are not yet verified.
No CFS database access has been provided, inspected or used.

The owner wants this flow retained so a returning agent can resume without asking
for the whole explanation again. This note does not authorize a connection,
connector dependency, implementation stage, production deployment or private data
access. Stage 6 remains complete within its abstraction/mock scope; Stage 5 remains
paused and its temporary dependency gate stays active.

## Intended architecture

Future application workflow -> EcommerceProvider -> authorized read-only CFS MySQL
adapter -> parameterized queries -> Zod validation -> normalized domain results.

EcommerceProvider remains the application boundary. AI may call only explicitly
approved application tools; it must never receive database credentials, discover
tables during customer requests, write SQL, execute arbitrary queries, access CFS
directly or receive raw rows/provider responses. Developer-written queries use a
schema and field mapping reviewed before activation.

Neon PostgreSQL remains the application database for memory and durable workflow
state. The proposed MySQL connection is a separate external commerce source, not
a replacement for Neon or a change to DATABASE_URL/DATABASE_URL_UNPOOLED.
The current fixed-technology rules prohibit introducing MySQL. Before adding a
connector, obtain explicit owner authorization for the external-source exception
and its exact scope, update the relevant rules/ADR, and keep the application stack
unchanged. Do not silently weaken the permanent rules based on this discussion.

## Message to send to the senior or authorized database owner

> We need approved read-only product data access for the CFS WhatsApp assistant.
> Please create a separate account restricted to the relevant product/variant,
> selling-price, availability, specification, image and published product-URL tables
> or approved views. Customer, order and payment data are not needed for this scope.
>
> Please provide the MySQL host, port, database name, username, version and required
> TLS/CA certificate settings. Share the password through an approved secure channel.
> Please confirm whether IP allowlisting, VPN or an SSH tunnel is required for the
> development machine and later for the deployed backend. We do not need a public
> database endpoint or hosting/admin credentials.
>
> Please identify the approved tables/views, provide their schema/relationships,
> and confirm which fields are authoritative for product/variant IDs, distinct SKU
> namespaces, actual selling price, tax/discount rules, availability and published
> URLs. Please also confirm update timing, query/connection limits and whether an
> approved test environment or read replica is available.

Sending this message is the owner's action. Do not contact the senior or request
credentials from other people using tools without explicit authorization.

## Details to obtain and retain securely

| Detail                                               | Why it is needed                                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Written authorization and allowed scope              | Establish who may access which data for this application                                                                      |
| Host/endpoint, port, database name and MySQL version | Identify the actual source and compatible connection setup; a website/phpMyAdmin URL is not necessarily the database endpoint |
| Dedicated username/password                          | Separate, revocable access with only the required read privileges                                                             |
| TLS trust/certificate settings                       | Encrypt the connection and verify the server identity using the hosting owner's approved settings                             |
| Approved network route                               | Credentials alone do not make a private database reachable; obtain IP allowlisting, VPN or tunnel instructions                |
| Tables/views, schema and relationships               | Define the permitted query surface and correct joins without guessing names                                                   |
| Authoritative field definitions                      | Distinguish published products, variants, selling prices, taxes, discounts, stock meanings and published URLs                 |
| Environment, freshness and query budgets             | Know whether data is live/test/replicated, replica lag and allowed load/connection limits                                     |

Read-only permissions are enforced on the MySQL server by the database owner,
not by an environment variable. Prefer SELECT on approved product tables/views,
without write, schema-management, admin or grant privileges. The senior can supply
schema definitions if metadata inspection permissions are not available. Do not
expand permissions or attempt writes to prove the account is read-only.
Read queries can still load production; use agreed limits and a suitable approved
source. A replica may have lag, so it is not automatically real-time stock.

## What the project owner provides to the agent

- Non-secret connection/network instructions and the approved table/view names.
- Schema documentation and confirmed business-field meanings from the senior.
- Confirmation that authorized credentials are configured locally and that the
  particular connection/schema inspection work is explicitly authorized.

Passwords, connection strings containing secrets, private keys, customer records
and full database dumps must not be pasted into chat or committed. Use an approved
secure channel for credentials and local untracked/deployment secret configuration.
An SSH private key, if needed, stays in its approved secure location.

Proposed variable names only, not implemented or required by the current runtime:

```dotenv
CFS_MYSQL_HOST=
CFS_MYSQL_PORT=
CFS_MYSQL_DATABASE=
CFS_MYSQL_USER=
CFS_MYSQL_PASSWORD=
CFS_MYSQL_CA_FILE=
```

These names may change after the connection method is confirmed. Do not create or
populate an environment file, change .env.example, install a driver or print values
as part of this documentation task. CA/tunnel requirements are setup-specific.

## Resume sequence after explicit authorization

1. Read AGENTS.md, the latest scope, this handoff, the Stage 2 investigation,
   ADR-004 and the Stage 6 provider contract. State the Stage 5 dependency result:
   source-adapter work can be independent; live WhatsApp end-to-end testing still
   depends on Stage 5 activation. Discuss any actual dependent scope first.
2. Resolve the external-MySQL exception to the fixed stack and record the approved
   connection, query scope and implementation stage. Access credentials alone do
   not authorize every table, order capability or later stage.
3. Verify the authorized network/TLS connection and effective grants without a test
   write. Do not expose the database publicly or disable certificate verification
   to work around connection failures.
4. Inspect only permitted metadata: visible tables/views, relevant columns, indexes,
   keys and relationships. Read limited selected product columns/rows if needed.
   Do not scan/dump the entire database or inspect unrelated customer/payment data.
5. Confirm business rules with the senior. Table/column names and sample values do
   not prove price, stock, tax, discount eligibility, publication or identity rules.
6. Implement a MySQL-backed EcommerceProvider for approved searchProducts,
   getProduct and checkStock behavior, with parameterized bounded queries, timeouts,
   limited connections, safe errors and Zod-normalized results. Do not assume the
   existing mock's small substring search is the desired production search contract.
7. Review domain/provenance changes before wiring. Current Product source.kind is
   public_website or mock; add an accurately reviewed database-source representation
   rather than pretending a database query was a website observation. Keep separate
   SKU namespaces and per-variant offers/stock, preserve missing facts and define
   freshness/replica-lag behavior from approved source semantics.
8. Use actual published product/image URLs stored by the authorized source, subject
   to validation and verified meaning. A slug/path alone is not permission to build
   a full URL. Resolve missing URL evidence through an approved source or leave the
   URL absent; AI must never generate it. Review the current observed-URL trust
   mechanism for the database source without weakening its provenance checks.
9. Add targeted adapter/domain/security tests and relevant authorized read-only
   integration checks. Follow AGENTS.md type/lint/format/build verification. Only
   wire the real provider after its checks pass, without a silent mock fallback.
10. Update the implementation handoff with actual results, unresolved limits and
    next permitted work. Keep Stage 5 paused unless explicitly resumed; do not remove
    its temporary rule until its own completion conditions are satisfied.

No order methods or Order/OrderItem models are authorized by this proposal. Even
if order tables are accessible, future order support needs separate authorization,
customer ownership checks and privacy requirements. Cart/checkout remain excluded.

## References and current evidence

- [Engineering rules and temporary dependency gate](../../AGENTS.md)
- [Stage 2 historical public investigation](ECOMMERCE-INTEGRATION.md)
- [Stage 6 provider contract](ECOMMERCE-PROVIDER.md)
- [ADR-004: source access and ecommerce boundary](../02-architecture/ADR-004-ECOMMERCE-INTEGRATION.md)
- [MySQL table/view permissions](https://dev.mysql.com/doc/refman/8.4/en/grant.html)
- [MySQL encrypted connections and identity verification](https://dev.mysql.com/doc/refman/8.4/en/using-encrypted-connections.html)

MySQL documentation above was reviewed during the discussion; it does not establish
the CFS server version, deployed settings, schema, access rights or capabilities.
No connection attempt or runtime verification was performed for this handoff.
