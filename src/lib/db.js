import { Pool } from "pg"

// Configuration from environment or use the provided credentials
const pool = new Pool({
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "V4ldick999!",
  host: process.env.DATABASE_HOST || "caremates.postgres.database.azure.com",
  port: Number.parseInt(process.env.DATABASE_PORT || "5432"),
  database: process.env.DATABASE_NAME || "postgres",
  ssl: process.env.DATABASE_SSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
})

// Test the connection on startup
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err)
  } else {
    console.log("Database connected successfully at:", res.rows[0].now)
  }
})

export const getDb = () => pool

export default pool