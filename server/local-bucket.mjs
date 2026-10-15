import fs from 'node:fs/promises';
import path from 'node:path';
import {imageKeyPattern} from './images.mjs';
export function localBucket(directory){
 const file=key=>{if(!imageKeyPattern.test(key))throw new Error('Invalid image key');return path.join(directory,key)};
 return {async put(key,bytes){await fs.mkdir(directory,{recursive:true});await fs.writeFile(file(key),bytes)},async get(key){try{const body=await fs.readFile(file(key));return {body,httpMetadata:{contentType:key.endsWith('.png')?'image/png':key.endsWith('.webp')?'image/webp':'image/jpeg'}}}catch(e){if(e.code==='ENOENT')return null;throw e}},async head(key){return this.get(key)}};
}
