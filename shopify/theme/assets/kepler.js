(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('KeplerConfig')?.textContent || '{}');
  const status = (text) => { const node = document.getElementById('KeplerStatus'); if (node) { node.textContent = text; node.classList.add('visible'); clearTimeout(status.timer); status.timer = setTimeout(() => node.classList.remove('visible'), 6000); } };
  const root = (config.root || '/').replace(/\/?$/, '/');
  const quoteKey = 'kepler:project-list:v1';
  const quoteState = { storageFailed: false };
  const readQuotes = () => {
    try {
      const data = JSON.parse(localStorage.getItem(quoteKey) || '[]');
      if (!Array.isArray(data)) return [];
      return data.filter(item => item && typeof item.handle === 'string' && /^[a-z0-9-]+$/.test(item.handle) && typeof item.variant === 'string' && /^\d*$/.test(item.variant) && typeof item.title === 'string' && typeof item.model === 'string' && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 9999).slice(0, 50);
    } catch { quoteState.storageFailed = true; return []; }
  };

  const updateQuoteCount = () => {
    const count = readQuotes().length;
    document.querySelectorAll('[data-quote-count]').forEach(node => { node.textContent = String(count); node.hidden = count === 0; });
  };
  window.KeplerTheme = { config, root, status, quoteKey, quoteState, readQuotes };
  let quotesModule;
  let productModule;
  const loadQuotes = () => quotesModule || (quotesModule = import(config.quoteScript).catch(error => { quotesModule = undefined; throw error; }));
  const loadProduct = () => productModule || (productModule = import(config.productScript).catch(error => { productModule = undefined; throw error; }));
  document.addEventListener('click', event => {
    const quote = event.target.closest('[data-quote-add]');
    if (quote) {
      event.preventDefault();
      if (quote.getAttribute('aria-disabled') === 'true' || quote.getAttribute('aria-busy') === 'true') return;
      quote.setAttribute('aria-busy', 'true');
      loadQuotes().then(module => module.add(quote)).catch(() => { location.assign(quote.href); }).finally(() => quote.removeAttribute('aria-busy'));
    }
    const menu = event.target.closest('.mobile-menu nav a'); if (menu) menu.closest('details').open = false;
    document.querySelectorAll('.nav-submenu[open], .mobile-menu[open]').forEach(details => { if (!details.contains(event.target)) details.open = false; });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.querySelectorAll('.nav-submenu[open], .mobile-menu[open]').forEach(details => { details.open = false; details.querySelector('summary')?.focus(); });
  });

  const initialize = (scope = document) => {
    updateQuoteCount();
    if (scope.querySelector('[data-product-section]')) loadProduct().then(module => module.initialize(scope)).catch(() => { /* Native product forms remain available. */ });
    if (document.querySelector('[data-quote-list]')) loadQuotes().then(module => module.initialize()).catch(() => { /* Native contact forms remain available. */ });
  };
  const contactSuccess = document.querySelector('[data-contact-success]'); if (contactSuccess) contactSuccess.focus();
  initialize();
  window.addEventListener('storage', event => { if (event.key === quoteKey) { updateQuoteCount(); if (quotesModule) quotesModule.then(module => module.renderQuotes()).catch(() => {}); } });
  document.addEventListener('shopify:section:load', event => initialize(event.target));
  document.addEventListener('shopify:section:unload', event => { if (productModule) productModule.then(module => module.dispose(event.target)).catch(() => {}); });
})();
