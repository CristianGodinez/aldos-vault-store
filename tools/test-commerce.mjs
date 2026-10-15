import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {localDatabase} from '../server/local-db.mjs';
import {createApi} from '../server/api.mjs';
import {seed} from '../server/seed.mjs';
import {first,all,run} from '../server/db.mjs';
const origin='http://127.0.0.1:4174';
function provider(){const orders=new Map();let captureCalls=0;return {orders,get captureCalls(){return captureCalls},async fetch(url,options){if(url.endsWith('/v1/oauth2/token'))return Response.json({access_token:'test-only-token'});if(url.endsWith('/v2/checkout/orders')){const data=JSON.parse(options.body),key=options.headers['PayPal-Request-Id'];let order=[...orders.values()].find(o=>o.key===key);if(!order){order={id:'PP-'+orders.size,status:'CREATED',purchase_units:data.purchase_units,key,links:[{rel:'payer-action',href:'https://www.sandbox.paypal.com/checkoutnow?token=TEST'}]};orders.set(order.id,order)}return Response.json(order)}const id=url.split('/v2/checkout/orders/')[1]?.split('/')[0],o=orders.get(id);if(!o)return Response.json({}, {status:404});if(url.endsWith('/capture')){captureCalls++;o.status='COMPLETED';o.purchase_units[0].payments={captures:[{id:'CAP-'+id,status:'COMPLETED',amount:o.purchase_units[0].amount}]};}return Response.json(o)}};}
function client(api){let cookie='',csrf='';return {get csrf(){return csrf},get cookie(){return cookie},async call(path,method='GET',data,options={}){const response=await api(new Request(origin+'/api'+path,{method,headers:{Cookie:cookie,Origin:options.origin||origin,'Content-Type':'application/json','X-CSRF-Token':options.csrf??csrf},...(data!==undefined?{body:JSON.stringify(data)}:{})}));if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];const body=await response.json();if(body.csrf)csrf=body.csrf;return {status:response.status,body,headers:response.headers};}};}
test('Full commerce, security, durable data and payment state transitions',async()=>{
 const db=localDatabase(':memory:');db.exec(fs.readFileSync(new URL('../server/schema.sql',import.meta.url),'utf8'));await seed(db);const pay=provider(),api=createApi({db,env:{APP_ORIGIN:origin,PAYPAL_CLIENT_ID:'test-fixture',PAYPAL_CLIENT_SECRET:'test-fixture',ADMIN_SETUP_TOKEN:'test-setup-token'},fetcher:pay.fetch.bind(pay)}),a=client(api),b=client(api),guest=client(api);
 await a.call('/session');await b.call('/session');await guest.call('/session');
 assert.equal((await guest.call('/products')).body.products.length,10);
 assert.equal((await guest.call('/cart','PUT',{productId:'vader',quantity:1},{csrf:'wrong'})).status,403);
 assert.equal((await guest.call('/cart','PUT',{productId:'vader',quantity:1},{origin:'https://attacker.example'})).status,403);
 assert.equal((await guest.call('/admin/dashboard')).status,401);
 assert.equal((await a.call('/auth/register','POST',{name:'Ana',email:'ana@example.test',password:'long-enough-test-password'})).status,201);
 assert.equal((await b.call('/auth/register','POST',{name:'Beto',email:'beto@example.test',password:'another-long-password'})).status,201);
 assert.equal((await a.call('/auth/register','POST',{name:'Dup',email:'ana@example.test',password:'long-enough-test-password'})).status,409);
 assert.equal((await b.call('/admin/dashboard')).status,403);
 assert.equal((await a.call('/admin/setup','POST',{token:'wrong'})).status,403);
 assert.equal((await a.call('/admin/setup','POST',{token:'test-setup-token'})).status,200);
 assert.equal((await b.call('/admin/setup','POST',{token:'test-setup-token'})).status,409);
 const user=await first(db,'SELECT * FROM users WHERE email=?','ana@example.test');assert.ok(user.password_hash.startsWith('scrypt$16384$8$5$'));assert.ok(!user.password_hash.includes('long-enough'));assert.ok(a.cookie&&!a.cookie.includes(user.id));
 assert.equal((await a.call('/cart','PUT',{productId:'vader',quantity:99})).status,409);
 await a.call('/cart','PUT',{productId:'vader',quantity:2});await a.call('/cart','PUT',{productId:'boba',quantity:1});assert.equal((await a.call('/cart')).body.subtotal_cents,388000);
 const address={name:'Ana',phone:'4441234567',street:'Calle 1',city:'San Luis Potosí',state:'San Luis Potosí',postalCode:'78000',checkoutKey:'test-checkout-1',total_cents:1};
 const created=await a.call('/orders','POST',address);assert.equal(created.status,201);const order=created.body;assert.equal(order.total_cents,388000);assert.equal((await a.call('/cart')).body.quantity,0);assert.equal((await first(db,'SELECT stock FROM products WHERE id=?','vader')).stock,1);
 assert.equal((await a.call('/orders','POST',address)).body.id,order.id);assert.equal((await b.call('/orders/'+order.id)).status,404);
 assert.equal((await a.call('/orders/'+order.id+'/pay','POST',{})).status,200);const record=await first(db,'SELECT * FROM orders WHERE id=?',order.id);assert.equal((await a.call('/orders/'+order.id+'/capture','POST',{})).status,409);
 pay.orders.get(record.paypal_id).status='APPROVED';assert.equal((await a.call('/orders/'+order.id+'/capture','POST',{})).body.status,'paid');assert.equal((await a.call('/orders/'+order.id+'/capture','POST',{})).body.status,'paid');assert.equal(pay.captureCalls,1);assert.equal((await a.call('/orders/'+order.id+'/cancel','POST',{})).status,409);
 assert.equal((await a.call('/admin/orders/'+order.id,'PATCH',{status:'completed'})).status,409);assert.equal((await a.call('/admin/orders/'+order.id,'PATCH',{status:'shipped',tracking:'TEST-TRACKING'})).status,200);assert.equal((await a.call('/admin/orders/'+order.id,'PATCH',{status:'completed'})).status,200);
 await b.call('/cart','PUT',{productId:'charizard',quantity:1});const pending=(await b.call('/orders','POST',{...address,name:'Beto',checkoutKey:'beto-order'})).body;assert.equal((await first(db,'SELECT stock FROM products WHERE id=?','charizard')).stock,0);
 assert.equal((await b.call('/orders/'+pending.id+'/cancel','POST',{})).status,200);await b.call('/orders/'+pending.id+'/cancel','POST',{});assert.equal((await first(db,'SELECT stock FROM products WHERE id=?','charizard')).stock,1);
 assert.equal((await b.call('/requests','POST',{piece:'Darth Revan',category:'LEGO',budget_cents:500000,details:'Con sable'})).status,201);assert.equal((await b.call('/requests')).body.requests.length,1);
 await guest.call('/cart','PUT',{productId:'batman',quantity:1});const oldCookie=guest.cookie;assert.equal((await guest.call('/auth/login','POST',{email:'beto@example.test',password:'another-long-password'})).status,200);assert.notEqual(guest.cookie,oldCookie);assert.equal((await guest.call('/cart')).body.quantity,1);
 const product=(await a.call('/admin/dashboard')).body.products.find(p=>p.id==='vader');assert.equal((await b.call('/admin/products/vader','PATCH',{...product,stock:50})).status,403);assert.equal((await a.call('/admin/products/vader','PATCH',{...product,stock:5,price_cents:160000})).status,200);assert.equal((await first(db,'SELECT stock FROM products WHERE id=?','vader')).stock,5);
 const category=(await a.call('/admin/categories','POST',{name:'Comics'})).body;assert.ok(category.id);const added=await a.call('/admin/products','POST',{...product,id:undefined,name:'New figure',category_id:category.id,stock:4});assert.equal(added.status,201);assert.equal((await a.call('/admin/products/'+added.body.id,'DELETE',{})).status,200);assert.equal((await first(db,'SELECT active FROM products WHERE id=?',added.body.id)).active,0);
 await a.call('/cart','PUT',{productId:'charizard',quantity:1});await b.call('/cart','PUT',{productId:'batman',quantity:0});await b.call('/cart','PUT',{productId:'charizard',quantity:1});const concurrent=await Promise.all([a.call('/orders','POST',{...address,checkoutKey:'race-a'}),b.call('/orders','POST',{...address,checkoutKey:'race-b'})]);assert.equal(concurrent.filter(x=>x.status===201).length,1);assert.equal(concurrent.filter(x=>x.status===409).length,1);assert.equal((await first(db,'SELECT stock FROM products WHERE id=?','charizard')).stock,0);
 assert.ok((await all(db,'SELECT * FROM inventory_events')).length===7);assert.ok((await all(db,'SELECT * FROM audit_log')).length>=4);
 const loggedOut=await guest.call('/auth/logout','POST',{});assert.ok(loggedOut.headers.get('set-cookie').includes('Max-Age=0'));assert.equal((await guest.call('/orders')).status,401);
 db.close();
});
test('Unconfigured payments never fabricate a sale',async()=>{const db=localDatabase(':memory:');db.exec(fs.readFileSync(new URL('../server/schema.sql',import.meta.url),'utf8'));await seed(db);const c=client(createApi({db,env:{APP_ORIGIN:origin}}));await c.call('/session');await c.call('/auth/register','POST',{name:'No Pay',email:'nopay@example.test',password:'safe-test-password'});await c.call('/cart','PUT',{productId:'vader',quantity:1});assert.equal((await c.call('/orders','POST',{})).status,503);assert.equal((await all(db,'SELECT * FROM orders')).length,0);db.close();});

