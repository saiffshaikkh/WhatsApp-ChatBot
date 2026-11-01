# WhatsApp Business Cloud API integration

Status: Stage 5 implementation. Live Meta verification is blocked by missing
credentials and webhook setup. Only deterministic placeholder replies are implemented.

## Configuration and activation

WhatsApp is disabled by default. Health and memory infrastructure continue to work
without WhatsApp credentials. The webhook routes and worker do not exist when disabled.
Enable only after applying the additive migration and supplying all variables:

| Variable                   | Purpose                                                                  |
| -------------------------- | ------------------------------------------------------------------------ |
| `WHATSAPP_ENABLED`         | `true` activates the transport; defaults to `false`                      |
| `WHATSAPP_ACCESS_TOKEN`    | Authorized Meta bearer credential                                        |
| `WHATSAPP_VERIFY_TOKEN`    | Locally chosen subscription token, 16-256 characters                     |
| `WHATSAPP_APP_SECRET`      | Meta app secret used for payload authentication                          |
| `WHATSAPP_PHONE_NUMBER_ID` | The single authorized receiving/sending business number ID               |
| `WHATSAPP_API_VERSION`     | An explicitly selected supported Graph API version, format `v<number>.0` |

Keep values in local untracked configuration or deployment secrets. No API version
is silently chosen. Test fixture versions are synthetic, not a support recommendation.
The verification token does not authenticate POST events. Never paste credentials
into chat, fixtures, source control or logs.

Run `npm run prisma:migrate:deploy` against the authorized target before activation.
Migration `20261101000000_whatsapp` adds a nullable channel to Conversation and a
WhatsAppDelivery table, enum, unique constraint and indexes. Existing memory data
is retained. No migration runs at startup. Enabled startup/readiness also probes
the delivery table, so a missing migration does not silently leave the worker broken.

Configure a public HTTPS callback at `/webhooks/whatsapp` in Meta and subscribe the
app/WABA to the messages field. Real send/receive tests require authorized setup,
an eligible recipient, a valid token and the supported API version chosen above.
Do not enable real-customer ingestion before the privacy/identity policies in
ADR-003 and PRD-003 are agreed. Production deployment also needs ingress rate
limits and operational review; Stage 5 does not claim production readiness.

## Message flow

WhatsApp -> raw webhook authentication -> Zod validation -> normalization and
sender extraction -> scoped customer/conversation service -> message persistence
and durable reply record -> deterministic workflow -> outgoing client.

- GET validates mode/token/challenge and echoes only the challenge as plain text.
- POST verifies HMAC-SHA256 over exact raw bytes using constant-time comparison,
  before JSON parsing. Missing/invalid signatures return 401. Invalid JSON/schema,
  future timestamps beyond five minutes and unexpected receiver IDs return 400.
- JSON bodies are limited to 256 KiB, compression is disabled, and normalized
  batches are limited to 20 messages. Extra Meta fields are stripped, never used
  as customer scope. This stage supports digit-based WhatsApp sender identities.
- Identity comes exclusively from authenticated `messages[].from`; contacts,
  profile names, supplied customer IDs and conversation IDs do not choose scope.
- A unique WhatsApp identity resolves the customer. Each customer/business-number
  pair has one ongoing conversation. Existing unchannelled memory conversations
  remain untouched. Conversation expiry/rotation and identity reassignment are
  separate privacy/lifecycle decisions, not inferred from activity.
- Text is bounded to 4,096 characters. Unsupported media stores a fixed marker,
  not media URLs, captions or binary content, and receives a text-only explanation.
- Customer/conversation resolution, incoming Message, context-version increment
  and pending reply commit together. HTTP 200 follows durable acceptance, not
  delivery. Storage failures return a retryable 500. Partial batch acceptance is
  safe to redeliver because each message has a durable unique receiver/message ID.
- Duplicate and concurrent deliveries create one incoming message and reply job.
  Reusing the same provider ID for another sender is rejected. Redis is not the
  durable queue or idempotency store.
- Valid status-only notifications return 200 without customer processing. Delivery
  receipts are not reconciled in this stage; ACCEPTED means Meta API acceptance,
  never customer delivery/read confirmation.

## Sending, retries and recovery

A single non-overlapping worker polls PostgreSQL every second, claiming one pending
reply per tick with an atomic guarded update. Multiple instances cannot claim the
same pending attempt. Pending jobs survive restarts. Claims are scoped to the
configured business number. Shutdown drains in-flight work before disconnecting.

The client uses the fixed `https://graph.facebook.com` destination and documented
version/phone-number/messages path, bearer authorization and a text body. Redirects
are rejected. A five-second abort covers request/response reading; success bodies
are bounded to 64 KiB and Zod-validated. Raw provider errors are not exposed or logged.

| Evidence                                                 | Durable outcome / action                                               |
| -------------------------------------------------------- | ---------------------------------------------------------------------- |
| Successful validated API response                        | ACCEPTED, provider message ID and assistant Message committed together |
| HTTP 429                                                 | Retry after 60 seconds, maximum three attempts including the first     |
| Other HTTP 4xx                                           | FAILED, no automatic retry                                             |
| HTTP 5xx, network error, timeout or invalid success body | UNCERTAIN, no automatic resend                                         |
| SENDING claim older than 60 seconds                      | UNCERTAIN during recovery                                              |
| Inbound timestamp at least 23h55m old before sending     | EXPIRED, no free-form send                                             |

The five-minute safety margin avoids sending at the edge of the customer service
window. No proactive messages or templates are implemented. Delayed inbound events
retain their provider timestamp in the delivery record; message history timestamps
represent persistence time, not guaranteed event order.

The outbound API and PostgreSQL cannot commit atomically. A crash after claiming,
a lost response, or a completion-write failure can leave a reply unsent or sent
without confirmed local completion. Such work is conservatively UNCERTAIN rather
than blindly retried. Exactly-once delivery is not claimed. Operator reconciliation
and automated delivery-receipt handling remain unimplemented, and uncertain work
must not be manually resent without checking actual provider evidence.

Logs contain fixed event names and optional generated correlation IDs only. No
phone numbers, message bodies, verify tokens, app secrets, access tokens, request
headers or raw provider responses are logged. Durable status is authoritative;
best-effort logs are not the queue.

## Verification

`npm test` covers webhook verification/signatures/validation, normalization,
outgoing payloads, API failures, timeout, worker shutdown and failure outcomes.
`npm run test:integration` requires authorized Neon/Upstash, creates only isolated
synthetic test schemas and cleans them up. WhatsApp integration tests cover real
PostgreSQL persistence, customer/conversation reuse, transactions, concurrency,
reconnect recovery, isolation, retry limits and HTTP-to-workflow processing with a
mock outgoing client. These are not live Meta end-to-end tests.

## Official contract references

- [Meta WhatsApp Developer Hub](https://whatsappbusiness.com/developers/developer-hub/)
- [Meta Cloud API collection](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api)
- [Graph API webhook verification and payload security](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/)

Reference review attempted on 2026-11-01. The developer hub was accessible, while
Meta's webhook page returned HTTP 429 and the Postman collection exposed only its
application shell. Full current documentation retrieval and live compatibility
are therefore not claimed. Recheck the official setup/contract and supported API
version in the authorized Meta dashboard before activation. No rate-limit or
login restriction was bypassed.
