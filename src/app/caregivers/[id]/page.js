"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import CaregiverDetailContent from "./caregiver-detail-content"

export default function CaregiverDetailPage() {
  const router = useRouter()
  const params = useParams()
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

    console.log("=== CAREGIVER DETAIL: Memeriksa autentikasi ===")

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token")
        console.log("CAREGIVER DETAIL: Token status:", token ? "Ditemukan" : "Tidak ditemukan")

        if (!token) {
          console.log("CAREGIVER DETAIL: Token tidak ditemukan, mengarahkan ke halaman login")
          router.replace("/auth/login")
          return
        }

        // Token ditemukan, lanjutkan ke halaman detail
        console.log("CAREGIVER DETAIL: Token valid, menampilkan detail caregiver")
        setIsAuthenticated(true)
        setIsLoading(false)
      } catch (error) {
        console.error("CAREGIVER DETAIL: Error saat memeriksa autentikasi:", error)
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
          <p style={{ marginTop: "1rem" }}>Memuat Detail Caregiver...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  // Tampilkan detail caregiver jika sudah terautentikasi
  return <CaregiverDetailContent caregiverId={params.id} />
}
