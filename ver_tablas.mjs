import { createClient } from '@libsql/client';

const c = createClient({
  url: 'libsql://edugestv2-osmer.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzcwNDY1MzksImlkIjoiMDE5ZGMwM2EtMGQwMS03YmMwLTg1ZjEtMDIwZDM1ZDcxY2UzIiwicmlkIjoiMzdkNDkyMTUtZmUxZi00YTBkLTg2MzEtYjQzOWVlMjI2OWRjIn0.ILnrJuO9qmw9y3C8e8BvOsF4MpwhqENgyeo5sdosRg-PEoDq6MQq4DVmItGyIWxEqD_EeZZXOYNKC0vCHt2zDQ'
});

const tablas = await c.execute("SELECT name FROM sqlite_master WHERE type='table'");
console.log('Tablas:', tablas.rows.map(x => x.name));

for (const row of tablas.rows) {
  const count = await c.execute(`SELECT COUNT(*) as n FROM ${row.name}`);
  console.log(`  ${row.name}: ${count.rows[0].n} registros`);
}
