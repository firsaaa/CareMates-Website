"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardContent from "./dashboard-content"

export default function DashboardPage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Pastikan kode hanya dijalankan di browser
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Cek autentikasi setelah komponen dimuat di browser
  useEffect(() => {
    if (!isClient) return

    console.log("=== DASHBOARD: Memeriksa autentikasi ===")

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token")
        const user = localStorage.getItem("user")

        console.log("DASHBOARD: Token status:", token ? "Ditemukan" : "Tidak ditemukan")
        console.log("DASHBOARD: User status:", user ? "Ditemukan" : "Tidak ditemukan")

        if (token) {
          console.log("DASHBOARD: Token ditemukan, length:", token.length)
          console.log("DASHBOARD: Token preview:", token.substring(0, 50) + "...")
        }

        if (!token) {
          console.log("DASHBOARD: Token tidak ditemukan, mengarahkan ke halaman login")
          router.replace("/auth/login")
          return
        }

        // Coba decode token untuk validasi
        try {
          const base64Url = token.split(".")[1]
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join(""),
          )
          const decoded = JSON.parse(jsonPayload)
          console.log("DASHBOARD: Token berhasil didecode:", decoded)

          // Cek apakah token sudah expired
          if (decoded.exp && decoded.exp < Date.now() / 1000) {
            console.log("DASHBOARD: Token sudah expired")
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            router.replace("/auth/login")
            return
          }
        } catch (decodeError) {
          console.error("DASHBOARD: Error decoding token:", decodeError)
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          router.replace("/auth/login")
          return
        }

        // Token valid, lanjutkan ke dashboard
        console.log("DASHBOARD: Token valid, menampilkan dashboard")
        setIsAuthenticated(true)
        setIsLoading(false)
      } catch (error) {
        console.error("DASHBOARD: Error saat memeriksa autentikasi:", error)
        router.replace("/auth/login")
      }
    }

    // Tambahkan delay kecil untuk memastikan localStorage sudah siap
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [isClient, router])

  // Tampilkan loading saat memeriksa autentikasi
  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: "#7b42f6",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              backgroundColor: "white",
              borderRadius: "50%",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#7b42f6",
            }}
          >
            CM
          </div>
          <p style={{ marginTop: "1rem" }}>Memuat Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  // Tampilkan dashboard jika sudah terautentikasi
  return <DashboardContent />
}
