import {load} from 'cheerio';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
type Asset={source:string;alt:string;kind:string;path?:string;status?:number};
type Snapshot={url:string;html:string;assets:Asset[];reviewFlags:string[]};
type Document={source:string;alt:string;sourcePages:string[];path?:string;status?:number;bytes?:number;sha256?:string;finalUrl?:string;error?:string;fetchedAt?:string};
const file='data/source/manufacturer-documents.json';
const snapshots:Snapshot[]=JSON.parse(await readFile('data/source/snapshots.json','utf8'));
const previous:Document[]=JSON.parse(await readFile(file,'utf8').catch(()=>'[]'));
const documents=new Map(previous.map(d=>[d.source,d]));
// Reconcile only public manufacturer links present in the captured source, never guessed URLs.
for(const snapshot of snapshots){const $=load(snapshot.html);$('a[href]').each((_,a)=>{const href=$(a).attr('href');if(!href)return;let url:URL;try{url=new URL(href,snapshot.url);}catch{return;}if(url.hostname!=='www.loytec.com'||!url.pathname.includes('/doc_download/'))return;const source=url.href;const d=documents.get(source)||{source,alt:$(a).text().trim()||'Manufacturer technical document',sourcePages:[]};if(!d.sourcePages.includes(snapshot.url))d.sourcePages.push(snapshot.url);documents.set(source,d);});}
await mkdir('public/media',{recursive:true});
const digest=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
const save=()=>writeFile(file,JSON.stringify([...documents.values()],null,2));
const pending=[...documents.values()];let next=0,complete=0;
await Promise.all(Array.from({length:2},async()=>{while(next<pending.length){const d=pending[next++];if(d.path){try{const bytes=await readFile('public'+d.path);if(bytes.subarray(0,5).toString()==='%PDF-'&&digest(bytes)===d.sha256){complete++;continue;}}catch{}}
 delete d.path;delete d.error;d.fetchedAt=new Date().toISOString();
 try{const response=await fetch(d.source,{signal:AbortSignal.timeout(45000)});d.status=response.status;d.finalUrl=response.url;if(!response.ok)throw new Error('Public download returned HTTP '+response.status);const length=Number(response.headers.get('content-length')||0);if(length>64*1024*1024)throw new Error('Document exceeds 64 MiB capture limit');const chunks:Uint8Array[]=[];let size=0;if(!response.body)throw new Error('Empty document body');for await(const chunk of response.body){size+=chunk.byteLength;if(size>64*1024*1024)throw new Error('Document exceeds 64 MiB capture limit');chunks.push(chunk);}const bytes=Buffer.concat(chunks);if(bytes.subarray(0,5).toString()!=='%PDF-')throw new Error('Public URL did not return PDF bytes');d.path='/media/'+digest(d.source).slice(0,16)+'.pdf';d.bytes=bytes.length;d.sha256=digest(bytes);await writeFile('public'+d.path,bytes);
 }catch(e){d.error=e instanceof Error?e.message:String(e);}
 complete++;await save();console.log(`${complete}/${pending.length}: ${d.path?'saved '+d.bytes+' bytes':d.error} — ${d.alt}`);await new Promise(r=>setTimeout(r,650));
}}));
const assets:Record<string,unknown>[]=JSON.parse(await readFile('data/source/assets.json','utf8'));
for(const d of documents.values()){
 for(const snapshot of snapshots.filter(s=>d.sourcePages.includes(s.url))){snapshot.assets=snapshot.assets.filter(a=>a.source!==d.source);snapshot.assets.push({source:d.source,alt:d.alt,kind:'download',path:d.path,status:d.status});snapshot.reviewFlags=snapshot.reviewFlags.filter(f=>f!=='manufacturer-document-unavailable:'+d.source);if(!d.path)snapshot.reviewFlags.push('manufacturer-document-unavailable:'+d.source);}
 if(d.path){const existing=assets.findIndex(a=>a.source===d.source);const asset={source:d.source,originalPath:d.path,bytes:d.bytes,sha256:d.sha256,kind:'download',alt:d.alt,rightsStatus:'source-linked manufacturer document; business rights and technical revision review pending',sourcePages:d.sourcePages,fetchedAt:d.fetchedAt};if(existing>=0)assets[existing]=asset;else assets.push(asset);}
}
await save();await writeFile('data/source/snapshots.json',JSON.stringify(snapshots));await writeFile('data/source/assets.json',JSON.stringify(assets,null,2));
const manifest=JSON.parse(await readFile('data/deployment/assets.json','utf8'));
for(const d of documents.values())if(d.path){const asset={path:d.path,bytes:d.bytes,sha256:d.sha256};const index=manifest.documents.findIndex((a:{path:string})=>a.path===d.path);if(index>=0)manifest.documents[index]=asset;else manifest.documents.push(asset);}
manifest.documents.sort((a:{path:string},b:{path:string})=>a.path.localeCompare(b.path));await writeFile('data/deployment/assets.json',JSON.stringify(manifest,null,2));
console.log({discovered:documents.size,captured:[...documents.values()].filter(d=>d.path).length,unavailable:[...documents.values()].filter(d=>!d.path).length});
