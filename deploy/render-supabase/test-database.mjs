import {PGlite} from '@electric-sql/pglite';
import {postgresDatabase} from './postgres.mjs';
import fs from 'node:fs';
export async function testDatabase(){
 const pg=new PGlite();await pg.exec(fs.readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
 let queue=Promise.resolve();
 const convert=r=>({rows:r.rows,rowCount:r.affectedRows??0});
 const query=(sql,args)=>pg.query(sql,args).then(convert);
 const pool={async query(sql,args){await queue;return query(sql,args)},async connect(){let release;const previous=queue;queue=new Promise(resolve=>release=resolve);await previous;return {query,release}},end:()=>pg.close()};
 const db=postgresDatabase(pool);return db;
}
