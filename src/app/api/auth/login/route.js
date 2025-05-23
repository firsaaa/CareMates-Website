import { NextResponse } from "next/server"
import { loginSchema } from "../../../../lib/validation"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { Pool } from "pg"

// Konfigurasi koneksi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const JWT_SECRET = process.env.JWT_SECRET

// Fungsi untuk login menggunakan database lokal
async function loginWithLocalDb(email, password) {
  try {
    // Koneksi ke database
    const client = await pool.connect()

    try {
      // Cari user berdasarkan email
      const query = "SELECT * FROM users WHERE email = $1"
      const result = await client.query(query, [email])

      if (result.rows.length === 0) {
        return { success: false, error: "Email atau password salah", status: 401 }
      }

      const user = result.rows[0]

      // Verifikasi password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash)
      if (!isPasswordValid) {
        return { success: false, error: "Email atau password salah", status: 401 }
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          nama: user.nama,
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      )

      // Update last login (jika ada kolom last_login)
      try {
        await client.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id])
      } catch (updateError) {
        console.warn("Tidak bisa update last_login:", updateError.message)
      }

      return {
        success: true,
        token,
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
        },
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Database error:", error)
    return { success: false, error: "Gagal terhubung ke database", status: 500 }
  }
}

export async function POST(req) {
  try {
    const body = await req.json()

    // Validate input
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.errors }, { status: 400 })
    }

    // Use the external API first
    try {
      console.log("Mencoba login melalui API eksternal...")

      const apiResponse = await fetch(
        "https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000),
        },
      )

      console.log("API response status:", apiResponse.status)

      // Coba mendapatkan respons JSON
      let responseData
      try {
        responseData = await apiResponse.json()
        console.log("API response data:", responseData)
      } catch (parseError) {
        console.error("Error parsing API response:", parseError)
        console.log("Mencoba login dengan database lokal sebagai fallback...")

        // Fallback ke database lokal jika API eksternal gagal
        const localLoginResult = await loginWithLocalDb(body.email, body.password)

        if (!localLoginResult.success) {
          return NextResponse.json({ error: localLoginResult.error }, { status: localLoginResult.status || 500 })
        }

        return NextResponse.json(localLoginResult)
      }

      // Jika API merespons sukses
      if (apiResponse.ok) {
        console.log("Login berhasil melalui API eksternal")

        // PENTING: Pastikan format token benar
        // Format respons sesuai yang diharapkan frontend
        const formattedResponse = {
          token: responseData.access_token,
          user: {
            id: 1,
            nama: body.email.split("@")[0],
            email: body.email,
            role: "admin",
          },
        }

        console.log("Formatted response for frontend:", {
          token: formattedResponse.token.substring(0, 20) + "...",
          user: formattedResponse.user,
        })

        return NextResponse.json(formattedResponse)
      }

      // Jika API eksternal gagal, coba login dengan database lokal
      console.log("API eksternal gagal, mencoba login dengan database lokal...")
      const localLoginResult = await loginWithLocalDb(body.email, body.password)

      if (!localLoginResult.success) {
        return NextResponse.json({ error: localLoginResult.error }, { status: localLoginResult.status || 500 })
      }

      return NextResponse.json(localLoginResult)
    } catch (apiError) {
      console.error("Error mengakses API eksternal:", apiError)
      console.log("Mencoba login dengan database lokal sebagai fallback...")

      // Fallback ke database lokal jika API eksternal gagal
      const localLoginResult = await loginWithLocalDb(body.email, body.password)

      if (!localLoginResult.success) {
        return NextResponse.json({ error: localLoginResult.error }, { status: localLoginResult.status || 500 })
      }

      return NextResponse.json(localLoginResult)
    }
  } catch (error) {
    console.error("Error saat proses login:", error)
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 })
  }
}
