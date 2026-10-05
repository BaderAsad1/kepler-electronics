export type Media={path:string;alt:string;source:string;width?:number;height?:number};
export type Product={id:string;slug:string;sku:string|null;name:string;description:string;category:string;categories:string[];brand:string|null;protocols:string[];applications:string[];specs:Record<string,string>;media:Media[];downloads:Media[];mode:'quote'|'buy'|'unavailable';price_minor:number|null;currency:string;stock:number|null;published:boolean;source_url:string;review_status:string;variants: {id:string;name:string;sku:string;specs:Record<string,string>}[];included:string|null;compatibility:string|null;edited_at:string|null};
export type Project={id:string;slug:string;name:string;description:string;media:Media[];source_url:string;published:boolean;scope:string|null;location:string|null;review_status:string};
export type Line={productId:string;quantity:number;note?:string;variantId?:string|null};
export const categories:Record<string,{name:string;short:string;description:string}>={
 'home-automation':{name:'Home automation',short:'Connected living',description:'Controls for lighting, climate, curtains and everyday comfort.'},
 'bms':{name:'Building management',short:'Building intelligence',description:'Automation servers, I/O controllers and interfaces for connected buildings.'},
 'lighting-control':{name:'Lighting control',short:'Light, considered',description:'DALI controllers, dimmers, sensors and room controls.'},
 'grms':{name:'Guest room management',short:'Hospitality controls',description:'Room controllers and operator panels for coordinated guest environments.'},
 'smart-locks':{name:'Smart locks & access',short:'Thoughtful access',description:'Source-listed smart door locks and access devices.'},
 'touchscreens':{name:'Touchscreens & panels',short:'Control at a touch',description:'Room operator interfaces and building touch panels.'},
 'standalone':{name:'Standalone devices',short:'Individual controls',description:'Independent switches, thermostats and sensors.'},
 'sonoff':{name:'SONOFF devices',short:'Everyday intelligence',description:'Source-listed SONOFF controls, sensors and gateways.'},
 'connectivity':{name:'Gateways & connectivity',short:'Systems, connected',description:'Interfaces, routers and protocol gateways.'},
 'accessories':{name:'Accessories',short:'Finishing details',description:'Power supplies, control cables and source-listed accessories.'}
};
