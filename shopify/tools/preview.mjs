// Local rendering and API fixtures for UI tests. This is not a Shopify storefront.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { renderPage, renderSection, themePath, repoPath } from './renderer.mjs';
import { products, buyProduct, scope, variantProduct } from './fixtures.mjs';
const sessions=new Map();
const notice='<div style="padding:9px 18px;background:#e5d7bc;color:#111;font:12px/1.5 Arial;text-align:center">LOCAL THEME PREVIEW · Sample store data · Checkout and enquiries require a Shopify store</div>';
const mimetypes={'.css':'text/css','.js':'text/javascript','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.pdf':'application/pdf'};
export async function startPreview(port=4174){
 const server=createServer(async(req,res)=>{
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  let sid=req.headers.cookie?.match(/fixture_session=([a-z0-9]+)/)?.[1];if(!sid){sid=Math.random().toString(36).slice(2);res.setHeader('Set-Cookie',`fixture_session=${sid}; SameSite=Lax; Path=/`);}if(!sessions.has(sid))sessions.set(sid,{items:[],item_count:0,total_price:0,note:''});const cart=sessions.get(sid);
  const send=(status,body,type='text/html; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body)};
  try{
   if(url.pathname.startsWith('/assets/')||url.pathname.startsWith('/media/')){
    const asset=url.pathname.startsWith('/assets/')?path.join(themePath,url.pathname.slice(1)):path.join(repoPath,'public',url.pathname);
    const allowed=url.pathname.startsWith('/assets/')?path.join(themePath,'assets'):path.join(repoPath,'public/media');
    if(!path.resolve(asset).startsWith(allowed+path.sep))return send(403,'Forbidden');
    return send(200,await readFile(asset),mimetypes[path.extname(asset)]||'application/octet-stream');
   }
   let data=scope(url,cart);let template='index';
   if(req.method==='POST'&&url.pathname==='/cart/add.js'){
    const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks).toString();const field=name=>body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]+)`))?.[1];
    const variant=buyProduct.variants.find(v=>v.id===field('id'));const quantity=Number(field('quantity')||1);
    if(!variant?.available||!Number.isInteger(quantity)||quantity<1||quantity>10)return send(422,JSON.stringify({status:422,description:'Fixture stock is unavailable.'}),'application/json');
    const key=variant.id+':fixture';let line=cart.items.find(i=>i.key===key);
    if(line){line.quantity+=quantity;line.final_line_price=line.quantity*variant.price;line.original_line_price=line.final_line_price;}else{line={key,quantity,product:buyProduct,variant,image:buyProduct.featured_image,url:buyProduct.url,properties:{},line_level_discount_allocations:[],original_line_price:quantity*variant.price,final_line_price:quantity*variant.price};cart.items.push(line);}
    cart.item_count=cart.items.reduce((a,i)=>a+i.quantity,0);cart.total_price=cart.items.reduce((a,i)=>a+i.final_line_price,0);data=scope(url,cart);
    const section=await renderSection('cart-panel','cart-panel',{},data);return send(200,JSON.stringify({items:[line],sections:{'cart-panel':section}}),'application/json');
   }
   if(url.pathname==='/cart.js')return send(200,JSON.stringify(cart),'application/json');
   if(req.method==='POST')return send(501,'<h1>Store connection required</h1><p>This preview does not send enquiries, create orders or process payments.</p>');
   if(url.pathname.startsWith('/products/')){
    const handle=url.pathname.split('/')[2];const p=handle===buyProduct.handle?buyProduct:products.find(p=>p.handle===handle);if(!p){template='404';res.statusCode=404;}else{data.product=variantProduct(p,url.searchParams);data.request.page_type='product';data.page_title=p.title;template='product';}
   }else if(url.pathname.startsWith('/collections/')){
    data.collection={...data.collections.all,sort_by:url.searchParams.get('sort_by')||'manual'};if(data.collection.sort_by==='title-ascending')data.collection.products=[...products].sort((a,b)=>a.title.localeCompare(b.title));
    data.request.page_type='collection';data.page_title='Products';template='collection';
   }else if(url.pathname==='/search'){
    const terms=url.searchParams.get('q')||'';const results=products.filter(p=>(p.title+p.variants.map(v=>v.sku).join()).toLowerCase().includes(terms.toLowerCase())).map(p=>({...p,object_type:'product'}));
    data.search={performed:!!terms,terms,results,results_count:results.length,filters:[],sort_options:[{name:'Relevance',value:'relevance'}],default_sort_by:'relevance'};data.request.page_type='search';template='search';
   }else if(url.pathname==='/cart'){data.request.page_type='cart';template='cart';}
   else if(url.pathname.startsWith('/pages/')){
    const handle=url.pathname.split('/')[2];data.request.page_type='page';data.page={title:handle==='project-quote'?'Your project specification.':handle==='contact'?'Tell us what your space needs to do.':handle.replaceAll('-',' '),content:''};data.page_title=data.page.title;template=handle==='project-quote'?'page.project-quote':handle==='contact'?'page.contact':'page';
   }else if(url.pathname==='/password'){template='password';data.shop.password_message='Shopify theme preview.';}
   else if(url.pathname!=='/'){template='404';data.request.page_type='404';res.statusCode=404;}
   if(url.searchParams.has('section_id'))return send(200,await renderSection('main-product',url.searchParams.get('section_id'),{},data));
   const html=await renderPage(template,data);send(res.statusCode||200,html.replace('<body','<body').replace(/(<body[^>]*>)/,'$1'+notice));
  }catch(error){process.stderr.write(error.stack+'\n');send(500,'Theme fixture render failed: '+String(error.message).replace(/[<>]/g,''));}
 });
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));return server;
}
if(process.argv[1]===new URL(import.meta.url).pathname){await startPreview();process.stdout.write('Local Liquid preview: http://127.0.0.1:4174\n');}
