import { NextResponse } from "next/server"
import { Pool } from "pg"

// Konfigurasi koneksi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET() {
  console.log("GET /api/assignments endpoint dipanggil")

  try {
    // Koneksi ke database
    const client = await pool.connect()
    console.log("Database connected successfully at:", new Date().toISOString())

    try {
      // Query untuk mendapatkan data assignments
      const query = `
        SELECT 
          id, 
          caregiver_id,
          patient_id,
          tanggal_mulai,
          tanggal_akhir,
          title,
          description
        FROM caregiver_assignments
      `

      const result = await client.query(query)
      console.log(`Found ${result.rows.length} assignment records`)

      return NextResponse.json(result.rows)
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
