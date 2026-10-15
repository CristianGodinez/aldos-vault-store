import {connectDatabase} from './connection.mjs';
process.loadEnvFile(new URL('../../.env.render',import.meta.url));
const tables=['users','categories','products','carts','cart_items','orders','order_items','inventory_events','custom_requests','audit_log'];
if(process.stdin.isTTY)process.stdin.setRawMode(true);
console.log('Ready for migration JSON on stdin (input is hidden).');
const input=await new Promise(resolve=>{let value='';process.stdin.on('data',chunk=>{value+=chunk.toString();if(/[\r\n]/.test(value)){process.stdin.pause();resolve(value.trim())}})});
const data=JSON.parse(input),{pool}=connectDatabase();
try{const c=await pool.connect();try{
 await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(173431,1)');
 for(const table of tables){const {rows}=await c.query(`SELECT count(*) n FROM ${table}`);if(Number(rows[0].n)!==0)throw new Error('Destination must be empty: '+table)}
 const carts=new Set(data.carts.filter(r=>r.user_id).map(r=>r.id));
 for(const table of tables){if(!Array.isArray(data[table]))throw new Error('Missing table '+table);
  const columns=(await c.query('SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2',['aldos',table])).rows.map(r=>r.column_name);
  let count=0;
  for(const row of data[table]){if(table==='carts'&&!row.user_id||table==='cart_items'&&!carts.has(row.cart_id))continue;
   const keys=Object.keys(row);if(keys.some(k=>!columns.includes(k)))throw new Error('Unexpected column in '+table);
   await c.query(`INSERT INTO ${table} (${keys.map(k=>'"'+k+'"').join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')})`,keys.map(k=>row[k]));count++;
  }console.log(table+': '+count);
 }
 for(const table of ['inventory_events','audit_log'])await c.query(`SELECT setval(pg_get_serial_sequence('aldos.${table}','id'),coalesce(max(id),1),max(id) IS NOT NULL) FROM ${table}`);
 await c.query('COMMIT');console.log('Importación confirmada. La fuente no fue modificada.');
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}
catch(e){console.error('Importación cancelada:',e.code||e.message);process.exitCode=1}finally{await pool.end();process.stdin.destroy()}
