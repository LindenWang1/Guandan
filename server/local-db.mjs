import {DatabaseSync} from 'node:sqlite';import {readFileSync,readdirSync} from 'node:fs';
export function localDB(filename=':memory:'){
 const sqlite=new DatabaseSync(filename);sqlite.exec('PRAGMA journal_mode = WAL');sqlite.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
 for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort()){if(!sqlite.prepare('SELECT name FROM local_migrations WHERE name = ?').get(file)){sqlite.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));sqlite.prepare('INSERT INTO local_migrations (name) VALUES (?)').run(file);}}
 return {
  sqlite,
  prepare(sql) {
   return {
    bind(...values) {
     return {
      async first() { return sqlite.prepare(sql).get(...values) || null; },
      async run() { const r=sqlite.prepare(sql).run(...values); return {meta:{changes:Number(r.changes)}}; }
     };
    }
   };
  }
 };
}
