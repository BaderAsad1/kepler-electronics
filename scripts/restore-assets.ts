import {spawn} from 'node:child_process';
import {readFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(await readFile('data/deployment/assets.json','utf8'));
await mkdir('public/media',{recursive:true});
const missing=[];
for(const asset of manifest.documents){try{const bytes=await readFile('public'+asset.path);if(createHash('sha256').update(bytes).digest('hex')===asset.sha256)continue;}catch{}missing.push(asset);}
if(missing.length){const code=await new Promise<number>((resolve,reject)=>{const child=spawn('gh',['release','download',manifest.release,'--repo',manifest.repository,'--dir','public/media','--pattern','*.pdf','--clobber'],{stdio:'inherit'});child.on('error',reject);child.on('exit',c=>resolve(c||0));});if(code)throw new Error('Could not restore source documents from the controlled release');}
for(const asset of manifest.documents){const bytes=await readFile('public'+asset.path);if(createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw new Error('Source document checksum mismatch: '+asset.path);}
console.log('Verified source documents:',manifest.documents.length);
