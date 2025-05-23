"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isApiAvailable, setIsApiAvailable] = useState(true)

  // Cek status API saat komponen dimuat
  useEffect(() => {
    async function checkApiStatus() {
      try {
        const res = await fetch("/", { 
          method: "GET",
          cache: "no-store",
          next: { revalidate: 0 }
        })
        setIsApiAvailable(res.ok)
      } catch (err) {
        console.warn("API status check failed:", err)
        setIsApiAvailable(false)
      }
    }

    checkApiStatus()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validasi input dasar
      if (!email || !password) {
        setError("Email dan password harus diisi")
        setIsLoading(false)
        return
      }

      if (password.length < 6) {
        setError("Password minimal 6 karakter")
        setIsLoading(false)
        return
      }

      // Coba login menggunakan Azure API terlebih dahulu jika tersedia
      if (isApiAvailable) {
        try {
          const azureRes = await fetch("https://caremates-asafb3frbqcqdbdb.southeastasia-01.azurewebsites.net/api/v1/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
            signal: AbortSignal.timeout(5000) // Timeout setelah 5 detik
          })

          if (azureRes.ok) {
            const azureData = await azureRes.json()
            
            // Simpan token di localStorage
            localStorage.setItem("token", azureData.token)

            // Simpan informasi user jika tersedia
            if (azureData.user) {
              localStorage.setItem("user", JSON.stringify(azureData.user))
            }

            // Redirect ke dashboard
            router.push("/dashboard")
            return
          }
        } catch (azureErr) {
          console.log("Azure API tidak tersedia, mencoba API lokal")
          // Lanjut ke API lokal
        }
      }

      // Fallback ke API lokal
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      let data
      try {
        data = await res.json()
      } catch (parseErr) {
        throw new Error("Gagal memproses respons dari server")
      }

      if (!res.ok) {
        // Tampilkan pesan error dari server atau pesan default
        const errorMessage = data.error || data.message || "Login gagal"
        setError(errorMessage)
        return
      }

      // Jika server memberikan pesan peringatan tapi login berhasil
      if (data.warning) {
        console.warn("Login warning:", data.warning)
      }

      // Simpan token di localStorage
      localStorage.setItem("token", data.token)

      // Simpan informasi user jika tersedia
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user))
        
        // Log untuk debugging
        console.log(`Login berhasil sebagai ${data.user.role}: ${data.user.nama}`)
      }

      // Redirect ke dashboard
      router.push("/dashboard")
    } catch (err) {
      console.error("Login error:", err)
      setError("Terjadi kesalahan saat menghubungi server. Coba lagi dalam beberapa saat.")
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

      <h1 style={{ marginTop: "1rem", fontWeight: "bold" }}>CareMates</h1>
      <p>Connect with your loved ones</p>

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
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
          }}
        />

        {error && <p style={{ color: "#ffbaba", fontSize: "0.9rem", marginTop: "-0.5rem" }}>{error}</p>}

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
          {isLoading ? "Loading..." : "Login"}
        </button>
      </form>

      <button
        onClick={() => router.push("/auth/register")}
        style={{
          marginTop: "1rem",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid white",
          background: "transparent",
          color: "white",
          cursor: "pointer",
          width: "300px",
        }}
      >
        Register
      </button>

      {!isApiAvailable && (
        <p style={{ 
          fontSize: "0.8rem", 
          marginTop: "1rem", 
          color: "#ffbaba", 
          textAlign: "center",
          maxWidth: "300px" 
        }}>
          Beberapa layanan mungkin tidak tersedia. Tim kami sedang menangani masalah ini.
        </p>
      )}
    </div>
  )
}