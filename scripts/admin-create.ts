import 'dotenv/config';import {query,pool} from '../lib/db';import {passwordHash} from '../lib/security';
const email=process.env.ADMIN_EMAIL;const password=process.env.ADMIN_PASSWORD;const supabaseId=process.env.ADMIN_SUPABASE_ID;
if(!email||!/^\S+@\S+\.\S+$/.test(email))throw new Error('Set ADMIN_EMAIL locally to provision an administrator. No default account exists.');
if(!supabaseId&&(!password||password.length<16))throw new Error('Set ADMIN_PASSWORD locally to a unique password of at least 16 characters, or ADMIN_SUPABASE_ID to a pre-provisioned Supabase Auth user.');
await query('INSERT INTO staff(email,password_hash,supabase_id,role) VALUES($1,$2,$3,\'admin\') ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,supabase_id=EXCLUDED.supabase_id,role=\'admin\',disabled=false',[email,password?passwordHash(password):null,supabaseId||null]);console.log('Administrator provisioned. No password is printed.');await pool.end();
