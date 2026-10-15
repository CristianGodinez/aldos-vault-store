// D1 and local SQLite share the same prepared-statement interface.
export const first=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
export async function all(db,sql,...args){return (await db.prepare(sql).bind(...args).all()).results;}
export const run=(db,sql,...args)=>db.prepare(sql).bind(...args).run();
export const batch=(db,statements)=>db.batch(statements.map(([sql,...args])=>db.prepare(sql).bind(...args)));
