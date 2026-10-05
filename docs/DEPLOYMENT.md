# Deployment and rollback

## Current GitHub preview

Target: `https://baderasad1.github.io/kepler-electronics/`, repository `BaderAsad1/kepler-electronics`.

GitHub Pages serves a static design/catalogue preview. GitHub’s hosting rules exclude operating an online business/ecommerce service there: <https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>. The later store needs a server host with durable storage, a database and private credentials. This deployment is noindex and shows a preview notice. Existing kepler-elec.com and DNS are untouched.

`export:content` takes a public snapshot of products, projects, resources and contact settings. Prices and stock are removed and all products become quote-only in the preview. `build:pages` creates an isolated `.pages-app`, removes API routes, prefixes asset paths, exports HTML and copies public assets. Browser quote lists persist locally and can be exported; email links open the visitor’s own mail application and do not claim delivery. The staff, order and quotation destinations explain the disconnected service.

The GitHub Actions workflow restores hash-verified technical documents from the `source-assets-v1` release, checks the code and builds/deploys the Pages artifact. The source originals are release assets rather than Git blobs to keep the repository practical. The local originals remain in `public/media` with provenance in `data/source/assets.json`. Use `npm run assets:restore` after a new checkout. PDFs served by the preview are genuine original bytes, not placeholder downloads.

Update the preview with approved changes locally, rerun import/export/verification if content changed, commit and push main. Business-sensitive settings and customer data never belong in the public snapshot. The preview remains noindex until content/rights review and a suitable business host are agreed.

GitHub Pages cannot return server-side permanent redirects or custom security headers. Legacy page aliases provide a corresponding-page link and browser redirect. The server application uses permanent HTTP redirects and security headers. Original document URL aliases serve the original bytes in the static export.

Rollback: select a known good commit, revert the relevant changes and push main; or rerun that commit’s successful workflow. Check the resulting deployment URL. Do not reset the original site or DNS.

## Server hosting later

1. Provision a Next.js Node server, Postgres/Supabase database and a persistent media volume. Configure the environment on that host; never commit secrets.
2. Apply `migrations/001_kepler.sql` through the trusted server database role. Direct `anon` and `authenticated` table grants are revoked; private/customer tables use RLS. Avoid exposing the server’s database credentials or service-role key to the browser.
3. Configure optional Supabase Auth. Staff membership and role are still checked against `staff`; authenticated non-staff users gain no admin access. Create initial admin through the CLI.
4. Configure private storage. Local private files require a persistent volume outside public media, restrictive permissions and backups. With Supabase Storage, create a **private** `private-boqs` bucket, block anonymous/authenticated listing/read and allow the server service role. Signed application access requires ownership/staff authority and a clean scanner verdict.
5. Configure the HTTPS upload scanner and test quarantine, clean verdict and blocked verdict. Until configured, uploaded documents remain quarantined and unavailable for download.
6. Configure Stripe **test** credentials and webhook endpoint `/api/payments/webhook`. Test hosted checkout and signed webhooks against the actual provider before live selling. Never infer paid status from the return URL.
7. Configure the email provider and verified sender. Provider acceptance is recorded; it is not proof of inbox delivery. Test with controlled recipients.
8. Schedule authenticated `/api/jobs` maintenance (or `npm run jobs:run`) for webhook retry, payment reconciliation, notification retry and file quarantine processing. Protect it with CRON_SECRET and monitor errors.
9. Approve prices, inventory, sellability, UAE shipping/tax rules, commercial policies and fulfilment ownership in admin. Keep sellingEnabled false until all gates and actual-provider checks pass.
10. Run the full checks, inspect production screenshots, back up database/private files, then arrange the business deployment/domain separately with the user.

Server rollback requires reverting code and restoring a verified database/private-storage backup only when necessary. The migration is additive/idempotent; test it against a backup before changing a live database. Never replay payment events destructively or roll back financial records to simulate refunds.
