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
  const [redirecting, setRedirecting] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Pastikan kode hanya dijalankan di browser
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Cek jika user sudah login
  useEffect(() => {
    if (!isClient) return

    const checkAuth = () => {
      try {
        const token = localStorage.getItem("token")
        const user = localStorage.getItem("user")

        console.log("Memeriksa autentikasi di halaman login:", {
          hasToken: !!token,
          hasUser: !!user,
          redirecting: redirecting,
        })

        if (token && user && !redirecting) {
          console.log("User terautentikasi, mengarahkan ke dashboard...")
          setRedirecting(true)
          router.replace("/dashboard")
        }
      } catch (error) {
        console.error("Error saat memeriksa autentikasi:", error)
      }
    }

    checkAuth()
  }, [router, redirecting, isClient])

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("Memulai proses login untuk:", email)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("Login response status:", res.status)

      let data
      try {
        data = await res.json()
        console.log("Login response data:", {
          success: res.ok,
          hasToken: !!data.token,
          hasUser: !!data.user,
          error: data.error,
        })
      } catch (parseError) {
        console.error("Error parsing login response:", parseError)
        setError("Gagal memproses respons dari server")
        setIsLoading(false)
        return
      }

      if (!res.ok) {
        setError(data.error || "Login gagal")
        setIsLoading(false)
        return
      }

      // Simpan token di localStorage
      if (data.token) {
        localStorage.setItem("token", data.token)
        console.log("Token berhasil disimpan di localStorage")
      } else {
        console.error("Token tidak ada dalam respons")
        setError("Format respons tidak valid")
        setIsLoading(false)
        return
      }

      // Simpan informasi user jika tersedia
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user))
        console.log("User data berhasil disimpan:", data.user)
      } else {
        console.error("User data tidak ada dalam respons")
        setError("Format respons tidak valid")
        setIsLoading(false)
        return
      }

      // Tunggu sebentar untuk memastikan data tersimpan
      setTimeout(() => {
        // Set flag agar tidak terjadi redirect loop
        setRedirecting(true)
        console.log("Login berhasil, mengarahkan ke dashboard...")

        // Redirect ke dashboard dengan replace
        router.replace("/dashboard")
      }, 500)
    } catch (err) {
      console.error("Login error:", err)
      setError("Terjadi kesalahan saat komunikasi dengan server. Coba lagi.")
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
          disabled={isLoading || redirecting}
          style={{
            backgroundColor: "#40e0d0",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            color: "#333",
            cursor: isLoading || redirecting ? "not-allowed" : "pointer",
            opacity: isLoading || redirecting ? 0.7 : 1,
          }}
        >
          {isLoading ? "Loading..." : redirecting ? "Redirecting..." : "Login"}
        </button>
      </form>

      <button
        onClick={() => router.push("/auth/register")}
        disabled={redirecting}
        style={{
          marginTop: "1rem",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid white",
          background: "transparent",
          color: "white",
          cursor: redirecting ? "not-allowed" : "pointer",
          width: "300px",
          opacity: redirecting ? 0.7 : 1,
        }}
      >
        Register
      </button>
    </div>
  )
}
