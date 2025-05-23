import { NextResponse } from "next/server"
import { Pool } from "pg"

// Konfigurasi koneksi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(request, { params }) {
  const { id } = params

  console.log(`GET /api/users/${id} endpoint dipanggil`)

  try {
    // Koneksi ke database
    const client = await pool.connect()
    console.log("Database connected successfully at:", new Date().toISOString())

    try {
      let query
      let queryParams

      // Cek apakah ID adalah email atau numeric ID
      const isEmail = id.includes("@")

      if (isEmail) {
        // Jika parameter adalah email, cari berdasarkan email
        query = `
          SELECT id, nama, email, no_telepon, role, patient_id
          FROM users
          WHERE email = $1
        `
        queryParams = [id]
        console.log(`Executing query for user with email: ${id}`)
      } else {
        // Jika parameter adalah ID numeric, cari berdasarkan ID
        const userId = Number.parseInt(id)

        if (isNaN(userId)) {
          return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
        }

        query = `
          SELECT id, nama, email, no_telepon, role, patient_id
          FROM users
          WHERE id = $1
        `
        queryParams = [userId]
        console.log(`Executing query for user with ID: ${userId}`)
      }

      const result = await client.query(query, queryParams)

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      console.log(`Found user: ${result.rows[0].nama}`)

      return NextResponse.json(result.rows[0])
    } catch (error) {
      console.error("Database query error:", error)
      return NextResponse.json({ error: "Database query error" }, { status: 500 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error connecting to database:", error)
    return NextResponse.json({ error: "Database connection error" }, { status: 500 })
  }
}
