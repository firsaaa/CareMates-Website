"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function PatientDetailContent({ patientId }) {
  const router = useRouter()
  const [patient, setPatient] = useState(null)
  const [caregiver, setCaregiver] = useState(null)
  const [device, setDevice] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    console.log("=== PATIENT DETAIL CONTENT: Memulai fetch data ===")
    console.log("PATIENT DETAIL CONTENT: Patient ID:", patientId)

    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/auth/login")
      return
    }

    const fetchPatientData = async () => {
      try {
        // Fetch patient data
        const patientRes = await fetch(`/api/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!patientRes.ok) {
          throw new Error("Failed to fetch patient data")
        }

        const patientData = await patientRes.json()
        console.log("PATIENT DETAIL CONTENT: Patient data:", patientData)
        setPatient(patientData)

        // Fetch device data if available
        if (patientData.device_id) {
          const deviceRes = await fetch(`/api/devices/${patientData.device_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (deviceRes.ok) {
            const deviceData = await deviceRes.json()
            console.log("PATIENT DETAIL CONTENT: Device data:", deviceData)
            setDevice(deviceData)
          }
        }

        // Fetch assignments to get caregiver
        const assignmentRes = await fetch(`/api/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (assignmentRes.ok) {
          const assignments = await assignmentRes.json()
          const patientAssignment = assignments.find((a) => a.patient_id === Number.parseInt(patientId))

          if (patientAssignment) {
            // Fetch caregiver data
            const caregiverRes = await fetch(`/api/users/${patientAssignment.caregiver_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })

            if (caregiverRes.ok) {
              const caregiverData = await caregiverRes.json()
              console.log("PATIENT DETAIL CONTENT: Caregiver data:", caregiverData)
              setCaregiver(caregiverData)
            }
          }
        }

        // Generate random distance data
        setDistance(Math.floor(Math.random() * 100))
      } catch (error) {
        console.error("PATIENT DETAIL CONTENT: Error fetching data:", error)
        setError("Gagal memuat data pasien. Silakan coba lagi nanti.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatientData()
  }, [patientId, router])

  const formatDate = (dateString) => {
    if (!dateString) return "Tidak tersedia"
    const date = new Date(dateString)
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getStatusColor = (status) => {
    return status ? "#4ade80" : "#f87171" // green for on, red for off
  }

  const getDistanceColor = (distance) => {
    if (distance <= 10) return "#4ade80" // green for close
    if (distance <= 50) return "#facc15" // yellow for medium distance
    return "#f87171" // red for far
  }

  const handleBack = () => {
    router.back()
  }

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
          <Image src="/logo.png" alt="CareMates Logo" width={60} height={60} />
          <p style={{ marginTop: "1rem" }}>Loading Patient Data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
        }}
      >
        <header
          style={{
            backgroundColor: "#7b42f6",
            padding: "1rem",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Image src="/logo.png" alt="CareMates Logo" width={40} height={40} />
            <h1 style={{ fontWeight: "bold", fontSize: "1.5rem" }}>CareMates</h1>
          </div>
        </header>

        <main style={{ flex: 1, padding: "2rem", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#f87171", marginBottom: "1rem" }}>{error}</p>
            <button
              onClick={handleBack}
              style={{
                backgroundColor: "#7b42f6",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Kembali
            </button>
          </div>
        </main>

        <footer
          style={{
            backgroundColor: "#7b42f6",
            padding: "1rem",
            color: "white",
            textAlign: "center",
          }}
        >
          <p>© 2025 CareMates - Connect with your loved ones</p>
        </footer>
      </div>
    )
  }

  if (!patient) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
        }}
      >
        <header
          style={{
            backgroundColor: "#7b42f6",
            padding: "1rem",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Image src="/logo.png" alt="CareMates Logo" width={40} height={40} />
            <h1 style={{ fontWeight: "bold", fontSize: "1.5rem" }}>CareMates</h1>
          </div>
        </header>

        <main style={{ flex: 1, padding: "2rem", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <p style={{ marginBottom: "1rem" }}>Pasien tidak ditemukan</p>
            <button
              onClick={handleBack}
              style={{
                backgroundColor: "#7b42f6",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Kembali
            </button>
          </div>
        </main>

        <footer
          style={{
            backgroundColor: "#7b42f6",
            padding: "1rem",
            color: "white",
            textAlign: "center",
          }}
        >
          <p>© 2025 CareMates - Connect with your loved ones</p>
        </footer>
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "#7b42f6",
          padding: "1rem",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Image src="/logo.png" alt="CareMates Logo" width={40} height={40} />
          <h1 style={{ fontWeight: "bold", fontSize: "1.5rem" }}>CareMates</h1>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          style={{
            backgroundColor: "#40e0d0",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "none",
            fontWeight: "bold",
            color: "#333",
            cursor: "pointer",
          }}
        >
          Dashboard
        </button>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
        {/* Back Button */}
        <button
          onClick={handleBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "transparent",
            border: "none",
            color: "#6b7280",
            marginBottom: "1rem",
            cursor: "pointer",
            padding: "0.5rem",
            borderRadius: "0.25rem",
          }}
        >
          ← Kembali
        </button>

        {/* Patient Card */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            padding: "2rem",
            border: "2px solid #40e0d0",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{patient.nama}</h1>
            <span
              style={{
                backgroundColor: "#40e0d0",
                color: "white",
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.875rem",
                fontWeight: "medium",
              }}
            >
              Patient
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {/* Patient Info */}
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#7b42f6" }}>
                Informasi Pasien
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Alamat:</p>
                  <p>{patient.alamat || "Tidak tersedia"}</p>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Tanggal Lahir:</p>
                  <p>{formatDate(patient.tanggal_lahir)}</p>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Jenis Kelamin:</p>
                  <p>{patient.jenis_kelamin || "Tidak tersedia"}</p>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Penyakit:</p>
                  <p>{patient.penyakit || "Tidak tersedia"}</p>
                </div>
              </div>
            </div>

            {/* Caregiver & Device Info */}
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#7b42f6" }}>
                Informasi Perawatan
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Caregiver:</p>
                  <p>{caregiver ? caregiver.nama : "Tidak tersedia"}</p>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Bracelet Status:</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div
                      style={{
                        width: "0.75rem",
                        height: "0.75rem",
                        borderRadius: "9999px",
                        backgroundColor: getStatusColor(device?.status === "aktif"),
                      }}
                    ></div>
                    <span>{device?.status === "aktif" ? "Active" : "Inactive"}</span>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Distance:</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div
                      style={{
                        width: "0.75rem",
                        height: "0.75rem",
                        borderRadius: "9999px",
                        backgroundColor: getDistanceColor(distance),
                      }}
                    ></div>
                    <span>{distance} meters</span>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Device ID:</p>
                  <p>{device ? device.id : "Tidak tersedia"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            padding: "2rem",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#7b42f6" }}>
            Aktivitas Terbaru
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Dummy activity data */}
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                style={{
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "#f3f4f6",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p style={{ fontWeight: "medium" }}>
                    {item === 1 ? "Pemeriksaan rutin" : item === 2 ? "Pemberian obat" : "Pengukuran tekanan darah"}
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    {item === 1
                      ? "Dilakukan oleh " + (caregiver?.nama || "Caregiver")
                      : item === 2
                        ? "Obat: Paracetamol 500mg"
                        : "Hasil: 120/80 mmHg"}
                  </p>
                </div>
                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  {item === 1 ? "Hari ini" : item === 2 ? "Kemarin" : "3 hari yang lalu"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#7b42f6",
          padding: "1rem",
          color: "white",
          textAlign: "center",
        }}
      >
        <p>© 2025 CareMates - Connect with your loved ones</p>
      </footer>
    </div>
  )
}
