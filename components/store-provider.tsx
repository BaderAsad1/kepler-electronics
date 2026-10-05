'use client';
import {createContext,useContext,useEffect,useState,ReactNode} from 'react';
import type {Line,Product} from '@/lib/types';
import {track} from '@/lib/analytics';
type Store={items:Line[];quoteItems:Line[];products:Product[];ready:boolean};
type Context=Store&{update:(kind:'cart'|'quote',productId:string,quantity:number,note?:string,variantId?:string|null)=>Promise<void>;reload:()=>Promise<void>;notice:string;notify:(message:string)=>void;compare:string[];toggleCompare:(id:string)=>void};
const C=createContext<Context|null>(null);
const staticMode=process.env.NEXT_PUBLIC_STATIC_MODE==='true';
const key='kepler-project-list-v1';
export function StoreProvider({children}:{children:ReactNode}){
 const [store,setStore]=useState<Store>({items:[],quoteItems:[],products:[],ready:false});
 const [notice,setNotice]=useState('');const [compare,setCompare]=useState<string[]>([]);
 async function reload(){
  if(staticMode){
   const r=await fetch((process.env.NEXT_PUBLIC_BASE_PATH||'')+'/catalog-data.json');if(!r.ok)throw new Error('The product catalogue could not be loaded.');
   const products:Product[]=await r.json();let quoteItems:Line[]=[];
   try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))quoteItems=saved.filter(l=>products.some(p=>p.id===l.productId)&&Number.isInteger(l.quantity)&&l.quantity>0&&l.quantity<=999).slice(0,50);}catch{}
   setStore({items:[],quoteItems,products,ready:true});return;
  }
  const r=await fetch('/api/cart',{cache:'no-store'});if(!r.ok)throw new Error('Your saved list could not be loaded.');setStore({...await r.json(),ready:true});
 }
 useEffect(()=>{reload().catch(e=>{setNotice(e.message);setStore(s=>({...s,ready:true}));});try{setCompare(JSON.parse(sessionStorage.getItem('kepler-compare')||'[]'));}catch{}},[]);
 useEffect(()=>{if(notice){const t=setTimeout(()=>setNotice(''),4000);return()=>clearTimeout(t);}},[notice]);
 async function update(kind:'cart'|'quote',productId:string,quantity:number,note?:string,variantId?:string|null){
  if(staticMode){
   if(kind==='cart')throw new Error('Online purchasing is pending. Add the model to your project quote.');
   if(!Number.isInteger(quantity)||quantity<0||quantity>999)throw new Error('Choose a quantity between 1 and 999.');
   const p=store.products.find(p=>p.id===productId);if(quantity&&!p)throw new Error('This model is no longer listed.');
   const previous=store.quoteItems.find(l=>l.productId===productId);
   const line:Line={productId,quantity,note:(note??previous?.note??'').slice(0,1000),variantId:variantId??previous?.variantId??null};
   const quoteItems=store.quoteItems.filter(l=>l.productId!==productId);if(quantity)quoteItems.push(line);
   if(quoteItems.length>50)throw new Error('Keep your project list to 50 models. Send a BOQ for larger specifications.');
   localStorage.setItem(key,JSON.stringify(quoteItems));setStore({...store,quoteItems});
  }else{
   const r=await fetch('/api/cart',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,productId,quantity,note,variantId})});const data=await r.json();if(!r.ok)throw new Error(data.error||'Could not update your list. Please try again.');setStore({...data,ready:true});
  }
  if(quantity)track(kind==='cart'?'add_to_cart':'add_to_quote',{productId,count:quantity});
 }
 function toggleCompare(id:string){const values=compare.includes(id)?compare.filter(x=>x!==id):compare.length<4?[...compare,id]:compare;if(values===compare)setNotice('Compare up to four products. Remove one to add another.');setCompare(values);sessionStorage.setItem('kepler-compare',JSON.stringify(values));track('compare_products',{count:values.length});}
 return <C.Provider value={{...store,update,reload,notice,notify:setNotice,compare,toggleCompare}}>{children}{notice&&<div role="status" className="toast">{notice}<button aria-label="Dismiss notification" onClick={()=>setNotice('')}>×</button></div>}</C.Provider>;
}
export function useStore(){const c=useContext(C);if(!c)throw new Error('Missing store provider');return c;}
