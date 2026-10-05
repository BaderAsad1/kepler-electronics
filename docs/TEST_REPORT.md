# Verification report

Environment: macOS arm64, Node 24.19, PostgreSQL 16, installed Chrome through Playwright. Test contact addresses use example.invalid. No live charges or messages to the company were created.

- Unit/integration checks: **15 passed**, including monetary calculations, classification, file content checks, CSV sanitisation, password hashing, concurrent final-stock purchase, idempotent/out-of-order payments, invalid signatures, safe delayed payments, quote revision/expiry, immutable financial snapshots, refund ordering, notification deduplication and repeat imports preserving approved edits.
- Browser suite: results are recorded after the final run; search/filter/history, persistent quote list, server enquiry persistence, quarantine/private ownership, staff role/CSRF boundaries, real PDF bytes, zoom/Escape, keyboard focus, noindex and widths 320/390/768/1440/1920 are exercised with a temporary database schema.
- Migration verification checks actual referenced files, classifications, quote-only export, duplicate source records and redirect chains. Counts are in data/migration/verification.json.
- Desktop/mobile personal screenshot review covers homepage, catalogue, product, project, quote and cart. Local screenshots and capture results remain in docs/screenshots/implemented.
- Static deployment checks and measured performance conditions are appended after deployment. Development capture timings are not production performance scores.

No Lighthouse score or real-user performance/ conversion claim is made. Real provider transactions, email delivery and scanner integration remain pending credentials. GitHub Pages cannot validate server routes; those are tested locally with isolated fixtures.
