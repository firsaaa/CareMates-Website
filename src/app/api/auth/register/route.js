"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    nama: "",
    email: "",
    no_telepon: "",
    password: "",
    role: "caregiver",
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isApiAvailable, setIsApiAvailable] = useState(true)

  useEffect(() => {
    async function checkApiStatus() {
      try {
        const res = await fetch("/", {
          method: "GET",
          cache: "no-store",
          next: { revalidate: 0 },
        })
        setIsApiAvailable(res.ok)
      } catch (err) {
        console.warn("API status check failed:", err)
        setIsApiAvailable(false)
      }
    }

    checkApiStatus()
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      if (form.password.length < 6) {
        setError("Password harus minimal 6 karakter")
        setIsLoading(false)
        return
      }

      if (!form.nama || !form.email || !form.password) {
        setError("Nama, email dan password wajib diisi")
        setIsLoading(false)
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(form.email)) {
        setError("Format email tidak valid")
        setIsLoading(false)
        return
      }

      if (isApiAvailable) {
        try {
          const azureRes = await fetch(
            "https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/auth/register",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(form),
              signal: AbortSignal.timeout(5000), // Timeout setelah 5 detik
            },
          )

          if (azureRes.ok) {
            await azureRes.json()

            setSuccess("Registrasi berhasil! Mengarahkan ke halaman login...")
            setTimeout(() => router.push("/auth/login"), 2000)
            return
          }

          // Jika status code bukan 2xx, coba dapatkan pesan error
          if (azureRes.status === 400) {
            const azureError = await azureRes.json()
            throw new Error(azureError.error || "Registrasi gagal: Data tidak valid")
          }
        } catch (azureErr) {
          console.log("Azure API tidak tersedia atau error:", azureErr.message)
          // Lanjut ke API lokal
        }
      }

      // Fallback ke API lokal
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      let data
      try {
        data = await res.json()
      } catch {
        throw new Error("Gagal memproses respons dari server")
      }

      if (!res.ok) {
        if (data.error && typeof data.error === "object" && Array.isArray(data.error)) {
          // Handle Zod validation errors array
          setError(data.error.map((err) => err.message).join(", "))
        } else if (data.error) {
          // Handle single error message
          setError(data.error)
        } else {
          setError("Registrasi gagal. Silakan coba lagi.")
        }
        return
      }

      setSuccess("Registrasi berhasil! Mengarahkan ke halaman login...")
      setTimeout(() => router.push("/auth/login"), 2000)
    } catch (err) {
      console.error("Registration error:", err)
      setError(err.message || "Terjadi kesalahan saat berkomunikasi dengan server. Coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        backgroundColor: "#7b42f6",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        padding: "20px",
      }}
    >
      <Image src="/logo.png" alt="CareMates Logo" width={100} height={100} />

      <h1 style={{ marginTop: "1rem", fontWeight: "bold" }}>Register</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: "2rem",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "300px",
          gap: "1rem",
        }}
      >
        <input
          name="nama"
          type="text"
          placeholder="Nama"
          value={form.nama}
          onChange={handleChange}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
          }}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
          }}
        />
        <input
          name="no_telepon"
          type="text"
          placeholder="No Telepon"
          value={form.no_telepon}
          onChange={handleChange}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
          }}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
          }}
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
            backgroundColor: "white",
          }}
        >
          <option value="caregiver">Caregiver</option>
          <option value="patient">Patient</option>
        </select>

        {error && <p style={{ color: "#ffbaba", fontSize: "0.9rem", marginTop: "-0.5rem" }}>{error}</p>}

        {success && <p style={{ color: "#90ee90", fontSize: "0.9rem", marginTop: "-0.5rem" }}>{success}</p>}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            backgroundColor: "#40e0d0",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            color: "#333",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "Processing..." : "Register"}
        </button>

        <button
          onClick={() => router.push("/auth/login")}
          type="button"
          style={{
            marginTop: "0rem",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid white",
            background: "transparent",
            color: "white",
            cursor: "pointer",
            width: "300px",
          }}
        >
          Login
        </button>
      </form>

      {!isApiAvailable && (
        <p
          style={{
            fontSize: "0.8rem",
            marginTop: "1rem",
            color: "#ffbaba",
            textAlign: "center",
            maxWidth: "300px",
          }}
        >
          Beberapa layanan mungkin tidak tersedia. Tim kami sedang menangani masalah ini.
        </p>
      )}
    </div>
  )
}
