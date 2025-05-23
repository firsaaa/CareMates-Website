import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("GET /api/jarak endpoint dipanggil")

    // Generate dummy data instead of querying the database
    const dummyData = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      id_patient: index + 1,
      jarak_terakhir: Math.floor(Math.random() * 100), // Random distance between 0-100 meters
      timestamp: new Date().toISOString(),
    }))

    console.log(`Generated ${dummyData.length} dummy jarak records`)

    return NextResponse.json(dummyData)
  } catch (error) {
    console.error("Error in jarak API:", error)
    return NextResponse.json({ error: "Failed to get jarak data" }, { status: 500 })
  }
}
