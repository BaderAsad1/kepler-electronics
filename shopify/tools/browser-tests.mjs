import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import path from 'node:path';
import { startPreview } from './preview.mjs';
import { products } from './fixtures.mjs';
const port=4175;const server=await startPreview(port);const base=`http://127.0.0.1:${port}`;const out=path.resolve(import.meta.dirname,'../reports');await mkdir(path.join(out,'screenshots'),{recursive:true});
const browser=await chromium.launch({channel:process.env.CI ? undefined : 'chrome',headless:true});const results=[];
const run=async(name,fn)=>{const start=Date.now();try{await fn();results.push({name,passed:true,durationMs:Date.now()-start});process.stdout.write(`PASS ${name}\n`);}catch(error){results.push({name,passed:false,error:error.message});process.stderr.write(`FAIL ${name}: ${error.stack}\n`);}};
try{
 await run('Responsive home, collection, product, quote and cart render without overflow or missing images',async()=>{
  for(const width of [320,390,768,1440]){
   const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const [name,route] of [['home','/'],['collection','/collections/all'],['product',products[0].url],['quote','/pages/project-quote'],['cart','/cart']]){
    const response=await page.goto(base+route);assert.equal(response.status(),200);await page.waitForLoadState('networkidle');
    await page.evaluate(()=>document.querySelectorAll('img[loading=lazy]').forEach(img=>img.loading='eager'));
    await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
    const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,broken:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src),h1:document.querySelectorAll('h1').length}));assert.equal(state.overflow,false,`${name} ${width} overflow`);assert.deepEqual(state.broken,[]);assert.equal(state.h1,1);assert.deepEqual(errors,[]);
    if([390,1440].includes(width))await page.screenshot({path:path.join(out,'screenshots',`${name}-${width}.png`),fullPage:true});
   }await context.close();
  }
 });
 await run('Automated WCAG A/AA checks on main storefront templates',async()=>{
  const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();
  for(const route of ['/',products[0].url,'/collections/all','/pages/project-quote','/cart','/search?q=LPAD']){
   await page.goto(base+route);const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();assert.deepEqual(scan.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],route);
  }await context.close();
 });
 await run('Variant selection replaces SKU, price and URL; unavailable variant cannot be added',async()=>{
  const context=await browser.newContext();const page=await context.newPage();await page.goto(base+'/products/fixture-buy-product');await page.locator('[data-option-value]').selectOption('2');await page.waitForURL('**?variant=900002');assert.equal(await page.locator('[data-product-sku]').textContent(),'TEST-2');assert.match(await page.locator('[data-product-price]').textContent(),/1599\.00 AED/);await page.locator('[data-option-value]').selectOption('3');await page.waitForURL('**?variant=900003');assert.equal(await page.locator('button[name=add]').isDisabled(),true);await context.close();
 });
 await run('Cart drawer uses native checkout, Escape restores focus and repeated adds are serialized',async()=>{
  const context=await browser.newContext();const page=await context.newPage();await page.goto(base+'/products/fixture-buy-product');let addRequests=0;page.on('request',r=>{if(r.url().endsWith('/cart/add.js'))addRequests++;});const add=page.locator('button[name=add]');await page.locator('[data-product-form]').evaluate(form=>{const button=form.querySelector('button[name=add]');form.requestSubmit(button);form.requestSubmit(button);});await page.locator('#CartPanel').waitFor({state:'visible'});assert.equal(await page.locator('#CartPanel button[name=checkout]').count(),1);assert.equal(await page.locator('#CartPanel form').getAttribute('action'),'/cart');await page.keyboard.press('Escape');await page.waitForTimeout(100);assert.equal(await add.evaluate(el=>el===document.activeElement),true);assert.equal(await page.locator('[data-cart-count]').textContent(),'1');assert.equal(addRequests,1);await context.close();
 });
 await run('Server cart errors are visible and do not announce success',async()=>{
  const context=await browser.newContext();const page=await context.newPage();await page.route('**/cart/add.js',route=>route.fulfill({status:422,contentType:'application/json',body:JSON.stringify({status:422,description:'Stock changed. Please choose a lower quantity.'})}));await page.goto(base+'/products/fixture-buy-product');await page.locator('button[name=add]').click();await page.locator('[data-product-error]').waitFor({state:'visible'});assert.match(await page.locator('[data-product-error]').textContent(),/Stock changed/);assert.equal(await page.locator('#CartPanel').isVisible(),false);assert.equal(await page.locator('button[name=add]').isEnabled(),true);await context.close();
 });
 await run('Quote list persists, selects exact model and carries quantity into native contact form',async()=>{
  const context=await browser.newContext();const page=await context.newPage();await page.goto(base+products[0].url);await page.locator('[data-option-value]').selectOption('2');await page.waitForURL(/variant=/);await page.locator('[data-quote-add]').click();await page.goto(base+'/pages/project-quote');assert.equal(await page.locator('.quote-line').count(),1);const input=page.locator('.quote-line input');await input.fill('3');await input.dispatchEvent('change');assert.match(await page.locator('[data-quote-summary]').inputValue(),/3 ×.*\| LPAD7-30G3/s);assert.equal(await page.locator('form').filter({has:page.locator('[data-quote-summary]')}).getAttribute('action'),'/contact');await page.reload();assert.equal(await page.locator('.quote-line input').inputValue(),'3');await context.close();
 });
 await run('Media thumbnails select a photograph without moving the product information',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();await page.goto(base+products[0].url);const original=await page.locator('.media-feature img').getAttribute('src');await page.locator('[data-media-select]').nth(1).click();const next=await page.locator('.media-feature img').getAttribute('src');assert.notEqual(next,original);assert.equal(await page.locator('.more-media').getAttribute('open'),null);assert.ok((await page.locator('.product-information h1').boundingBox()).y<1000);await context.close();
 });
 await run('No JavaScript: variant selection, purchase, filters and enquiry remain native forms',async()=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto(base+'/products/fixture-buy-product');assert.equal(await page.locator('[data-product-form]').getAttribute('action'),'/cart/add');assert.equal(await page.locator('button[name=add]').isEnabled(),true);assert.equal(await page.locator('noscript form select[name=variant]').isVisible(),true);await page.goto(base+'/collections/all');assert.equal(await page.locator('form.facets').getAttribute('method'),'get');await page.goto(base+'/pages/contact');assert.equal(await page.locator('form').filter({has:page.locator('input[name="contact[email]"]')}).getAttribute('method'),'post');await context.close();
 });
 await run('Arabic locale changes chrome and direction without overflow',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();await page.goto(base+'/pages/project-quote?lang=ar');assert.equal(await page.locator('html').getAttribute('dir'),'rtl');assert.equal(await page.locator('label[for^=Email]').textContent(),'البريد الإلكتروني');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.screenshot({path:path.join(out,'screenshots','quote-ar-390.png'),fullPage:true});await context.close();
 });
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));await writeFile(path.join(out,'browser-tests.json'),JSON.stringify({testedAt:new Date().toISOString(),environment:'Local LiquidJS rendering with explicit Shopify API fixtures; Chrome; not live Shopify verification',results},null,2));}
if(results.some(r=>!r.passed))process.exitCode=1;
