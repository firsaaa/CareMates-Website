import { NextResponse } from "next/server"
import { Pool } from "pg"

// Konfigurasi koneksi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(request) {
  console.log("GET /api/notifikasi endpoint dipanggil")

  // Get query parameters
  const { searchParams } = new URL(request.url)
  const caregiverId = searchParams.get("caregiver_id")
  const patientId = searchParams.get("pasien_id")

  let whereClause = ""
  const queryParams = []
  let paramCounter = 1

  if (caregiverId) {
    whereClause += " WHERE caregiver_id = $" + paramCounter
    queryParams.push(caregiverId)
    paramCounter++
  }

  if (patientId) {
    whereClause += whereClause ? " AND pasien_id = $" + paramCounter : " WHERE pasien_id = $" + paramCounter
    queryParams.push(patientId)
    paramCounter++
  }

  try {
    // Koneksi ke database
    const client = await pool.connect()
    console.log("Database connected successfully at:", new Date().toISOString())

    try {
      // Query untuk mendapatkan data notifikasi
      const query = `
        SELECT 
          id, 
          pasien_id,
          caregiver_id,
          jenis,
          pesan,
          waktu_dikirim,
          status_baca
        FROM notifikasi
        ${whereClause}
        ORDER BY waktu_dikirim DESC
      `

      console.log("Executing notifikasi query:", query, "with params:", queryParams)
      const result = await client.query(query, queryParams)
      console.log(`Found ${result.rows.length} notifikasi records`)

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
