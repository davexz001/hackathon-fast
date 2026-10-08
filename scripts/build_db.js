const { Client } = require('pg');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes('...')) {
    console.error("❌ ERROR: Set your DATABASE_URL variable in your terminal session or .env file first!");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("📡 Connected to Supabase remote server instance...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.audit_logs (
        id BIGSERIAL PRIMARY KEY,
        payee TEXT NOT NULL,
        amount INT NOT NULL,
        decision TEXT NOT NULL,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Success! 'public.audit_logs' table has been securely established on your database cluster.");
  } catch (err) {
    console.error("❌ Migration setup execution failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
