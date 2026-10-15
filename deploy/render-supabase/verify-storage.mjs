import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {storageClient,supabaseBucket} from './storage.mjs';
process.loadEnvFile(new URL('../../.env.render',import.meta.url));
const storage=storageClient(),name=process.env.SUPABASE_STORAGE_BUCKET||'product-images',bucket=supabaseBucket(storage,name),key='upload-'+randomUUID()+'.jpg';
let created=false;
try{const original=await fs.readFile(new URL('../../public/assets/vader.jpg',import.meta.url));await bucket.put(key,original,{httpMetadata:{contentType:'image/jpeg'}});created=true;assert.ok(await bucket.head(key));const object=await bucket.get(key);assert.deepEqual(Buffer.from(await new Response(object.body).arrayBuffer()),original);console.log('Imagen de prueba: subida, existencia y descarga verificadas.');}
finally{if(created){const {error}=await storage.from(name).remove([key]);if(error)throw new Error('No se pudo retirar la imagen temporal de prueba.');console.log('Imagen temporal retirada.')}}
