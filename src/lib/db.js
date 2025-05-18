import { Pool } from "pg"

// For debugging
console.log("Database configuration:")
console.log("Host:", process.env.DATABASE_HOST)
console.log("Port:", process.env.DATABASE_PORT)
console.log("Database:", process.env.DATABASE_NAME)
console.log("User:", process.env.DATABASE_USER)
console.log("SSL Mode:", process.env.DATABASE_SSLMODE)

const pool = new Pool({
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  port: Number.parseInt(process.env.DATABASE_PORT || "5432"),
  database: process.env.DATABASE_NAME,
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
