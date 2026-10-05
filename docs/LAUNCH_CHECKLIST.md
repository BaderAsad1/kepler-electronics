# Launch dependencies

## Current preview

The GitHub deployment is a free design/catalogue preview with source documents, browser project lists and email/telephone links. Payments, server enquiries, private uploads and staff login run only in the server application. No customer submissions are represented as saved on Pages.

## External dependencies deferred by the user

- Appropriate server hosting and durable database/private storage.
- Company-approved AED prices, stock/sellability and variant configurations.
- Approved UAE shipping coverage, rates, fulfillment owner and tax settings.
- Approved store terms, privacy, returns and warranty policies. The preserved mobile-app policy is only a legacy app policy.
- Merchant credentials and actual test-mode hosted checkout/webhook verification.
- Email provider credentials, verified sender and controlled delivery tests.
- Upload scanning service and clean/blocked private-document access tests with that service.
- Company review of technical claims, project scope, source photography rights and generated brand imagery.

These are approval/integration dependencies, not sample values to invent. Selling remains disabled until all required gates are approved and connected.

## Remaining review scope

Discovery found 944 source URLs: 940 reachable captures and four inaccessible Unicode-hyphen tag URLs. The public REST endpoint requires authentication. An authorised WordPress export can reconcile additional inaccessible content.

Manufacturer reconciliation found 205 unique extensionless document links. 147 returned real PDFs and were preserved with source-page provenance and checksums; 58 returned HTML details/download pages or an HTTP error and remain unresolved. There are 252 preserved original PDFs in total, including the earlier 105 downloads. The manufacturer documents can be newer revisions than the original product page and require exact-model/revision review. Outcomes are recorded in data/source/manufacturer-documents.json; no protected document access was bypassed.

All 31 source contact sheets were personally reviewed (917 URLs), and seven short source templates received detailed desktop/mobile review; the LPAD family and legacy policy context received focused detail review. Infinite repeated content on the old long mobile pages prevents a complete below-fold inspection. This does not constitute full technical, rights or below-fold approval for every source page. Captures of the 23 earlier excluded WooCommerce demos were not individually inspected; the other 26 apparel demos were identified during contact-sheet review. All 49 are excluded from the catalogue.

Engineering checks and measured preview results are in TEST_REPORT.md. Actual Stripe-hosted transactions, provider email delivery and cloud scanner integration remain unverified until their credentials are supplied. The isolated payment adapter tests do not replace those provider checks.
