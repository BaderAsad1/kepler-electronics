# Source migration

Updated: 2026-10-05T16:45:07.359Z

- manufacturerDocumentLinks: 205
- manufacturerDocumentsCaptured: 147
- manufacturerDocumentsUnresolved: 58
- snapshots: 944
- reachable: 940
- products: 359
- projects: 29
- content: 13
- redirects: 1778
- captured: 940
- contactSheetsReviewed: 917
- fullDetailReviewed: 7
- excluded: 49

These are actual captured/imported counts, not a claim of whole-site completeness. Source snapshots are kept in data/source/snapshots.json. The manifest, redirect map and review queue are in data/migration.

The public WordPress REST endpoint returned 401 (authentication required). Command-line requests returned 403; the public browser surface returned 200. The resumable crawler uses the normal browser, sitemaps, navigation and pagination at a bounded rate. No login or access restriction was bypassed.

Extensionless manufacturer document links are reconciled from captured HTML by scripts/migration/reconcile-documents.ts. Their fetch outcomes, final URLs, checksums and source pages are in data/source/manufacturer-documents.json. Only real PDF responses are published; document-detail/login/index/error responses remain unresolved in the review queue. The current manufacturer revisions may be newer than the source page and need technical confirmation. One earlier Dropbox preview response was corrected to the original occupancy-sensor PDF using its public shared-link download mode; the discarded HTML remains local in data/source/unresolved-responses. The crawler now validates PDF headers and uses the [documented Dropbox download parameter](https://help.dropbox.com/share/force-download).

Catalog imports are quote-only, with null prices and null inventory. Source prices are not approval to sell. Company claims, certification statements, technical descriptions and asset rights remain flagged for review. Project references have no invented scope. WooCommerce sample merchandise is excluded.

Reruns update only untouched imported records; admin edits set edited_at and are preserved. Review queue records include pending source/rights review and inaccessible pages. A captured screenshot is not a completed visual inspection.
