// Compatibility is intentionally limited to the parameterized SQL used by this application.
export function postgresSQL(sql,changes=0){
 const ignore=/^INSERT OR IGNORE INTO /i.test(sql);
 let result=sql.replace(/^INSERT OR IGNORE INTO /i,'INSERT INTO ').replace(/\bmin\(/gi,'least(').replace(/changes\(\)/gi,String(changes));
 if(ignore)result+=' ON CONFLICT DO NOTHING';
 // PostgreSQL requires qualification of target columns in conflict-update expressions.
 if(result.startsWith('INSERT INTO rate_limits'))result=result.replace(/\bwindow_start</g,'rate_limits.window_start<').replace(/ELSE count\+1/g,'ELSE rate_limits.count+1').replace(/ELSE window_start END/g,'ELSE rate_limits.window_start END');
 let index=0,quoted=false,out='';
 for(let i=0;i<result.length;i++){const c=result[i];if(c==="'"){if(quoted&&result[i+1]==="'"){out+="''";i++;continue}quoted=!quoted}out+=c==='?'&&!quoted?'$'+(++index):c}
 return out;
}
function compatibleError(error){
 if(error.code==='23505')return new Error('UNIQUE constraint');
 if(error.code==='23514'&&error.constraint==='products_stock_check')return new Error('INSUFFICIENT_STOCK');
 return error;
}
export function postgresDatabase(pool){
 async function execute(client,statement,changes=0){try{return await client.query(postgresSQL(statement.sql,changes),statement.args)}catch(e){throw compatibleError(e)}}
 const db={prepare(sql){return {sql,args:[],bind(...args){this.args=args;return this},async first(){return (await execute(pool,this)).rows[0]||null},async all(){return {results:(await execute(pool,this)).rows}},async run(){return (await db.batch([this]))[0]}}},
 async batch(statements){const client=await pool.connect();try{await client.query('BEGIN');
 // Serialize writes across replicas, preserving the atomic stock/changes() behavior of SQLite.
 await client.query('SELECT pg_advisory_xact_lock(173431,1)');let changes=0;const results=[];
 for(const statement of statements){const result=await execute(client,statement,changes);changes=result.rowCount||0;results.push({success:true,meta:{changes}})}
 await client.query('COMMIT');return results;
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}},close:()=>pool.end()};return db;
}
