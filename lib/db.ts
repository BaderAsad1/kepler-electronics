import {Pool,PoolClient} from 'pg';
import 'dotenv/config';
const globalDb=globalThis as unknown as {keplerPool?:Pool};
export const pool=globalDb.keplerPool??new Pool({connectionString:process.env.DATABASE_URL||'postgresql://localhost/kepler_local',max:8,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:true}:undefined});
if(process.env.NODE_ENV!=='production')globalDb.keplerPool=pool;
export async function query<T=Record<string,unknown>>(sql:string,args:unknown[]=[]){return (await pool.query(sql,args)).rows as T[];}
export async function transaction<T>(fn:(c:PoolClient)=>Promise<T>):Promise<T>{const c=await pool.connect();try{await c.query('BEGIN');const result=await fn(c);await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
