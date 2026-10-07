import { Liquid } from 'liquidjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
export const themePath = path.resolve(import.meta.dirname, '../theme');
export const repoPath = path.resolve(import.meta.dirname, '../..');
const engine = new Liquid({ root: path.join(themePath, 'snippets'), extname: '.liquid', strictFilters: true, ownPropertyOnly: true, jsTruthy: false });
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function skipTag(name) { engine.registerTag(name, { parse(token,tokens) { while(tokens.length) { if(tokens.shift().name === `end${name}`) return; } throw Error(`Unclosed ${name}`); }, render() { return ''; } }); }
skipTag('schema');
engine.registerTag('style', { parse(token,tokens) { this.templates=[]; while(tokens.length) { const t=tokens.shift(); if(t.name==='endstyle') return; this.templates.push(engine.parser.parseToken(t,tokens)); } }, *render(ctx) { return `<style>${yield engine.renderer.renderTemplates(this.templates,ctx)}</style>`; } });
engine.registerTag('form', {
  parse(token,tokens) { this.args=token.args; this.templates=[]; while(tokens.length) { const t=tokens.shift(); if(t.name==='endform') return; this.templates.push(engine.parser.parseToken(t,tokens)); } },
  *render(ctx) {
    const type=this.args.match(/^['"]([^'"]+)['"]/)?.[1];
    const props={}; for(const match of this.args.matchAll(/([\w-]+):\s*('[^']*'|"[^"]*"|[\w.]+)/g)) props[match[1]]=yield engine.evalValue(match[2],ctx);
    const currentForm=ctx.get(['form']) || {};
    const action=type==='product' ? '/cart/add' : type==='localization' ? '/localization' : '/contact';
    const hidden=type==='contact'?'<input type="hidden" name="form_type" value="contact">':type==='customer'?'<input type="hidden" name="form_type" value="customer">':'';
    ctx.push({form:{ errors:null, 'posted_successfully?':false, ...currentForm }});
    const body=yield engine.renderer.renderTemplates(this.templates,ctx); ctx.pop();
    return `<form method="post" action="${action}" ${Object.entries(props).map(([k,v])=>`${k}="${escape(v)}"`).join(' ')}>${hidden}${body}</form>`;
  }
});
engine.registerTag('paginate', {parse(token,tokens) { this.args=token.args;this.templates=[];while(tokens.length){const t=tokens.shift();if(t.name==='endpaginate')return;this.templates.push(engine.parser.parseToken(t,tokens));}},*render(ctx){const [listKey,num]=this.args.split(' by ');const list=yield engine.evalValue(listKey,ctx);const size=Number(yield engine.evalValue(num,ctx));const pages=Math.ceil((list?.length||0)/size)||1;ctx.push({paginate:{pages,current_page:1,parts:Array.from({length:pages},(_,i)=>({title:i+1,is_link:i!==0,url:`?page=${i+1}`}))}});const result=yield engine.renderer.renderTemplates(this.templates,ctx);ctx.pop();return result;}});
engine.registerTag('layout',{parse(){},render(){return '';}});
engine.registerFilter('asset_url', v=>`/assets/${v}`);
engine.registerFilter('image_url',(v,...args)=> { const width=args.find(a=>a[0]==='width')?.[1]; return `${typeof v==='string'?v:v?.url||v?.path||''}${width?'?width='+width:''}`; });
engine.registerFilter('image_tag',(v,...args)=>{const attrs=Object.fromEntries(args.filter(Array.isArray));delete attrs.widths;return `<img src="${escape(v)}" width="${attrs.width||900}" height="${attrs.height||600}" alt="${escape(attrs.alt||'')}" ${Object.entries(attrs).map(([k,val])=>`${k}="${escape(val)}"`).join(' ')}>`;});
engine.registerFilter('stylesheet_tag',v=>`<link rel="stylesheet" href="${escape(v)}">`);
engine.registerFilter('money_with_currency',v=>`${(Number(v||0)/100).toFixed(2)} AED`);
engine.registerFilter('money',v=>`${(Number(v||0)/100).toFixed(2)} AED`);
engine.registerFilter('default_errors',v=>v?'<p>Fixture form error</p>':'');
engine.registerFilter('placeholder_svg_tag',(_v,klass)=>`<svg class="${escape(klass)}" viewBox="0 0 600 600" aria-hidden="true"><rect width="600" height="600" fill="#e4dfd5"/><rect x="250" y="180" width="100" height="240" fill="#ccc6ba"/></svg>`);
engine.registerFilter('handle',v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-'));
engine.registerFilter('structured_data',v=>JSON.stringify({'@context':'https://schema.org','@type':'Product',name:v.title}));
engine.registerFilter('payment_button',()=>'<div data-fixture-payment-button>Store payment button — requires Shopify</div>');
engine.registerFilter('payment_type_svg_tag',()=> '');
engine.registerFilter('format_code',v=>String(v).match(/.{1,4}/g)?.join(' '));
engine.registerFilter('video_tag',()=>'<video controls></video>');
engine.registerFilter('external_video_tag',()=>'<iframe title="Product video"></iframe>');
engine.registerFilter('model_viewer_tag',()=>'<model-viewer></model-viewer>');
const locales={en:JSON.parse(await readFile(path.join(themePath,'locales/en.default.json'))),ar:JSON.parse(await readFile(path.join(themePath,'locales/ar.json')))};
engine.registerFilter('t',function(key,...args){const lang=this.context.get(['request','locale','iso_code'])||'en';let value=key.split('.').reduce((a,k)=>a?.[k],locales[lang]||locales.en);if(typeof value!=='string')throw Error(`Missing translation ${key}`);for(const [k,v] of args) value=value.replaceAll(`{{ ${k} }}`,escape(v));return value;});
export async function renderSection(type,id,settings,scope,blocks={}) {
  let source=await readFile(path.join(themePath,'sections',`${type}.liquid`),'utf8');
  const raw=source.match(/{% schema %}([\s\S]*?){% endschema %}/)?.[1];
  const schema=raw?JSON.parse(raw):{};const defaults=Object.fromEntries((schema.settings||[]).filter(s=>s.default!==undefined).map(s=>[s.id,s.default]));
  const resolved={...defaults,...settings};
  for(const option of schema.settings||[]){const value=resolved[option.id];if(option.type==='collection'&&typeof value==='string')resolved[option.id]=scope.collections[value];if(option.type==='link_list'&&typeof value==='string')resolved[option.id]=scope.fixtureMenus[value];}
  return `<div id="shopify-section-${id}" class="shopify-section">${await engine.parseAndRender(source,{...scope,section:{id,settings:resolved,blocks:Object.entries(blocks).map(([id,b])=>({id,...b,settings:{...b.settings,menu:scope.fixtureMenus?.[b.settings.menu]||b.settings.menu},shopify_attributes:''}))}},{globals:scope})}</div>`;
}
async function renderConfig(config,scope) { let out='';for(const id of config.order){const section=config.sections[id];if(section.disabled)continue;out+=await renderSection(section.type,id,section.settings,scope,section.blocks);}return out; }
export async function renderPage(template,scope) {
  const json=JSON.parse(await readFile(path.join(themePath,'templates',`${template}.json`),'utf8'));
  let layout=await readFile(path.join(themePath,'layout',`${json.layout||'theme'}.liquid`),'utf8');
  for(const name of ['header-group','footer-group']) { const config=JSON.parse(await readFile(path.join(themePath,'sections',`${name}.json`),'utf8')); const html=await renderConfig(config,scope);layout=layout.replace(`{% sections '${name}' %}`,html); }
  layout=layout.replace("{% section 'cart-panel' %}",await renderSection('cart-panel','cart-panel',{},scope));
  return engine.parseAndRender(layout,{...scope,content_for_layout:await renderConfig(json,scope)},{globals:scope});
}
