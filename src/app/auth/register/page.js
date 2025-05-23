"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function AdminRegisterPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    nama: "",
    email: "",
    no_telepon: "",
    password: "",
    admin_key: "",
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      // Validasi admin key
      if (!form.admin_key) {
        setError("Admin key wajib diisi")
        setIsLoading(false)
        return
      }

      // Validasi data
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

      if (form.password.length < 6) {
        setError("Password harus minimal 6 karakter")
        setIsLoading(false)
        return
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        if (Array.isArray(data)) {
          setError(data.map((err) => err.message).join(", "))
        } else {
          setError(data.error || "Registrasi gagal")
        }
        return
      }

      setSuccess("Admin berhasil didaftarkan! Mengarahkan ke halaman login...")
      setTimeout(() => router.push("/auth/login"), 2000)
    } catch (err) {
      console.error("Registration error:", err)
      setError("Terjadi kesalahan. Coba lagi.")
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

      <h1 style={{ marginTop: "1rem", fontWeight: "bold" }}>Registrasi Admin</h1>
      <p style={{ fontSize: "0.9rem", textAlign: "center", marginTop: "0.5rem" }}>
        Daftarkan admin baru dengan admin key
      </p>

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
          name="admin_key"
          type="password"
          placeholder="Admin Key"
          value={form.admin_key}
          onChange={handleChange}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "2px solid #40e0d0",
            fontSize: "1rem",
            backgroundColor: "#f0f9ff",
            color: "#333",
          }}
        />

        <input
          name="nama"
          type="text"
          placeholder="Nama Lengkap"
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

        <div
          style={{
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: "rgba(64, 224, 208, 0.2)",
            border: "1px solid #40e0d0",
            textAlign: "center",
            fontSize: "0.9rem",
          }}
        >
          <strong>Role: Admin</strong>
          <br />
          <small>Semua pendaftar akan menjadi admin</small>
        </div>

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
          {isLoading ? "Mendaftarkan..." : "Daftar sebagai Admin"}
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
          Sudah punya akun? Login
        </button>
      </form>

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: "8px",
          fontSize: "0.8rem",
          textAlign: "center",
          maxWidth: "300px",
        }}
      >
        <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Informasi Penting:</p>
        <p>• Admin key diberikan secara offline</p>
        <p>• Hanya admin yang dapat mengakses sistem</p>
        <p>• Hubungi administrator jika belum memiliki admin key</p>
      </div>
    </div>
  )
}
