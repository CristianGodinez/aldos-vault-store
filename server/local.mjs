import {localBucket} from './local-bucket.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {localDatabase} from './local-db.mjs';
import {createApi} from './api.mjs';
import {seed} from './seed.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
try{process.loadEnvFile(path.join(root,'.env'))}catch(error){if(error.code!=='ENOENT')throw error;}
const port=Number(process.env.PORT||4174),origin=process.env.APP_ORIGIN||`http://127.0.0.1:${port}`;
const databasePath=path.resolve(root,process.env.DATABASE_PATH||'data/aldos-vault.sqlite');fs.mkdirSync(path.dirname(databasePath),{recursive:true});const db=localDatabase(databasePath);db.exec(fs.readFileSync(path.join(root,'server/schema.sql'),'utf8'));await seed(db);
const api=createApi({db,env:{...process.env,APP_ORIGIN:origin,BUCKET:localBucket(path.join(path.dirname(databasePath),'uploads'))}}),publicDir=path.join(root,'public');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,origin);if(url.pathname.startsWith('/api/')){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>(url.pathname==='/api/admin/images'?2*1024*1024:22000)){res.writeHead(413);return res.end('Payload too large')}chunks.push(chunk)}const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks),duplex:'half'}:{})});const result=await api(request);res.writeHead(result.status,Object.fromEntries(result.headers));return res.end(Buffer.from(await result.arrayBuffer()))}const filename=path.resolve(publicDir,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!filename.startsWith(publicDir+path.sep)){res.writeHead(403);return res.end()}const content=await fs.promises.readFile(filename);res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"});res.end(content)}catch(error){res.writeHead(error.code==='ENOENT'?404:500);res.end('No disponible')}});
server.listen(port,'127.0.0.1',()=>console.log(`Aldo’s Vault: ${origin}\nSQLite: ${databasePath}\nPayPal: ${process.env.PAYPAL_CLIENT_ID?'configurado':'pendiente de configuración'}`));
