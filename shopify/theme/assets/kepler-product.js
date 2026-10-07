'use strict';
const { config, root, status } = window.KeplerTheme;
const activeRequests = new WeakMap();
let cartBusy = false;
let dialogTrigger = null;
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

document.addEventListener('click', event => {
    const thumbnail = event.target.closest('[data-media-select]');
    if (thumbnail) {
      const section = thumbnail.closest('[data-product-section]');
      const selected = document.getElementById(thumbnail.hash.slice(1));
      const feature = section?.querySelector('.media-feature');
      if (selected && feature) { event.preventDefault(); feature.querySelectorAll('video').forEach(video => video.pause()); feature.replaceChildren(...[...selected.childNodes].map(node => node.cloneNode(true))); feature.querySelectorAll('img').forEach(img => { img.loading = 'eager'; }); section.querySelectorAll('[data-media-select]').forEach(link => link.removeAttribute('aria-current')); thumbnail.setAttribute('aria-current', 'true'); initializeModels(feature); }
    }
    const close = event.target.closest('[data-dialog-close]');
    if (close) { closeDialog(close.closest('dialog')); return; }
});
  document.addEventListener('change', async event => {
    if (!event.target.matches('[data-option-value], [name="selling_plan"]')) return;
    const section = event.target.closest('[data-product-section]'); if (!section) return;
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
    const button = event.submitter || form.querySelector('button[name="add"]');
    const controls = [...form.closest('[data-product-section]').querySelectorAll('button[name="add"]')];
    const originalDisabled = controls.map(control => control.disabled);
    controls.forEach(control => { control.disabled = true; control.setAttribute('aria-busy', 'true'); });
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
      const count = Number(newDialog.dataset.cartItemCount);
      if (Number.isInteger(count) && count >= 0) document.querySelectorAll('[data-cart-count]').forEach(node => { node.textContent = String(count); node.hidden = count === 0; });
    } catch (error) {
      errorNode.textContent = error.fromShopify ? error.message : config.error; errorNode.hidden = false;
      // A network failure can happen after a successful add. Don't retry automatically.
      status(errorNode.textContent);
    } finally { controls.forEach((control, index) => { control.disabled = originalDisabled[index]; control.removeAttribute('aria-busy'); }); cartBusy = false; }
  });

export function initialize(scope = document) { enhanceProducts(scope); initializeModels(scope); }
export function dispose(scope) { scope.querySelectorAll('[data-product-section]').forEach(section => activeRequests.get(section)?.abort()); }
