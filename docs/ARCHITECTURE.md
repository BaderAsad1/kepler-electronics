# Architecture and security

Next.js App Router and TypeScript render the catalogue and editorial pages. Postgres is the source of truth for server carts, enquiries, quotations, prices, stock/reservations, orders, webhook events, notification jobs and staff audit records. Payment, email and storage integrations are behind provider boundaries.

## Commerce integrity

The browser sends product IDs and quantities. The server resolves approved current prices, verified variants, stock, shipping zones and tax configuration in integer AED minor units. A transaction locks products and reserves stock, preventing two buyers from buying the final unit. Order lines and financial totals are immutable snapshots.

Stripe-hosted Checkout is created server-side with a stable idempotency key and order metadata. The raw webhook body is signature-verified; events are persisted and retried idempotently. Currency, amount and payment identity must match before payment is accepted. Duplicate events do not consume stock or enqueue notices twice. Delayed verified payments safely reacquire available inventory or enter payment_review. Expired sessions and uncertain session creation are reconciled with the provider before releasing stock. Refund amounts cannot regress when older partial-refund events arrive.

Only a verified paid order can be fulfilled; fulfillment is idempotent and audited. Success-page visits do not mark orders paid. Private order and quotation access use hashed bearer tokens plus customer ownership checks. Private views are noindex with no-referrer. No raw card data is collected.

## Staff and private documents

Staff roles are admin, editor, sales and fulfillment. Server endpoints enforce role boundaries, Origin/CSRF checks, persistent rate limits and session validity. Passwords are salted hashes; session cookies are HttpOnly, SameSite and secure on HTTPS. Disabling staff invalidates sessions. The final active admin cannot be removed accidentally.

Editors manage factual catalogue/content/media, without changing commercial approvals. Sales manages enquiries and review work. Fulfillment has order access and cannot read customer BOQ inboxes or change commercial settings. Sensitive writes create audit records. Staff media uploads validate signatures/dimensions, strip image metadata and require rights confirmation.

BOQ/specification uploads enforce size/type checks and are stored privately with restrictive permissions or a private Supabase bucket. A filename check is not a scanner: documents remain quarantined without a configured scanner. Staff/owner authorisation and a short-lived signed token are required after a clean verdict. Uploaded spreadsheets are never executed. CSV exports neutralise formula cells.

Notification jobs use stable event keys, leases, bounded retries and provider IDs. Notification transport and actual payment credentials are disabled during isolated tests. Funnel analytics requires opt-in and excludes contact data, free-text requirements and document contents; verified purchase events originate from payment processing. Static preview analytics is disabled.

## Migration and publication

Snapshots preserve original HTML/text, source IDs, fetch times and provenance. Imports classify product/project/company/archive content, exclude demonstration merchandise and keep unknown prices/stock null. Reruns update untouched imports and preserve records with edited_at. Review queues retain technical, company-claim and rights questions.

Production server queries expose approved records. The noindex review preview exposes source-listed catalogue content with review notices, without claiming technical or rights approval. Factual products/projects always use source media. Generated architecture is explicitly illustrative and never project evidence.
