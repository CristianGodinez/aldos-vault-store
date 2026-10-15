import fs from 'node:fs/promises';
import {connectDatabase} from './connection.mjs';
import {storageClient} from './storage.mjs';
try{process.loadEnvFile(new URL('../../.env.render',import.meta.url))}catch(e){if(e.code!=='ENOENT')throw e}
const {pool}=connectDatabase();
try{
 await pool.query('SELECT 1');console.log('Conexión PostgreSQL verificada con TLS.');
 const storage=storageClient(),name=process.env.SUPABASE_STORAGE_BUCKET||'product-images';
 if(process.argv.includes('--initialize')){
  const client=await pool.connect();try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(173431,1)');await client.query(await fs.readFile(new URL('./schema.sql',import.meta.url),'utf8'));await client.query('COMMIT')}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
  const {data,error}=await storage.listBuckets();if(error)throw new Error('No se pudo consultar Storage.');
  if(!data.some(b=>b.name===name)){const {error}=await storage.createBucket(name,{public:false,fileSizeLimit:2097152,allowedMimeTypes:['image/jpeg','image/png','image/webp']});if(error)throw new Error('No se pudo crear el bucket privado.')}
  console.log('Esquema privado y bucket preparados. No se importaron ni reemplazaron datos.');
 }
 const {data,error}=await storage.getBucket(name);if(error)throw new Error('Falta inicializar el bucket de imágenes.');if(data.public)throw new Error('El bucket debe ser privado.');
 console.log('Storage privado verificado.');
}catch(e){console.error('Verificación fallida:',e.code||e.message);process.exitCode=1}finally{await pool.end()}
