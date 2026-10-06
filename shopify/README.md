# Kepler Atelier — Shopify theme

An original Shopify Online Store 2.0 theme for Kepler Electronics. The architectural design has been rebuilt in Liquid. The existing Next.js application and GitHub Pages preview remain available.

The installable package is `dist/Kepler Atelier-1.0.0.zip`. Theme source is in `theme/`. It includes editable sections and section groups, JSON templates, app blocks, native product forms, server-rendered option selection, collection filters and sorting, search, product media, a cart drawer, cart notes and discounts, Shopify checkout submission, customer-account links, localization, contact forms, newsletters, blog/article templates, password protection and gift cards.

## Buying and enquiry flow

The homepage includes a native Shopify model/brand search beside the solution pathways. Product pages put the product name, exact model, pricing status and model selector early in the mobile layout. Quote-only products have a primary **Request pricing** action that saves the selected model and opens the quotation form. **Add to project list** remains available for multi-product specifications, with a visible link to review and send the enquiry. Requesting pricing again preserves an existing quantity rather than incrementing it.

A mobile action bar shows the selected model and pricing status while scrolling. Approved shopping products use the same native product form from either purchase button, share the cart busy state and restore focus to the button used to open the shopping bag. Unavailable variants disable both controls. Space and scroll margins account for the action bar and device safe area.

The quotation form carries the exact model list and quantities, keeps the specification editable, and requires only name, email and requirements. Phone/company fields are optional and expandable. A pricing request message is suggested only when a specification exists; empty enquiries require the visitor to describe their needs. Returned form values and manually edited specifications are preserved. Dubai phone/email and original technical documents are directly reachable from product pages.

