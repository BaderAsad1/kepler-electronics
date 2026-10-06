import { readFile,writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');const folder=path.resolve(import.meta.dirname,'../migration');
const snapshot=JSON.parse(await readFile(path.join(root,'data/site-snapshot.json')));
const redirects=JSON.parse(await readFile(path.join(root,'data/migration/redirects.json')));
const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const csv=v=>'"'+String(v).replaceAll('"','""')+'"';
const pages=[
{handle:'contact',title:'Tell us what your space needs to do.',template:'contact',body:'',published:false},
{handle:'project-quote',title:'Your project specification.',template:'project-quote',body:'',published:false},
{handle:'solutions',title:'Solutions for intelligent spaces.',template:'',body:'<p>Explore home automation, building management, lighting control and guest room management.</p><ul>'+['home-automation','building-management','lighting-control','guest-room-management'].map(handle=>`<li><a href="/pages/${handle}">${handle.replaceAll('-',' ')}</a></li>`).join('')+'</ul>',published:false},
{handle:'about',title:'Kepler Electronics',template:'',body:'<p>Kepler Electronics for Control Systems LLC is based in Dubai, UAE. Explore our smart-building and home-automation catalogue or discuss your specification with our Dubai team.</p><p><a href="/pages/contact">Contact Kepler</a></p>',published:false},
{handle:'projects',title:'Source-listed project references',template:'',body:'<p>Explore project references listed on the original Kepler website. Confirm project scope with our team.</p><ul>'+snapshot.projects.map(p=>`<li><a href="/pages/${p.slug}">${esc(p.name)}</a></li>`).join('')+'</ul>',published:false},
{handle:'resources',title:'Technical resources',template:'',body:'<p>Find original source documents on the corresponding product page. Confirm the exact model, manufacturer revision and compatibility before specifying equipment.</p><p><a href="/collections/all">Explore products and technical documents</a></p>',published:false},
{handle:'loytec',title:'LOYTEC technology',template:'',body:'<p>Explore source-listed LOYTEC controls, panels, automation servers and connectivity products.</p><p><a href="/collections/all?filter.p.vendor=LOYTEC">Explore LOYTEC products</a></p>',published:false},
{handle:'purchase-information',title:'Purchase information',template:'',body:'<p>Pricing and availability require confirmation from Kepler. Discuss your exact model and specification with our team. Approved store policies must be added in Shopify Admin before online shopping is enabled.</p>',published:false}
];
const solutions=(await readFile(path.join(root,'lib/solutions.ts'),'utf8')).matchAll(/slug:'([^']+)'.*?name:'([^']+)'.*?description:'([^']+)'.*?detail:'([^']+)'.*?source:'([^']+)'/g);
for(const [,handle,title,description,detail,source] of solutions)pages.push({handle,title,template:'',body:`<p>${esc(description)}</p><p>${esc(detail)}</p><p><a href="/pages/project-quote">Discuss your specification</a></p><p><a href="${esc(source)}">Original source category</a></p>`,published:false});
const mapped=p=>{
 if(p.startsWith('/products/category/'))return p.replace('/products/category/','/collections/');
 if(p.startsWith('/products'))return p==='/products'?'/collections/all':p;
 if(p.startsWith('/projects/'))return p.replace('/projects/','/pages/');
 if(p.startsWith('/solutions/'))return p.replace('/solutions/','/pages/');
 const exact={'/contact':'/pages/contact','/quote':'/pages/project-quote','/about':'/pages/about','/resources':'/pages/resources','/projects':'/pages/projects','/solutions':'/pages/solutions','/loytec':'/pages/loytec','/policies':'/pages/purchase-information'};
 return exact[p]||p;
};
const converted=redirects.map(r=>({from:r.source,to:mapped(r.destination)})).filter(r=>r.from!==r.to);
const categoryNames={'home-automation':'Home automation',bms:'Building management','lighting-control':'Lighting control',grms:'Guest room management','smart-locks':'Smart locks & access',touchscreens:'Touchscreens & panels',standalone:'Standalone devices',sonoff:'SONOFF devices',connectivity:'Gateways & connectivity',accessories:'Accessories'};
const config={reviewRequired:true,storeSettings:{currency:'AED',timezone:'Asia/Dubai',commerceEnabled:false},pages,collections:Object.entries(categoryNames).map(([handle,title])=>({handle,title,published:false,rule:{column:'TAG',relation:'EQUALS',condition:handle}})),menus:[{handle:'main-menu',title:'Main menu',items:[{title:'Solutions',url:'/pages/solutions'},{title:'Products',url:'/collections/all',children:Object.entries(categoryNames).map(([handle,title])=>({title,url:`/collections/${handle}`}))},{title:'Projects',url:'/pages/projects'},{title:'About',url:'/pages/about'},{title:'Resources',url:'/pages/resources'}]},{handle:'footer',title:'Footer',items:[{title:'Contact',url:'/pages/contact'},{title:'Technical resources',url:'/pages/resources'},{title:'LOYTEC technology',url:'/pages/loytec'},{title:'Purchase information',url:'/pages/purchase-information'}]}],redirects:converted};
await writeFile(path.join(folder,'store-setup.json'),JSON.stringify(config,null,2)+'\n');await writeFile(path.join(folder,'redirects.csv'),'Redirect from,Redirect to\n'+converted.map(r=>csv(r.from)+','+csv(r.to)).join('\n')+'\n');process.stdout.write(JSON.stringify({pages:pages.length,collections:config.collections.length,redirects:converted.length})+'\n');
