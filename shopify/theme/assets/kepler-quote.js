'use strict';
const theme = window.KeplerTheme;
const { config, root, status, readQuotes, quoteKey } = theme;
  const writeQuotes = (items) => {
    try { localStorage.setItem(quoteKey, JSON.stringify(items)); theme.quoteState.storageFailed = false; renderQuotes(); return true; }
    catch { theme.quoteState.storageFailed = true; status(config.storageError); return false; }
  };
  const renderQuotes = () => {
    const items = readQuotes();
    document.querySelectorAll('[data-quote-count]').forEach(node => { node.textContent = String(items.length); node.hidden = items.length === 0; });
    document.querySelectorAll('[data-quote-list]').forEach(list => {
      list.replaceChildren();
      if (!items.length) { const p = document.createElement('p'); p.textContent = theme.quoteState.storageFailed ? config.storageError : config.empty; list.append(p); }
      items.forEach(item => {
        const row = document.createElement('article'); row.className = 'quote-line';
        const heading = document.createElement('h3'); const link = document.createElement('a');
        link.href = `${root}products/${encodeURIComponent(item.handle)}${item.variant ? `?variant=${encodeURIComponent(item.variant)}` : ''}`;
        link.textContent = item.title; heading.append(link);
        const model = document.createElement('p'); model.textContent = item.model;
        const label = document.createElement('label'); label.textContent = config.quantity;
        const qty = document.createElement('input'); qty.type = 'number'; qty.min = '1'; qty.max = '9999'; qty.step = '1'; qty.value = String(item.quantity);
        label.append(qty);
        qty.addEventListener('change', () => {
          if (!qty.checkValidity()) { qty.reportValidity(); qty.value = String(item.quantity); return; }
          const updated = readQuotes(); const target = updated.find(x => x.handle === item.handle && x.variant === item.variant); if (target) target.quantity = Number(qty.value);
          writeQuotes(updated);
        });
        const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = config.remove;
        remove.setAttribute('aria-label', `${config.remove}: ${item.title}`);
        remove.addEventListener('click', () => {
          const index = [...list.children].indexOf(row);
          if (writeQuotes(readQuotes().filter(x => x.handle !== item.handle || x.variant !== item.variant))) {
            const next = list.children[Math.min(index, list.children.length - 1)]?.querySelector('button, a'); next?.focus();
          }
        });
        row.append(heading, model, label, remove); list.append(row);
      });
    });
    const text = items.map(item => `${item.quantity} × ${item.title}${item.model ? ` | ${item.model}` : ''}\n${location.origin}${root}products/${item.handle}${item.variant ? `?variant=${item.variant}` : ''}`).join('\n\n');
    document.querySelectorAll('[data-quote-summary]').forEach(node => {
      // Preserve server-returned values following a contact validation error.
      if (node.dataset.edited !== 'true' && (!node.value || node.dataset.generated === 'true')) {
        node.value = text; node.dataset.generated = 'true';
      }
    });
  };

export function add(quote) {
      if (quote.getAttribute('aria-disabled') === 'true') { return; }
      const section = quote.closest('[data-product-section]');
      const variant = section?.querySelector('[name="id"]')?.value || quote.dataset.productVariant || '';
      const items = readQuotes(); const existing = items.find(item => item.handle === quote.dataset.productHandle && item.variant === variant);
      if (existing) { if (!quote.hasAttribute('data-quote-request')) existing.quantity = Math.min(9999, existing.quantity + 1); }
      else if (items.length >= 50) { status(config.quoteLimit); return; }
      else { items.push({handle: quote.dataset.productHandle, variant, title: quote.dataset.productTitle, model: quote.dataset.productModel || '', quantity: 1}); }
      if (writeQuotes(items)) {
        if (quote.hasAttribute('data-quote-request')) { location.assign(quote.href); return; }
        status(config.quoteAdded);
        const next = section?.querySelector('[data-quote-next]'); if (next) next.hidden = false;
      }
      else { location.assign(quote.href); }

}
  document.addEventListener('input', event => {
    if (event.target.matches('[data-quote-summary]')) event.target.dataset.edited = 'true';
  });

export function initialize() {
  const query = new URLSearchParams(location.search);
  const quoteSummary = document.querySelector('[data-quote-summary]');
  renderQuotes();
  if (quoteSummary && (!quoteSummary.value || quoteSummary.dataset.generated === 'true') && query.has('product')) {
    const handle = query.get('product'); const variant = query.get('variant');
    const model = query.get('model')?.slice(0, 200);
    if (/^[a-z0-9-]+$/.test(handle) && (!variant || /^\d+$/.test(variant))) {
      const requestedUrl = `${location.origin}${root}products/${handle}${variant ? `?variant=${variant}` : ''}`;
      if (!quoteSummary.value.split('\n').includes(requestedUrl)) {
        quoteSummary.value = [quoteSummary.value, `${model ? `${model}\n` : ''}${requestedUrl}`].filter(Boolean).join('\n\n');
        quoteSummary.dataset.generated = 'false';
        const details = quoteSummary.closest('details'); if (details) details.open = true;
      }
    }
  }
  const quoteMessage = document.querySelector('[data-quote-message]');
  if (quoteMessage && !quoteMessage.value && quoteSummary?.value.trim()) quoteMessage.value = quoteMessage.dataset.defaultMessage;

}
export { renderQuotes };
