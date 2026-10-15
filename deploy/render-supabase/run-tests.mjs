// Run the existing full commerce suite against an actual embedded PostgreSQL engine.
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const target=new URL('../../tools/.postgres-commerce.generated.mjs',import.meta.url);
let code=await fs.readFile(new URL('../../tools/test-commerce.mjs',import.meta.url),'utf8');
code=code.replace("import {localDatabase} from '../server/local-db.mjs';","import {testDatabase} from '../deploy/render-supabase/test-database.mjs';").replaceAll("localDatabase(':memory:')","await testDatabase()").replaceAll("db.exec(fs.readFileSync(new URL('../server/schema.sql',import.meta.url),'utf8'));",'').replaceAll('db.close();','await db.close();');
await fs.writeFile(target,code);
try{const exitCode=await new Promise(resolve=>spawn(process.execPath,['--test',fileURLToPath(target)],{stdio:'inherit'}).on('exit',resolve));process.exitCode=exitCode??1}finally{await fs.unlink(target)}
