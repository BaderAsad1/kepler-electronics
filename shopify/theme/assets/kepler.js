(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('KeplerConfig')?.textContent || '{}');
  const status = (text) => { const node = document.getElementById('KeplerStatus'); if (node) { node.textContent = text; node.classList.add('visible'); clearTimeout(status.timer); status.timer = setTimeout(() => node.classList.remove('visible'), 6000); } };
  const root = (config.root || '/').replace(/\/?$/, '/');
  const quoteKey = 'kepler:project-list:v1';
  const activeRequests = new WeakMap();
  let cartBusy = false;
  let dialogTrigger = null;
  let quoteStorageFailed = false;
  const readQuotes = () => {
    try {
      const data = JSON.parse(localStorage.getItem(quoteKey) || '[]');
      if (!Array.isArray(data)) return [];
      return data.filter(item => item && typeof item.handle === 'string' && /^[a-z0-9-]+$/.test(item.handle) && typeof item.variant === 'string' && /^\d*$/.test(item.variant) && typeof item.title === 'string' && typeof item.model === 'string' && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 9999).slice(0, 50);
    } catch { quoteStorageFailed = true; return []; }
  };
  const writeQuotes = (items) => {
    try { localStorage.setItem(quoteKey, JSON.stringify(items)); quoteStorageFailed = false; renderQuotes(); return true; }
    catch { quoteStorageFailed = true; status(config.storageError); return false; }
  };
  const renderQuotes = () => {
    const items = readQuotes();
    document.querySelectorAll('[data-quote-count]').forEach(node => { node.textContent = String(items.length); node.hidden = items.length === 0; });
    document.querySelectorAll('[data-quote-list]').forEach(list => {
      list.replaceChildren();
      if (!items.length) { const p = document.createElement('p'); p.textContent = quoteStorageFailed ? config.storageError : config.empty; list.append(p); }
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
  const initializedModels = new WeakSet();
  const initializeModels = (scope = document) => {
    const viewers = [...scope.querySelectorAll('model-viewer')].filter(viewer => !initializedModels.has(viewer));
    if (!viewers.length || !window.Shopify?.loadFeatures) return;
    window.Shopify.loadFeatures([{ name: 'model-viewer-ui', version: '1.0', onLoad: (errors) => {
      if (errors || !window.Shopify.ModelViewerUI) return;
      viewers.forEach(viewer => { if (viewer.isConnected && !initializedModels.has(viewer)) { new window.Shopify.ModelViewerUI(viewer); initializedModels.add(viewer); } });
    } }]);
  };
  const enhanceProducts = (scope = document) => {
    scope.querySelectorAll('[data-product-section]').forEach(section => {
      const options = section.querySelector('[data-enhanced-options]');
      if (options) { options.hidden = false; const native = section.querySelector('[data-native-variants]'); if (native) native.hidden = true; }
    });
  };
  const closeDialog = (dialog) => { dialog.close(); dialogTrigger?.focus(); };
  document.addEventListener('click', async (event) => {
    const thumbnail = event.target.closest('[data-media-select]');
    if (thumbnail) {
      const section = thumbnail.closest('[data-product-section]');
      const selected = document.getElementById(thumbnail.hash.slice(1));
      const feature = section?.querySelector('.media-feature');
      if (selected && feature) { event.preventDefault(); feature.querySelectorAll('video').forEach(video => video.pause()); feature.replaceChildren(...[...selected.childNodes].map(node => node.cloneNode(true))); feature.querySelectorAll('img').forEach(img => { img.loading = 'eager'; }); section.querySelectorAll('[data-media-select]').forEach(link => link.removeAttribute('aria-current')); thumbnail.setAttribute('aria-current', 'true'); initializeModels(feature); }
    }
    const close = event.target.closest('[data-dialog-close]');
    if (close) { closeDialog(close.closest('dialog')); return; }
    const quote = event.target.closest('[data-quote-add]');
    if (quote) {
      if (quote.getAttribute('aria-disabled') === 'true') { event.preventDefault(); return; }
      event.preventDefault();
      const section = quote.closest('[data-product-section]');
      const variant = section?.querySelector('[name="id"]')?.value || quote.dataset.productVariant || '';
      const items = readQuotes(); const existing = items.find(item => item.handle === quote.dataset.productHandle && item.variant === variant);
      if (existing) { existing.quantity = Math.min(9999, existing.quantity + 1); }
      else if (items.length >= 50) { status(config.quoteLimit); return; }
      else { items.push({handle: quote.dataset.productHandle, variant, title: quote.dataset.productTitle, model: quote.dataset.productModel || '', quantity: 1}); }
      if (writeQuotes(items)) { status(config.quoteAdded); const old = quote.querySelector('[data-quote-feedback]'); if (old) old.remove(); const feedback = document.createElement('span'); feedback.dataset.quoteFeedback = ''; feedback.textContent = config.quoteAdded; feedback.className = 'sr-only'; quote.append(feedback); }
      else { location.assign(quote.href); }
    }
    const menu = event.target.closest('.mobile-menu nav a'); if (menu) menu.closest('details').open = false;
    document.querySelectorAll('.nav-submenu[open], .mobile-menu[open]').forEach(details => { if (!details.contains(event.target)) details.open = false; });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.querySelectorAll('.nav-submenu[open], .mobile-menu[open]').forEach(details => { details.open = false; details.querySelector('summary')?.focus(); });
  });
  document.addEventListener('input', event => {
    if (event.target.matches('[data-quote-summary]')) event.target.dataset.edited = 'true';
  });
  document.addEventListener('change', async event => {
    if (!event.target.matches('[data-option-value], [name="selling_plan"]')) return;
    const section = event.target.closest('[data-product-section]');
    const focusId = event.target.id;
    const values = [...section.querySelectorAll('[data-option-value]')].map(input => input.value).join(',');
    const plan = section.querySelector('[name="selling_plan"]')?.value;
    const quantity = section.querySelector('[name="quantity"]')?.value;
    const controller = new AbortController();
    activeRequests.get(section)?.abort(); activeRequests.set(section, controller);
    section.setAttribute('aria-busy', 'true');
    section.querySelectorAll('button[name="add"], [data-quote-add]').forEach(control => { if (control.tagName === 'BUTTON') control.disabled = true; else control.setAttribute('aria-disabled', 'true'); });
    const url = new URL(section.dataset.productUrl, location.origin); if (event.target.matches('[name="selling_plan"]')) url.searchParams.set('variant', section.dataset.variantId); else url.searchParams.set('option_values', values);
    if (plan) url.searchParams.set('selling_plan', plan);
    url.searchParams.set('section_id', section.dataset.productSection);
    try {
      const response = await fetch(url, { signal: controller.signal }); if (!response.ok) throw new Error(config.error);
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const replacement = doc.querySelector('[data-product-section]'); if (!replacement) throw new Error(config.error);
      if (activeRequests.get(section) !== controller) return;
      const wrapper = section.parentElement;
      section.replaceWith(replacement); enhanceProducts(wrapper); initializeModels(replacement);
      const qty = replacement.querySelector('[name="quantity"]'); if (qty && quantity) { qty.value = quantity; if (!qty.checkValidity()) qty.value = qty.min || '1'; }
      document.getElementById(focusId)?.focus({ preventScroll: true });
      const displayUrl = new URL(location.href);
      if (replacement.dataset.variantId) { displayUrl.searchParams.set('variant', replacement.dataset.variantId); displayUrl.searchParams.delete('option_values'); }
      else { displayUrl.searchParams.delete('variant'); displayUrl.searchParams.set('option_values', values); }
      if (plan) displayUrl.searchParams.set('selling_plan', plan); else displayUrl.searchParams.delete('selling_plan');
      history.replaceState({}, '', displayUrl);
      const price = replacement.querySelector('[data-product-price]')?.textContent.trim(); if (price) status(price);
    } catch (error) {
      if (error.name === 'AbortError') return;
      // The native server-rendered page is the recovery path; never submit a stale variant.
      url.searchParams.delete('section_id'); location.assign(url);
    } finally { if (section.isConnected && activeRequests.get(section) === controller) section.removeAttribute('aria-busy'); }
  });
  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!form.matches('[data-product-form]')) return;
    if (event.submitter && event.submitter.name !== 'add') return;
    if (!form.querySelector('button[name="add"]')) { event.preventDefault(); return; }
    event.preventDefault();
    if (cartBusy || form.closest('[aria-busy="true"]')) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    cartBusy = true;
    const button = form.querySelector('button[name="add"]'); button.disabled = true; button.setAttribute('aria-busy', 'true');
    const errorNode = form.querySelector('[data-product-error]'); errorNode.hidden = true;
    const data = new FormData(form); data.set('sections', 'cart-panel'); data.set('sections_url', location.pathname);
    try {
      const response = await fetch(`${root}cart/add.js`, { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(20000) : undefined });
      const result = await response.json();
      if (!response.ok || result.status) { const failure = new Error(result.description || result.message || config.error); failure.fromShopify = true; throw failure; }
      const html = result.sections?.['cart-panel'];
      if (!html) { location.assign(config.cart); return; }
      const doc = new DOMParser().parseFromString(html, 'text/html'); const newDialog = doc.getElementById('CartPanel');
      if (!newDialog || typeof newDialog.showModal !== 'function') { location.assign(config.cart); return; }
      const oldDialog = document.getElementById('CartPanel'); oldDialog?.replaceWith(newDialog);
      dialogTrigger = button; newDialog.showModal(); newDialog.querySelector('[data-dialog-close]')?.focus();
      newDialog.addEventListener('close', () => { dialogTrigger?.focus(); });
      newDialog.addEventListener('click', evt => { if (evt.target === newDialog) { const rect = newDialog.getBoundingClientRect(); if (evt.clientX < rect.left || evt.clientX > rect.right || evt.clientY < rect.top || evt.clientY > rect.bottom) closeDialog(newDialog); } });
      status(config.added);
      try {
        const cartResponse = await fetch(`${root}cart.js`, { headers: { Accept: 'application/json' } });
        if (cartResponse.ok) { const cart = await cartResponse.json(); document.querySelectorAll('[data-cart-count]').forEach(node => { node.textContent = String(cart.item_count); node.hidden = cart.item_count === 0; }); }
      } catch { /* The successful section response already contains the updated cart. */ }
    } catch (error) {
      errorNode.textContent = error.fromShopify ? error.message : config.error; errorNode.hidden = false;
      // A network failure can happen after a successful add. Don't retry automatically.
      status(errorNode.textContent);
    } finally { button.disabled = false; button.removeAttribute('aria-busy'); cartBusy = false; }
  });
  const contactSuccess = document.querySelector('[data-contact-success]'); if (contactSuccess) contactSuccess.focus();
  const query = new URLSearchParams(location.search);
  const quoteSummary = document.querySelector('[data-quote-summary]');
  if (quoteSummary && !quoteSummary.value && query.has('product')) {
    const handle = query.get('product'); const variant = query.get('variant');
    if (/^[a-z0-9-]+$/.test(handle) && (!variant || /^\d+$/.test(variant))) quoteSummary.value = `${location.origin}${root}products/${handle}${variant ? `?variant=${variant}` : ''}`;
  }
  enhanceProducts(); initializeModels(); renderQuotes();
  window.addEventListener('storage', event => { if (event.key === quoteKey) renderQuotes(); });
  document.addEventListener('shopify:section:load', event => { enhanceProducts(event.target); initializeModels(event.target); renderQuotes(); });
  document.addEventListener('shopify:section:unload', event => { event.target.querySelectorAll('[data-product-section]').forEach(section => activeRequests.get(section)?.abort()); });
})();
