import 'dotenv/config';import {runJobs} from '../lib/jobs';import {pool} from '../lib/db';console.log(await runJobs());await pool.end();
