import {HttpError} from './security.mjs';
export const imageKeyPattern=/^upload-[a-f0-9-]{36}\.(jpg|png|webp)$/;
export const maxImageBytes=2*1024*1024;
export async function readImage(request){
 const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Selecciona una imagen.');
 const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>maxImageBytes){await reader.cancel();throw new HttpError(413,'La imagen debe ocupar menos de 2 MB.');}chunks.push(value)}
 const bytes=Buffer.concat(chunks);let type,extension;
 if(bytes.length>8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){type='image/png';extension='png'}
 else if(bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255){type='image/jpeg';extension='jpg'}
 else if(bytes.length>12&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'){type='image/webp';extension='webp'}
 else throw new HttpError(415,'Solo se admiten imágenes JPG, PNG o WebP.');
 if(request.headers.get('content-type')!==type)throw new HttpError(415,'El contenido no coincide con el formato de imagen.');
 return {bytes,type,extension};
}
