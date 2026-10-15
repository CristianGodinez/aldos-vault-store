import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {connectDatabase} from './connection.mjs';
import {storageClient,supabaseBucket} from './storage.mjs';
import {createApi} from '../../server/api.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),publicDir=path.join(root,'public');
try{process.loadEnvFile(path.join(root,'.env.render'))}catch(e){if(e.code!=='ENOENT')throw e}
const port=Number(process.env.PORT||4178),origin=process.env.APP_ORIGIN||process.env.RENDER_EXTERNAL_URL||`http://127.0.0.1:${port}`;
if(process.env.RENDER&&new URL(origin).protocol!=='https:')throw new Error('APP_ORIGIN debe usar HTTPS');
const {pool,db}=connectDatabase();await pool.query('SELECT id FROM users LIMIT 1');
const api=createApi({db,env:{...process.env,APP_ORIGIN:origin,BUCKET:supabaseBucket(storageClient(),process.env.SUPABASE_STORAGE_BUCKET)}});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,origin);
 if(url.pathname==='/api/health'){await pool.query('SELECT 1');res.writeHead(200,{'Content-Type':'application/json'});return res.end('{"ok":true}')}
 if(url.pathname.startsWith('/api/')){
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>(url.pathname==='/api/admin/images'?2097152:22000)){res.writeHead(413,{'Content-Type':'application/json'});return res.end('{"error":"Archivo demasiado grande."}')}chunks.push(chunk)}
  // Use configured public origin, never client-supplied Host/Forwarded headers, for secure cookies.
  const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks),duplex:'half'}:{})});
  const result=await api(request);res.writeHead(result.status,Object.fromEntries(result.headers));return res.end(Buffer.from(await result.arrayBuffer()));
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end()}
 const filename=path.resolve(publicDir,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!filename.startsWith(publicDir+path.sep)){res.writeHead(403);return res.end()}
 const content=await fs.readFile(filename);res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"});res.end(req.method==='HEAD'?undefined:content);
 }catch(e){console.error('Request failed:',e.code||'request_error');res.writeHead(e.code==='ENOENT'?404:503,{'Content-Type':'application/json'});res.end('{"error":"Servicio temporalmente no disponible."}')}
});
server.listen(port,'0.0.0.0',()=>console.log('Aldos Vault: '+origin));
process.on('SIGTERM',()=>{server.close(()=>pool.end().finally(()=>process.exit(0)));setTimeout(()=>process.exit(1),10000).unref()});
