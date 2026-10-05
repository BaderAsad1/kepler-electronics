import {query} from './db';import {Product,Project} from './types';import {readFile} from 'node:fs/promises';
export type Content={id:string;slug:string;title:string;kind:string;body:string;media:Product['media'];downloads:Product['downloads'];source_url:string;published:boolean};
type Snapshot={products:Product[];projects:Project[];content:Content[];settings:Record<string,unknown>};
let cached:Promise<Snapshot>|null=null;
async function snapshot():Promise<Snapshot>{return cached??(cached=readFile('data/site-snapshot.json','utf8').then(s=>JSON.parse(s) as Snapshot));}
const approved=process.env.SITE_ENV==='production'?" AND review_status='approved'":'';
export function publicProduct(p:Product){return {...p,price_minor:p.mode==='buy'&&p.review_status==='approved'?p.price_minor:null,stock:p.mode==='buy'&&p.review_status==='approved'?p.stock:null};}
export async function getProducts(){if(process.env.NEXT_PUBLIC_STATIC_MODE==='true')return (await snapshot()).products;return (await query<Product>('SELECT * FROM products WHERE published=true'+approved+' ORDER BY name')).map(publicProduct);}
export async function getProduct(slug:string){return (await getProducts()).find(p=>p.slug===slug)||null;}
export async function getProjects(){if(process.env.NEXT_PUBLIC_STATIC_MODE==='true')return (await snapshot()).projects;return query<Project>('SELECT * FROM projects WHERE published=true'+approved+' ORDER BY name');}
export async function getProject(slug:string){return (await getProjects()).find(p=>p.slug===slug)||null;}
export async function getResources(){if(process.env.NEXT_PUBLIC_STATIC_MODE==='true')return (await snapshot()).content.filter(c=>c.published&&(['resource','news'].includes(c.kind)||c.downloads.length>0));return query<Content>("SELECT * FROM content WHERE published=true"+approved+" AND (kind IN('resource','news') OR jsonb_array_length(downloads)>0) ORDER BY title");}
export async function getContent(slug:string){if(process.env.NEXT_PUBLIC_STATIC_MODE==='true')return (await snapshot()).content.find(c=>c.slug===slug&&c.published);return (await query<Content>('SELECT * FROM content WHERE slug=$1 AND published=true'+approved,[slug]))[0];}
export async function setting<T>(key:string){if(process.env.NEXT_PUBLIC_STATIC_MODE==='true')return (await snapshot()).settings[key] as T;return (await query<{value:T}>('SELECT value FROM settings WHERE key=$1',[key]))[0]?.value;}
export const money=(minor:number,currency='AED')=>new Intl.NumberFormat('en-AE',{style:'currency',currency,minimumFractionDigits:2}).format(minor/100);
