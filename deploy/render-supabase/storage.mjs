import {createClient} from '@supabase/supabase-js';
import {imageKeyPattern,maxImageBytes} from '../../server/images.mjs';
export function storageClient(env=process.env){
 if(!env.SUPABASE_URL||!env.SUPABASE_SERVER_KEY||env.SUPABASE_SERVER_KEY.includes('REEMPLAZAR'))throw new Error('Falta configurar Supabase Storage.');
 return createClient(env.SUPABASE_URL,env.SUPABASE_SERVER_KEY,{auth:{persistSession:false,autoRefreshToken:false}}).storage;
}
export function supabaseBucket(storage,name='product-images'){
 const bucket=storage.from(name),validate=key=>{if(!imageKeyPattern.test(key))throw new Error('Invalid image key')};
 return {async put(key,bytes,options){validate(key);if(bytes.length>maxImageBytes)throw new Error('Image too large');const {error}=await bucket.upload(key,bytes,{contentType:options.httpMetadata.contentType,upsert:false});if(error)throw new Error('No se pudo almacenar la imagen.');},async get(key){validate(key);const {data,error}=await bucket.download(key);if(error){if(['404','400'].includes(String(error.statusCode))&&/not found|does not exist/i.test(error.message))return null;throw new Error('No se pudo consultar la imagen.')}return {body:data.stream(),httpMetadata:{contentType:data.type}}},async head(key){validate(key);const {data,error}=await bucket.exists(key);if(error)throw new Error('No se pudo comprobar la imagen.');return data?{}:null}};
}
