import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile,readdir,stat } from 'node:fs/promises';
import path from 'node:path';
import { themePath,renderPage } from '../renderer.mjs';
import { scope,buyProduct,products,variantProduct } from '../fixtures.mjs';
import { buildRows } from '../export-catalog.mjs';
const url=new URL('http://127.0.0.1:4174');
test('Every JSON template points to real section files and ordered blocks',async()=>{
 for(const file of await readdir(path.join(themePath,'templates'))){if(!file.endsWith('.json'))continue;const template=JSON.parse(await readFile(path.join(themePath,'templates',file)));assert.ok(template.order.length>0&&template.order.length<=25);for(const id of template.order){const section=template.sections[id];assert.ok(section);await stat(path.join(themePath,'sections',section.type+'.liquid'));for(const block of section.block_order||[])assert.ok(section.blocks[block]);}}
});
test('All storefront translations have the same keys',async()=>{
 const keys=(v,p='')=>Object.entries(v).flatMap(([k,val])=>typeof val==='object'?keys(val,p+k+'.'):[p+k]);
 const en=JSON.parse(await readFile(path.join(themePath,'locales/en.default.json')));const ar=JSON.parse(await readFile(path.join(themePath,'locales/ar.json')));assert.deepEqual(keys(en),keys(ar));
});
test('Unknown and quote-only products do not expose buy buttons or zero-price offers',async()=>{
 const data=scope(url);data.product=products[0];data.request.page_type='product';const html=await renderPage('product',data);assert.doesNotMatch(html,/name="add"|name="checkout"|"offers"|0\.00 AED/);assert.match(html,/Price on request/);
 data.product=buyProduct;data.settings.enable_commerce=false;const disabled=await renderPage('product',data);assert.doesNotMatch(disabled,/name="add"|name="checkout"/);
});
test('Approved buy products use native Shopify variant, quantity and product forms',async()=>{
 const data=scope(url);data.product=buyProduct;data.request.page_type='product';const html=await renderPage('product',data);assert.match(html,/action="\/cart\/add"/);assert.match(html,/name="quantity"/);assert.match(html,/name="id"/);assert.match(html,/name="add"/);assert.match(html,/1499\.00 AED/);
 const sold=variantProduct(buyProduct,new URLSearchParams('variant=900003'));data.product=sold;assert.match(await renderPage('product',data),/name="add" disabled/);
});
test('A selected variant beyond Shopify’s variants array remains the submitted variant',async()=>{
 const data=scope(url);const current=buyProduct.variants[5];data.product={...buyProduct,variants:[buyProduct.variants[0]],selected_or_first_available_variant:current};const html=await renderPage('product',data);assert.match(html,new RegExp(`name="id" value="${current.id}"`));
});
test('A stale quote-only cart blocks theme checkout',async()=>{
 const data=scope(url,{items:[{key:'quote:one',product:products[0],variant:products[0].variants[0],quantity:1,properties:{},line_level_discount_allocations:[],url:products[0].url}],item_count:1,total_price:0});const html=await renderPage('cart',data);assert.doesNotMatch(html,/name="checkout"/);assert.match(html,/Remove quote-only products/);
});
test('Cart surfaces native line errors, minimum/increment rules, and retained optional notes',async()=>{
 const variant={...buyProduct.variants[0],quantity_rule:{min:5,max:100,increment:5}};
 const data=scope(url,{items:[{key:'buy:one',product:buyProduct,variant,quantity:5,error_message:'Available quantity changed.',properties:{},line_level_discount_allocations:[],url:buyProduct.url}],item_count:5,total_price:749500,note:'Deliver to project office'});
 const html=await renderPage('cart',data);assert.match(html,/Available quantity changed/);assert.match(html,/min="5"/);assert.match(html,/step="5"/);assert.match(html,/max="100"/);assert.match(html,/Minimum 5/);assert.match(html,/class="cart-note" open/);assert.match(html,/Deliver to project office/);
});
test('Quote forms preserve returned customer input and only confirm a successful Shopify submission',async()=>{
 const data=scope(url);data.page={title:'Project quotation',content:''};data.request.page_type='page';
 let html=await renderPage('page.project-quote',data);assert.doesNotMatch(html,/data-contact-success/);assert.match(html,/Please confirm pricing and availability/);
 data.form={errors:{email:'Invalid email'},name:'Customer',email:'bad-email',body:'My own requirements',phone:'+971 50 123 4567',Project:'My villa','Project list':'2 × MY-MODEL'};
 html=await renderPage('page.project-quote',data);assert.match(html,/My own requirements/);assert.match(html,/2 × MY-MODEL/);assert.match(html,/value="My villa"/);assert.doesNotMatch(html,/Please confirm pricing and availability|data-contact-success/);
 data.form={...data.form,errors:null,'posted_successfully?':true};html=await renderPage('page.project-quote',data);assert.match(html,/data-contact-success/);
});
test('Import staging preserves unknown prices and intentionally blocks inventory',()=>{
 const p={slug:'model-one',name:'Model one',description:'<Source> & exact',brand:'Brand',category:'control',categories:['control'],mode:'quote',price_minor:null,stock:null,variants:[{sku:'EXACT-1',name:'EXACT-1'},{sku:'EXACT-2',name:'EXACT-2'}],media:[]};const rows=buildRows([p]);assert.equal(rows.length,2);assert.equal(rows[0].Status,'draft');assert.equal(rows[0].Published,'FALSE');assert.equal(rows[0]['Variant Inventory Policy'],'deny');assert.equal(rows[0]['Variant Inventory Qty'],'0');assert.equal(rows[1]['Variant SKU'],'EXACT-2');assert.equal(rows[0]['Variant Price'],undefined);assert.ok(rows[0]['Body (HTML)'].includes('&lt;Source&gt; &amp; exact'));assert.throws(()=>buildRows([{...p,price_minor:100}]),/Commercial review/);
});
