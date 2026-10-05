# Source migration

Updated: 2026-10-05T15:24:07.696Z

- snapshots: 944
- reachable: 940
- products: 359
- projects: 29
- content: 13
- redirects: 1778
- captured: 940
- contactSheetsReviewed: 917
- fullDetailReviewed: 0
- excluded: 49

These are actual captured/imported counts, not a claim of whole-site completeness. Source snapshots are kept in data/source/snapshots.json. The manifest, redirect map and review queue are in data/migration.

The public WordPress REST endpoint returned 401 (authentication required). Command-line requests returned 403; the public browser surface returned 200. The resumable crawler uses the normal browser, sitemaps, navigation and pagination at a bounded rate. No login or access restriction was bypassed.

Catalog imports are quote-only, with null prices and null inventory. Source prices are not approval to sell. Company claims, certification statements, technical descriptions and asset rights remain flagged for review. Project references have no invented scope. WooCommerce sample merchandise is excluded.

Reruns update only untouched imported records; admin edits set edited_at and are preserved. Review queue records include pending source/rights review and inaccessible pages. A captured screenshot is not a completed visual inspection.