These changes follow [Shopify’s product-page guidance](https://www.shopify.com/blog/expert-advice-improve-product-pages) and [conversion checklist](https://www.shopify.com/blog/cro-checklist). They reduce identified friction; no sales uplift has been measured or guaranteed. Once a store is connected, evaluate qualified enquiries and completed paid orders separately, and compare mobile and desktop completion, errors and abandonment. Successful add-to-bag or quote-list clicks are intermediate actions, not revenue. Enquiry measurement must count confirmed submissions/delivery, and any analytics integration must respect the merchant’s consent settings. No advertising pixel or outside tracking service has been installed.

## Verification status

Shopify CLI 4.8.5 Theme Check, using the unmodified recommended configuration, reports zero errors and zero warnings. Eight source/rendering tests and twelve browser test groups exercise responsive layouts at 320, 390, 768 and 1440 pixels, automated WCAG A/AA rules, model selection, unavailable stock, cart errors, keyboard focus, project-list persistence, native forms without JavaScript and Arabic direction. These use an explicitly labelled LiquidJS renderer with Shopify API fixtures. They do not verify Shopify's hosted renderer, theme editor, payment gateways, live stock, contact delivery or checkout completion.

This is a bespoke merchant theme. It has not been submitted to or approved by the Shopify Theme Store. “AAA” is treated as premium production quality, not a completed WCAG AAA audit or Shopify certification. Automated scans cannot establish full accessibility conformance. Store testing, manual assistive-technology review and device testing are needed before making those claims.

## Install and review

Customer-account links use Shopify's hosted customer accounts. Legacy customer account templates are not included; stores retaining legacy accounts need that additional integration.

1. In Shopify Admin, open **Online Store → Themes → Add theme → Upload ZIP file** and upload the package as an unpublished theme.
2. Create Contact and Project quote pages with `page.contact` and `page.project-quote` templates. Select those pages in Theme settings → Store and project enquiries. Use the page handles and menus in `migration/store-setup.json`; the homepage's default links expect those handles.
3. Review the staged source content and media rights before importing. Create product metafield definitions from `migration/metafield-definitions.json`, then apply values from `migration/content-manifest.json`. Product CSVs do not carry the JSON document/specification metafields: these require an Admin API importer or an approved metafield import app. The CSV alone does not complete migration.
4. Select featured products/collection, menus and the project reference page in the theme editor. Install Shopify Search & Discovery and select collection/search filters. Shopify supplies available filters; the theme does not invent them.
5. Leave **Enable approved online shopping** off until commercial setup is complete. Review redirects against existing store paths before importing. Test the unpublished theme with real store products before publishing.

## Commercial approval and UAE setup

All source prices and stock remain unknown. `products-draft.csv` omits price columns and sets products to draft/unpublished, Shopify inventory tracking, `deny` out-of-stock sales and zero quantity. Zero is an operational sales block, not a source inventory claim. Shopify may assign a default price to a new draft product; it is not an approved Kepler price. Never overwrite an existing store's commercial data with this staging CSV.

To display a quote-only product, review its content and keep all its Shopify variants tracked with zero sellable inventory and `deny` inventory policy before publishing it. Set `kepler.commercial_mode` to `quote`. The theme displays price on request and project-list controls. Shopify must enforce the sale prohibition across every sales channel. Theme controls are presentation, not a server-side security boundary.

For approved shopping, enter real prices and stock in Shopify Admin, configure delivery/fulfillment, set `kepler.commercial_mode` to `buy`, and enable shopping in theme settings. Configure approved UAE business details, AED currency, Asia/Dubai timezone, payments, taxes, shipping regions/rates, policies and notification recipients. No UAE tax rate, delivery promise, payment provider, paid subscription or live payment has been assumed or configured.

The theme uses Shopify's presentment currency and tax flags and submits to Shopify checkout. It does not store card details or calculate payable totals. Its checkout controls are blocked when the cart contains quote-only products. Shopify backend inventory and checkout controls remain authoritative, including for stale carts, accelerated checkout and direct URLs.

## Project enquiries

The browser-saved project list holds exact variants and quantities. The quote page shows an editable specification and submits Shopify's native contact form. A confirmation renders only when Shopify returns `form.posted_successfully?`.

The browser-local list supports up to 50 models and is not an account-synced quotation, order or price commitment. Without JavaScript, users can select models through the native update form and type their specification into the contact form. Purchase, cart updates, checkout, filters, search and enquiries retain native HTML form paths.

Private BOQ uploads, staff-managed quotations, payment links, enquiry records and secure files require a Shopify app/app proxy or integration with the existing Kepler backend. App blocks provide integration points; those services are not simulated in the theme. Newsletter/contact delivery and CAPTCHA need connected-store verification.

## Migration staging

- `products-draft.csv`: 359 products, 364 model variants, all drafts. Image URLs point to the current controlled GitHub preview for transfer into Shopify's CDN.
- `content-manifest.json`: complete descriptions, source URLs, specifications, document links, review status, media provenance, 29 project pages and 13 additional content records, all unpublished/review-pending.
- `metafield-definitions.json`: storefront-readable fields. `documents` is JSON with `{label,url}` entries; `specifications` is a JSON object.
- `store-setup.json` and `redirects.csv`: curated page/menu and URL-redirect staging, requiring review before store import.

PDFs link to the controlled source-assets GitHub release. Product/project photographs remain original source material; some source images are low resolution and need approved higher-resolution replacements for a sharper live gallery; architecture images are labelled concepts. Rights, manufacturer revisions, compatibility, source claims and business review remain required. The four uncaptured source pages and 58 unresolved manufacturer endpoints in the existing migration report remain unresolved.

## Development

Requires Node 22.12 or newer; Node 24 was used.

```sh
cd /Users/bader/Documents/Kepler/shopify/tools
npm ci
npm run check
npm test
npm run export
npm run preview
```

The preview runs at `http://127.0.0.1:4174/` and labels its sample store data. `/products/fixture-buy-product` uses test-only prices/stock. Fixture files are outside the uploadable theme and do not enter the catalogue export or ZIP.

Use authenticated Shopify CLI access for hosted review; do not share secrets in chat:

```sh
npx shopify theme dev --path ../theme --store YOUR-STORE.myshopify.com
npx shopify theme push --path ../theme --store YOUR-STORE.myshopify.com --unpublished
```

These commands do not publish over the current live theme. No store upload, live publication or real payment test has been performed in this task.

## Shopify references

[Theme architecture](https://shopify.dev/docs/storefronts/themes/architecture), [Theme Check](https://shopify.dev/docs/api/shopify-cli/theme/theme-check), [variants](https://shopify.dev/docs/storefronts/themes/product-merchandising/variants), [Ajax cart](https://shopify.dev/docs/api/ajax/reference/cart), [accessibility](https://shopify.dev/docs/storefronts/themes/best-practices/accessibility), [Theme Store review](https://shopify.dev/docs/storefronts/themes/store/review-process/submit-theme), [product CSVs](https://help.shopify.com/en/manual/products/import-export/using-csv).
