# Kepler Electronics

A Dubai-first building technology website with a migrated technical catalogue, project references, quotation workflow, authenticated staff workspace and a gated commerce backend. Currency is AED; timestamps are stored in UTC.

The current public deployment is a **GitHub Pages design/catalogue preview**. It uses real source products and documents, a project list saved in the visitor’s browser, and email/telephone contact. It does not run the server, save enquiries, accept BOQ uploads or take payments. The complete server application is retained in this repository for a later hosting connection.

## Local application

Use Node 24 and PostgreSQL 16 or a compatible Supabase Postgres database.

```sh
npm ci
npm run assets:restore
cp .env.example .env.local
# Configure DATABASE_URL through the environment or a root .env file.
npm run db:setup
npm run migrate:import
npm run admin:create
npm run dev
```

The application reads environment variables through dotenv (`.env`) and Next.js (`.env.local`). For command-line import/setup jobs, export DATABASE_URL or put it in `.env`. The default local database is `postgresql://localhost/kepler_local`. Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 16 characters in the local environment (or ADMIN_SUPABASE_ID for an existing Supabase Auth user), then run admin:create. It prints no password and creates no default login. Additional staff roles are managed in admin.

Open `http://localhost:3000`. The local database already contains migrated source records in this workspace. Do not substitute sample selling prices for approved company data.

## Checks and workflows

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run migrate:discover
npm run migrate:documents
npm run assets:source
npm run migrate:import
npm run export:content
npm run migrate:verify
npm run assets:generate
npm run assets:optimize
npm run build:pages
```

`npm test` and the browser suite create private, temporary database schemas and use example.invalid contacts. Set `TEST_DATABASE_URL` for a separate test database. They do not send test email or create Stripe charges. Chrome is required for browser checks. `migrate:discover` resumes the source crawl; `MIGRATION_LIMIT` and `MIGRATION_DELAY_MS` control its bounded scope/rate. `migrate:documents` reconciles extensionless manufacturer links already captured in source HTML; it caches valid PDFs and records unavailable documents without bypassing access restrictions. Upload new checksum-listed PDFs to the controlled release before publishing. Captured screenshots are review material, not automatic approval.

Generated image masters are cached. `assets:generate` only requests missing assets and requires an authorised API key if using the API fallback. Seven existing assets were generated with the native image tool. Their conceptual status, prompts and review notes are in `assets/asset-manifest.json`.

## Handoff

- [Migration coverage](docs/MIGRATION_REPORT.md), `data/migration/manifest.json`, `review-queue.json`, `redirects.json` and `verification.json`.
- [Deployment and rollback](docs/DEPLOYMENT.md).
- [Architecture and security](docs/ARCHITECTURE.md).
- [Launch dependencies](docs/LAUNCH_CHECKLIST.md).
- [Verification results](docs/TEST_REPORT.md).
- [Build brief](docs/BUILD_BRIEF.md).

Original public-source snapshots and asset provenance remain separate from edited database content. Original documents are retained locally and in the versioned source-assets GitHub release. Public repository exports exclude staff, customer, payment, session and private attachment records. Screenshots remain local under `docs/screenshots/`.
