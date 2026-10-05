import {setting} from './catalog';
export type Contact={name:string;email:string;phone:string;address:string;headquarters:string;jordan:string;jordanPhone:string;whatsapp:string|null;source:string;reviewStatus:string};
export const defaultContact:Contact={name:'KEPLER Electronics for Control Systems LLC',email:'sales@kepler-elec.com',phone:'+971 4 324 4835',address:'Abdullah Ahmad Mohammed Bin Fahad Building 4, Office No. 123, Qusais Industrial 2, Dubai, UAE',headquarters:'Istanbul',jordan:'Thabet Ben Dinar St. Building 3, Office No 2, Khalda, Amman, Jordan',jordanPhone:'+962 6 516 1510',whatsapp:null,source:'https://kepler-elec.com/contact-us/',reviewStatus:'source confirmed; business approval pending'};
export const getContact=async()=>await setting<Contact>('contact')||defaultContact;
