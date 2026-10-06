import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..');const target=path.resolve(import.meta.dirname,'../migration');
const source=JSON.parse(await readFile(path.join(root,'data/site-snapshot.json')));
const assets=JSON.parse(await readFile(path.join(root,'data/deployment/assets.json')));
const releaseUrl='https://github.com/BaderAsad1/kepler-electronics/releases/download/source-assets-v1/';
const previewUrl='https://baderasad1.github.io/kepler-electronics';
const safeText=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const csv=v=>'"'+String(v??'').replaceAll('"','""')+'"';
const headers=['Handle','Title','Body (HTML)','Vendor','Type','Tags','Published','Option1 Name','Option1 Value','Variant SKU','Variant Inventory Tracker','Variant Inventory Qty','Variant Inventory Policy','Variant Fulfillment Service','Image Src','Image Position','Image Alt Text','Status'];
export const buildRows=(products)=>products.flatMap(p=>{
 if(!/^[a-z0-9-]+$/.test(p.slug)||!p.name)throw Error('Invalid product handle/title');
 if(p.price_minor!=null||p.stock!=null||p.mode!=='quote')throw Error(`Commercial review required: ${p.slug}`);
 const variants=p.variants.length?p.variants:[{sku:p.sku,name:'Default Title'}];
 return Array.from({length:Math.max(variants.length,p.media.length)},(_,i)=>{
  const v=variants[i];const image=p.media[i];const row={Handle:p.slug};
  if(i===0)Object.assign(row,{Title:p.name,'Body (HTML)':`<p>${safeText(p.description)}</p>`,Vendor:p.brand,Type:p.category,Tags:[...p.categories,'kepler-quote','source-review-pending'].join(', '),Published:'FALSE',Status:'draft'});
  if(v)Object.assign(row,{'Option1 Name':p.variants.length?'Model':'Title','Option1 Value':v.name||v.sku,'Variant SKU':v.sku||p.sku,'Variant Inventory Tracker':'shopify','Variant Inventory Qty':'0','Variant Inventory Policy':'deny','Variant Fulfillment Service':'manual'});
  if(image)Object.assign(row,{'Image Src':previewUrl+image.path,'Image Position':i+1,'Image Alt Text':image.alt?.trim()||p.name});
  return row;
 });
});
export async function exportCatalog(){
 const rows=buildRows(source.products);await mkdir(target,{recursive:true});
 const manifest={version:1,createdAt:new Date().toISOString(),sourceSha256:createHash('sha256').update(await readFile(path.join(root,'data/site-snapshot.json'))).digest('hex'),defaultStatus:'DRAFT',defaultMode:'quote',pricesApproved:false,inventoryApproved:false,products:source.products.map(p=>({handle:p.slug,title:p.name,status:'DRAFT',price:null,inventory:null,inventoryHold:{tracked:true,policy:'DENY',quantity:0,reason:'Operational block until commercial approval; not a source stock count'},variants:p.variants.length?p.variants.map(v=>({sku:v.sku,name:v.name,sourceSpecifications:v.specs})): [{sku:p.sku,name:'Default Title'}],metafields:[{namespace:'kepler',key:'commercial_mode',type:'single_line_text_field',value:'quote'},{namespace:'kepler',key:'source_url',type:'url',value:p.source_url},{namespace:'kepler',key:'specifications',type:'json',value:JSON.stringify(p.specs)},{namespace:'kepler',key:'documents',type:'json',value:JSON.stringify(p.downloads.map(d=>({label:d.alt,url:releaseUrl+d.path.split('/').pop()})))},{namespace:'kepler',key:'review_status',type:'single_line_text_field',value:p.review_status}],media:p.media.map(m=>({url:previewUrl+m.path,source:m.source,alt:m.alt,rights:'business-review-pending'}))})),pages:source.projects.map(p=>({handle:p.slug,title:p.name,body:`<p>${safeText(p.description)}</p>${p.media.map(m=>`<img src="${previewUrl+m.path}" alt="${safeText(m.alt)}" width="${m.width}" height="${m.height}">`).join('')}<p><a href="${safeText(p.source_url)}">Original source reference</a></p>`,published:false,reviewStatus:p.review_status})),content:source.content.map(p=>({handle:p.slug,title:p.title,body:`<p>${safeText(p.body)}</p>`,published:false,kind:p.kind,reviewStatus:p.review_status})),documents:assets.documents.length};
 await writeFile(path.join(target,'products-draft.csv'),headers.map(csv).join(',')+'\n'+rows.map(row=>headers.map(key=>csv(row[key])).join(',')).join('\n')+'\n');
 await writeFile(path.join(target,'content-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const defs=[{name:'Commercial mode',namespace:'kepler',key:'commercial_mode',type:'single_line_text_field',ownerType:'PRODUCT',access:{storefront:'PUBLIC_READ'},validations:[{name:'choices',value:'["quote","buy"]'}]},...['source_url','specifications','documents','review_status'].map(key=>({name:key.replaceAll('_',' '),namespace:'kepler',key,type:key==='source_url'?'url':['specifications','documents'].includes(key)?'json':'single_line_text_field',ownerType:'PRODUCT',access:{storefront:'PUBLIC_READ'}}))];
 await writeFile(path.join(target,'metafield-definitions.json'),JSON.stringify(defs,null,2)+'\n');
 return {products:manifest.products.length,variants:manifest.products.reduce((a,p)=>a+p.variants.length,0),projects:manifest.pages.length,content:manifest.content.length,csvRows:rows.length};
}
if(process.argv[1]===new URL(import.meta.url).pathname)process.stdout.write(JSON.stringify(await exportCatalog())+'\n');
