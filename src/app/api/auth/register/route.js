import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { Pool } from "pg"

// Konfigurasi koneksi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Admin key untuk validasi registrasi admin
const ADMIN_KEY = "ADMIN_CAREMATES_PALING KECE"

export async function POST(request) {
  try {
    const body = await request.json()
    const { nama, email, no_telepon, password, admin_key } = body

    // Validasi admin key - WAJIB untuk registrasi admin
    if (!admin_key || admin_key !== ADMIN_KEY) {
      return NextResponse.json(
        {
          error: "Admin key tidak valid. Hubungi administrator untuk mendapatkan admin key yang benar.",
        },
        { status: 403 },
      )
    }

    // Validasi data
    if (!nama || !email || !password) {
      return NextResponse.json({ error: "Nama, email dan password wajib diisi" }, { status: 400 })
    }

    // Validasi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 })
    }

    // Validasi password
    if (password.length < 6) {
      return NextResponse.json({ error: "Password harus minimal 6 karakter" }, { status: 400 })
    }

    try {
      // Koneksi ke database
      const client = await pool.connect()

      try {
        // Cek apakah email sudah terdaftar
        const checkQuery = "SELECT * FROM users WHERE email = $1"
        const checkResult = await client.query(checkQuery, [email])

        if (checkResult.rows.length > 0) {
          return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Simpan admin ke database (role selalu admin)
        const insertQuery = `
          INSERT INTO users (nama, email, no_telepon, password_hash, role)
          VALUES ($1, $2, $3, $4, 'admin')
          RETURNING id, nama, email, role
        `
        const values = [nama, email, no_telepon, hashedPassword]

        console.log("Executing insert query with values:", {
          nama,
          email,
          no_telepon,
          password_hash: "[HASHED]",
          role: "admin",
        })

        const result = await client.query(insertQuery, values)

        return NextResponse.json({
          success: true,
          message: "Admin berhasil didaftarkan",
          user: {
            id: result.rows[0].id,
            nama: result.rows[0].nama,
            email: result.rows[0].email,
            role: result.rows[0].role,
          },
        })
      } catch (dbError) {
        console.error("Database error:", dbError)
        return NextResponse.json({ error: "Gagal menyimpan data ke database: " + dbError.message }, { status: 500 })
      } finally {
        client.release()
      }
    } catch (connectionError) {
      console.error("Database connection error:", connectionError)
      return NextResponse.json({ error: "Gagal terhubung ke database" }, { status: 500 })
    }
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 })
  }
}
