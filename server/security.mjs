import { randomBytes, createHash, pbkdf2Sync, scryptSync, timingSafeEqual } from 'node:crypto';
export const token=()=>randomBytes(32).toString('hex');
export const hash=value=>createHash('sha256').update(value).digest('hex');
// OWASP's 16 MiB scrypt profile avoids Workers' production-only PBKDF2 cap.
const scryptOptions={N:16384,r:8,p:5,maxmem:32*1024*1024};
export const dummyPasswordHash='scrypt$16384$8$5$'+'0'.repeat(32)+'$'+'0'.repeat(64);
export function passwordHash(password){const salt=randomBytes(16).toString('hex');return `scrypt$16384$8$5$${salt}$${scryptSync(password,salt,32,scryptOptions).toString('hex')}`;}
export function verifyPassword(password,encoded){
 if(typeof encoded!=='string')return false;
 const parts=encoded.split('$');let actual,expected;
 if(parts.length===6&&parts[0]==='scrypt'&&parts[1]==='16384'&&parts[2]==='8'&&parts[3]==='5'&&/^[a-f0-9]{32}$/.test(parts[4])&&/^[a-f0-9]{64}$/.test(parts[5])){
  actual=scryptSync(password,parts[4],32,scryptOptions);expected=parts[5];
 }else if(parts.length===4&&parts[0]==='pbkdf2'&&parts[1]==='600000'&&/^[a-f0-9]{32}$/.test(parts[2])&&/^[a-f0-9]{64}$/.test(parts[3])){
  // Preserve accounts previously created in the local Node server.
  actual=pbkdf2Sync(password,parts[2],600000,32,'sha256');expected=parts[3];
 }else return false;
 return timingSafeEqual(actual,Buffer.from(expected,'hex'));
}
export class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
export function text(value,name,max=200,min=1){if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)throw new HttpError(400,`Revisa ${name}.`);return value.trim();}
export function email(value){const result=text(value,'el correo',254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))throw new HttpError(400,'El correo no es válido.');return result;}
export function password(value){if(typeof value!=='string'||value.length<12||value.length>128)throw new HttpError(400,'La contraseña debe tener entre 12 y 128 caracteres.');return value;}
export function integer(value,name,min=0,max=100000000){if(!Number.isSafeInteger(value)||value<min||value>max)throw new HttpError(400,`Revisa ${name}.`);return value;}
export async function readJson(request){const raw=await request.text();if(raw.length>20000)throw new HttpError(413,'Formulario demasiado grande.');try{return JSON.parse(raw)}catch{throw new HttpError(400,'El formulario no tiene un formato válido.')}}
export const publicUser=u=>u?{id:u.id,name:u.name,email:u.email,role:u.role,phone:u.phone||''}:null;
