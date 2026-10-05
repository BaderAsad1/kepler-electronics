import 'dotenv/config';
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root='https://kepler-elec.com';
const dir='data/source';await mkdir(dir,{recursive:true});await mkdir('public/media',{recursive:true});await mkdir('docs/screenshots/source',{recursive:true});
const limit=Number(process.env.MIGRATION_LIMIT||900),delay=Number(process.env.MIGRATION_DELAY_MS||650);
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const exists=async(p:string)=>access(p).then(()=>true,()=>false);
type Snapshot={url:string;canonical:string;id:string;title:string;html:string;text:string;categories:string[];tags:string[];assets:{source:string;alt:string;kind:string;path?:string;status?:number}[];internalLinks:string[];specs:Record<string,string>;sku:string|null;brand:string|null;status:number;fetchedAt:string;hash:string;screenshot:string|null;visualStatus:string;reviewFlags:string[]};
let snaps:Snapshot[]=await readFile(dir+'/snapshots.json','utf8').then(JSON.parse,()=>[]);const done=new Set(snaps.filter(x=>x.status===200).map(x=>x.url));
const available:Record<string,{status:number;text:string}>={};
try {
 await page.goto(root,{waitUntil:'domcontentloaded',timeout:30000});
 for(const p of ['wp-json/wp/v2/posts?per_page=1','sitemap_index.xml','post-sitemap.xml','page-sitemap.xml','product-sitemap.xml','category-sitemap.xml','post_tag-sitemap.xml','product_brand-sitemap.xml','product_cat-sitemap.xml','product_tag-sitemap.xml']){
  available[p]=await page.evaluate(async(p)=>{const r=await fetch('/'+p);return {status:r.status,text:await r.text()};},p);await page.waitForTimeout(delay);
 }
 await writeFile(dir+'/sitemaps.json',JSON.stringify(available,null,2));
 const fromSitemap=Object.entries(available).filter(([k,v])=>k.endsWith('sitemap.xml')&&v.status===200).flatMap(([,v])=>[...v.text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]));
 const priority=[root+'/',root+'/contact-us/',root+'/2023/11/30/ked-m098/',root+'/2024/04/20/kepler-electronics-company-profile/',root+'/products/',...fromSitemap.filter(u=>/lpad|mama|marriott|lroc|l-roc|lvis|l-vis|kzig/.test(u)).slice(0,14)];
 const queue=[...new Set([...priority,...fromSitemap])].filter(u=>!u.endsWith('.xml'));
 const scheduled=new Set(queue);let processed=0;
 await writeFile(dir+'/discovery.json',JSON.stringify({startedAt:new Date().toISOString(),endpoints:Object.fromEntries(Object.entries(available).map(([k,v])=>[k,v.status])),urls:queue},null,2));
 for(let i=0;i<queue.length && processed<limit;i++){
  const url=queue[i];if(done.has(url))continue;
  if(!url.startsWith(root)||/wp-login|wp-admin|add-to-cart|\?|feed\/|cart\/|checkout\//.test(url))continue;
  processed++;
  let snap:Snapshot;
  try{
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});const status=response?.status()||0;
   const extracted=await page.evaluate(()=>{
    const d=document;const article=d.querySelector('article.single-entry')||d.querySelector('.product.type-product')||d.querySelector('main');
    const entry=article?.querySelector('.entry-content')||article?.querySelector('.woocommerce-Tabs-panel--description')||article;
    const container=entry?.cloneNode(true) as Element|undefined;container?.querySelectorAll('script,style,iframe,form,.entry-related,.comments-area,.post-navigation,.entry-meta').forEach(e=>e.remove());
    const woo=d.querySelector('.product.type-product');
    const dataRoot=woo||entry;
    const images=[...(dataRoot?.querySelectorAll('img')||[])].map(i=>({source:i.getAttribute('data-large_image')||i.getAttribute('data-src')||i.getAttribute('src')||'',alt:i.getAttribute('alt')||'',kind:'image'})).filter(i=>i.source.startsWith('https://kepler-elec.com/wp-content/uploads/'));
    const docs=[...(dataRoot?.querySelectorAll('a[href]')||[])].map(a=>({source:(a as HTMLAnchorElement).href,alt:a.textContent?.trim()||'Technical document',kind:'download'})).filter(a=>/\.(pdf|docx?|xlsx?|zip)(\?|$)/i.test(a.source));
    if(location.pathname==='/')images.push(...[...d.querySelectorAll('.custom-logo')].map(i=>({source:(i as HTMLImageElement).src,alt:'Kepler Electronics logo',kind:'logo'})));
    const specs:Record<string,string>={};dataRoot?.querySelectorAll('table tr').forEach(tr=>{const cells=[...tr.querySelectorAll('th,td')].map(x=>x.textContent?.trim()||'');if(cells.length===2&&cells[0]&&cells[1])specs[cells[0]]=cells[1];});
    const classes=(article?.className||'').split(/\s/);const categoryLinks=[...d.querySelectorAll('.kadence-breadcrumb-container a,.posted_in a')].map(a=>a.getAttribute('href')||'').filter(u=>u.includes('category/'));
    const categories=[...new Set([...classes.filter(x=>x.startsWith('category-')).map(x=>x.slice(9)),...categoryLinks.flatMap(u=>u.split('/category/')[1]?.split('/').filter(Boolean)||[])])];
    const tags=[...d.querySelectorAll('a[rel="tag"],.tagged_as a')].map(a=>a.textContent?.replace(/^#/,'').trim()||'');
    return {canonical:d.querySelector('link[rel="canonical"]')?.getAttribute('href')||location.href,id:article?.id||'',title:d.querySelector('h1')?.textContent?.trim()||d.title.replace(/ - Kepler Electronics$/,''),html:container?.outerHTML||'',text:[woo?.querySelector('.woocommerce-product-details__short-description')?.textContent,container?.textContent].filter(Boolean).join('\n').replace(/\s+/g,' ').trim(),categories,tags,assets:[...new Map([...images,...docs].map(a=>[a.source,a])).values()],internalLinks:[...new Set([...d.querySelectorAll('a[href]')].map(a=>(a as HTMLAnchorElement).href).filter(u=>u.startsWith('https://kepler-elec.com/')))],specs,sku:woo?.querySelector('.sku')?.textContent?.trim()||null,brand:woo?.querySelector('.posted_in a[href*="brand"],.product_brand a')?.textContent?.trim()||null};
   });
   snap={url,...extracted,status,fetchedAt:new Date().toISOString(),hash:hash(extracted.html),screenshot:null,visualStatus:'not-inspected',reviewFlags:['business-review-pending','asset-rights-review-pending']};
   if(status===200){
    for(const asset of snap.assets){
     const ext=path.extname(new URL(asset.source).pathname).toLowerCase();const destination='public/media/'+hash(asset.source).slice(0,16)+ext;asset.path=destination.replace(/^public/,'');
     if(!await exists(destination)){
      try{const res=await context.request.get(asset.source,{timeout:25000});asset.status=res.status();if(res.ok()){const buffer=await res.body();if(buffer.length<25*1024*1024)await writeFile(destination,buffer);else snap.reviewFlags.push('asset-over-size-limit:'+asset.source);}else asset.path=undefined;}catch{asset.path=undefined;snap.reviewFlags.push('asset-unreachable:'+asset.source);}
     }else asset.status=200;
    }
    await page.waitForTimeout(350);
    const screenshot='docs/screenshots/source/'+hash(url).slice(0,16)+'.jpg';
    await page.screenshot({path:screenshot,fullPage:true,type:'jpeg',quality:62,timeout:15000}).then(()=>{snap.screenshot=screenshot;snap.visualStatus='captured-not-reviewed';},()=>snap.reviewFlags.push('screenshot-unavailable'));
    for(const link of snap.internalLinks){const normalized=link.split('#')[0];if(!scheduled.has(normalized)&&!/[?]|wp-login|wp-admin|feed\/|\.pdf$/.test(normalized)&&(/\/page\/\d+\//.test(normalized)||/^https:\/\/kepler-elec.com\/\d{4}\/\d{2}\/\d{2}\//.test(normalized))){queue.push(normalized);scheduled.add(normalized);}}
    done.add(url);
   }
  }catch(e){snap={url,canonical:url,id:'',title:'',html:'',text:'',categories:[],tags:[],assets:[],internalLinks:[],specs:{},sku:null,brand:null,status:0,fetchedAt:new Date().toISOString(),hash:'',screenshot:null,visualStatus:'unavailable',reviewFlags:[String(e)]};}
  snaps=snaps.filter(x=>x.url!==url);snaps.push(snap);
  await writeFile(dir+'/snapshots.json',JSON.stringify(snaps,null,2));
  console.log(`${processed} / queue ${queue.length}: ${snap.status} ${snap.title||url} (${snap.assets.filter(a=>a.path).length} assets)`);
  await page.waitForTimeout(delay);
 }
 await writeFile(dir+'/discovery.json',JSON.stringify({finishedAt:new Date().toISOString(),endpoints:Object.fromEntries(Object.entries(available).map(([k,v])=>[k,v.status])),urls:queue},null,2));
 console.log(`Saved ${snaps.length} source snapshots. Captures are not visual approval.`);
}finally{await browser.close();}
