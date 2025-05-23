import { NextResponse } from "next/server"
import { Pool } from "pg"

// Konfigurasi koneksi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(request, { params }) {
  const { id } = params

  console.log(`GET /api/patients/${id} endpoint dipanggil`)

  try {
    // Koneksi ke database
    const client = await pool.connect()
    console.log("Database connected successfully at:", new Date().toISOString())

    try {
      // Query untuk mendapatkan data pasien berdasarkan ID
      const query = `
        SELECT id, nama, alamat, tanggal_lahir, jenis_kelamin, penyakit, device_id
        FROM patients
        WHERE id = $1
      `
      console.log(`Executing query for patient with ID: ${id}`)

      const result = await client.query(query, [id])

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 })
      }

      console.log(`Found patient with ID: ${id}`)

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
