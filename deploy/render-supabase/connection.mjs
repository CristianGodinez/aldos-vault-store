import pg from 'pg';
import fs from 'node:fs';
import {rootCertificates} from 'node:tls';
import {postgresDatabase} from './postgres.mjs';
pg.types.setTypeParser(20,value=>{const n=Number(value);if(!Number.isSafeInteger(n))throw new Error('Database integer exceeds safe range');return n});
export function connectDatabase(env=process.env){
 for(const name of ['PGHOST','PGUSER','PGPASSWORD'])if(!env[name]||env[name].includes('REEMPLAZAR'))throw new Error('Falta configurar '+name);
 const ca=env.PGSSLROOTCERT_PEM?.replace(/\\n/g,'\n')||fs.readFileSync(new URL('./supabase-ca.crt',import.meta.url),'utf8');
 const pool=new pg.Pool({host:env.PGHOST,user:env.PGUSER,password:env.PGPASSWORD,database:env.PGDATABASE||'postgres',port:Number(env.PGPORT||5432),max:3,connectionTimeoutMillis:15000,idleTimeoutMillis:10000,options:'-c search_path=aldos,pg_catalog',ssl:{rejectUnauthorized:true,ca:[...rootCertificates,ca]}});
 pool.on('error',error=>console.error('PostgreSQL connection error:',error.code||'connection failed'));
 return {pool,db:postgresDatabase(pool)};
}
