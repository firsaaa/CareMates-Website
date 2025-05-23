import { Pool } from "pg"

// Configuration database
const pool = new Pool({
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "V4ldick999!",
  host: process.env.DATABASE_HOST || "caremates.postgres.database.azure.com",
  port: Number.parseInt(process.env.DATABASE_PORT || "5432"),
  database: process.env.DATABASE_NAME || "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000, // 15 detik timeout koneksi
})

// Test koneksi saat aplikasi mulai
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err)
  } else {
    console.log("Database connected successfully at:", res.rows[0].now)
  }
})

// Handler error pada pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

export const getDb = () => pool

export default pool