import { NextResponse } from "next/server"
import { Pool } from "pg"

// Konfigurasi koneksi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(request) {
  console.log("GET /api/jadwal endpoint dipanggil")

  // Get query parameters
  const { searchParams } = new URL(request.url)
  const caregiverId = searchParams.get("caregiver_id")
  const patientId = searchParams.get("patient_id")

  let whereClause = ""
  const queryParams = []
  let paramCounter = 1

  if (caregiverId) {
    whereClause += " WHERE caregiver_id = $" + paramCounter
    queryParams.push(caregiverId)
    paramCounter++
  }

  if (patientId) {
    whereClause += whereClause ? " AND patient_id = $" + paramCounter : " WHERE patient_id = $" + paramCounter
    queryParams.push(patientId)
    paramCounter++
  }

  try {
    // Koneksi ke database
    const client = await pool.connect()
    console.log("Database connected successfully at:", new Date().toISOString())

    try {
      // Query untuk mendapatkan data jadwal
      const query = `
        SELECT 
          id, 
          caregiver_id,
          patient_id,
          assignment_id,
          tanggal,
          jam_mulai,
          jam_selesai,
          status
        FROM jadwal
        ${whereClause}
        ORDER BY tanggal DESC, jam_mulai ASC
      `

      console.log("Executing jadwal query:", query, "with params:", queryParams)
      const result = await client.query(query, queryParams)
      console.log(`Found ${result.rows.length} jadwal records`)

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
