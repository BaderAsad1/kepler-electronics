import 'dotenv/config';
import {readFile} from 'node:fs/promises';
import {pool} from '../lib/db';
await pool.query(await readFile('migrations/001_kepler.sql','utf8'));
console.log('Schema ready. Run npm run migrate:import to load captured source content.');await pool.end();
