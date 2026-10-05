# Verification report

Verified on 5 October 2026. Public preview: https://baderasad1.github.io/kepler-electronics/.

Deployed application commit: `4ebc80dc291092d51fd5a1541d059f58e421c4e8`. [GitHub Actions run 37343688893](https://github.com/BaderAsad1/kepler-electronics/actions/runs/37343688893) completed successfully: verification, static build and deployment. The verification job also built the complete server application. Documentation/report commits after this commit do not change the deployed application.

## Application checks

CI environment: Ubuntu 24.04 runner, Node 24, PostgreSQL 16, Playwright Chromium. Local checks used macOS arm64, Node 24.19, PostgreSQL 16 and installed Chrome. Tests create private temporary database schemas and use example.invalid contacts. No live charges or messages to the company were created.

- Lint and type checking passed without warnings.
- Unit/integration checks: **15 passed, zero failures**. Coverage includes AED integer calculations, classification, file content signatures, CSV sanitisation, salted passwords, concurrent final-stock purchase, idempotent/out-of-order payments, invalid signatures, safe delayed payments, quote revision/expiry, immutable financial snapshots, refund ordering, notification deduplication and repeated imports preserving approved edits.
- Browser suite: **11 passed in one complete CI run**. It exercises exact SKU search/filter/history, persistent project-list edits, persisted server enquiries, quarantine/private ownership, staff role/CSRF boundaries, required real LPAD and shared-file PDF downloads, named zoom dialog/Escape, keyboard focus, noindex and six main templates at 320/390/768/1440/1920px.
- Both the GitHub Pages export and full server production build passed.
- The release restorer verified checksums and PDF headers for **all 252 source-linked PDF files**. The earlier Dropbox HTML preview capture was replaced with the original occupancy-sensor PDF. Source provenance records the correction; invalid responses are not published as documents.
- Migration verification passed with zero errors: 359 products, 29 project references, 13 content records, 2,326 referenced media/document paths and 1,778 page mappings. It checks file existence, classifications, quote-only export, duplicate imports and redirect chains/loops.

## Live preview checks

`npm run verify:preview` passed against the public GitHub URL: exact SKU/base-path navigation, browser project-list persistence and notes, actual email contact link, source-listed LPAD variants, real manufacturer PDF bytes, real legacy shared-file PDF bytes, noindex and no browser page errors. The script reads email links; it does not send an email.

`capture:site` captured homepage, catalogue, KED-M098 product, MAMA SHELTER project, quote and cart at 390 and 1440px. All twelve returned HTTP 200 with no horizontal overflow, broken visible images or browser page errors. Original screenshots and capture results remain local under `docs/screenshots/implemented/`; selected native-size detail crops support inspection. Personal review covers these desktop/mobile layouts, including genuine product/project imagery, visible project actions, null commercial information, readable specifications and honest empty/offline preview states. Persistent populated project-list edits were separately verified in the live journey and server browser suite.

The reviewed product mobile action has reserved bottom space. Main technical, project and solution paragraphs use 16px text; catalogue model headings use 14px. The static export omits the streaming loading fallback to prevent the large initial layout shift found during the earlier preview check. Server loading/error states remain in the application.

## Measured performance

Latest sample: `data/deployment/performance.json`, measured at 2026-10-05 16:52:57 UTC. Installed Chrome, headless, macOS, fresh browser context per width, normal network, no CPU/network throttling, two seconds after load, no scrolling. These are single lab samples, not Lighthouse scores or real-user data.

| Width | Largest contentful paint | Layout shift | Document load | TTFB |
| --- | ---: | ---: | ---: | ---: |
| 390px | 732ms | 0 | 705ms | 98ms |
| 1440px | 480ms | 0 | 451ms | 155ms |

The homepage canonical is `https://baderasad1.github.io/kepler-electronics/`. No conversion uplift or field-performance claim is made.

## Limits and deferred provider checks

GitHub Pages runs the static preview, browser project lists and email/telephone links. It cannot validate persistent server routes, payment webhooks or private uploads; those are tested in the isolated server suite. Actual Stripe-hosted test transactions, email-provider delivery and cloud scanner integration remain unverified until their credentials and server hosting are supplied, as deferred by the user. Isolated provider-adapter tests do not replace those checks.

Four source pages were inaccessible. Fifty-seven manufacturer links returned non-PDF responses and one returned HTTP 500; all 58 remain in the review queue. Detailed source technical/revision, rights and below-fold review is not complete for every source page. Coverage and remaining business approvals are stated in MIGRATION_REPORT.md and LAUNCH_CHECKLIST.md.
