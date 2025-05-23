"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function CaregiverDetailContent({ caregiverId }) {
  const router = useRouter()
  const [caregiver, setCaregiver] = useState(null)
  const [patients, setPatients] = useState([])
  const [jadwal, setJadwal] = useState([])
  const [notifikasi, setNotifikasi] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [onlineStatus, setOnlineStatus] = useState(true)

  useEffect(() => {
    console.log("=== CAREGIVER DETAIL CONTENT: Memulai fetch data ===")
    console.log("CAREGIVER DETAIL CONTENT: Caregiver ID:", caregiverId)

    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/auth/login")
      return
    }

    const fetchCaregiverData = async () => {
      try {
        // Fetch caregiver data (user with role=caregiver)
        const caregiverRes = await fetch(`/api/users/${caregiverId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!caregiverRes.ok) {
          throw new Error("Failed to fetch caregiver data")
        }

        const caregiverData = await caregiverRes.json()

        // Verify this is a caregiver
        if (caregiverData.role !== "caregiver") {
          throw new Error("User is not a caregiver")
        }

        console.log("CAREGIVER DETAIL CONTENT: Caregiver data:", caregiverData)
        setCaregiver(caregiverData)

        // Fetch assignments to get patients
        const assignmentRes = await fetch(`/api/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (assignmentRes.ok) {
          const assignments = await assignmentRes.json()
          const caregiverAssignments = assignments.filter((a) => a.caregiver_id === Number.parseInt(caregiverId))

          if (caregiverAssignments.length > 0) {
            // Get patient IDs from assignments
            const patientIds = caregiverAssignments.map((a) => a.patient_id)

            // Fetch patients data
            const patientsRes = await fetch(`/api/patients`, {
              headers: { Authorization: `Bearer ${token}` },
            })

            if (patientsRes.ok) {
              const allPatients = await patientsRes.json()
              const assignedPatients = allPatients.filter((p) => patientIds.includes(p.id))
              console.log("CAREGIVER DETAIL CONTENT: Assigned patients:", assignedPatients)
              setPatients(assignedPatients)
            }
          }
        }

        // Fetch jadwal (schedule) data
        const jadwalRes = await fetch(`/api/jadwal?caregiver_id=${caregiverId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (jadwalRes.ok) {
          const jadwalData = await jadwalRes.json()
          console.log("CAREGIVER DETAIL CONTENT: Jadwal data:", jadwalData)
          setJadwal(jadwalData)
        }

        // Fetch notifikasi (notifications) data
        const notifikasiRes = await fetch(`/api/notifikasi?caregiver_id=${caregiverId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (notifikasiRes.ok) {
          const notifikasiData = await notifikasiRes.json()
          console.log("CAREGIVER DETAIL CONTENT: Notifikasi data:", notifikasiData)
          setNotifikasi(notifikasiData)
        }

        // Set random online status for demo
        setOnlineStatus(Math.random() > 0.3)
      } catch (error) {
        console.error("CAREGIVER DETAIL CONTENT: Error fetching data:", error)
        setError("Gagal memuat data caregiver. Silakan coba lagi nanti.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCaregiverData()
  }, [caregiverId, router])

  const formatDate = (dateString) => {
    if (!dateString) return "Tidak tersedia"
    const date = new Date(dateString)
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
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
          <p style={{ marginTop: "1rem" }}>Loading Caregiver Data...</p>
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

  if (!caregiver) {
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
            <p style={{ marginBottom: "1rem" }}>Caregiver tidak ditemukan</p>
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

        {/* Caregiver Card */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            padding: "2rem",
            border: "2px solid #7b42f6",
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
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{caregiver.nama}</h1>
            <span
              style={{
                backgroundColor: "#7b42f6",
                color: "white",
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.875rem",
                fontWeight: "medium",
              }}
            >
              Caregiver
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {/* Caregiver Info */}
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#7b42f6" }}>
                Informasi Caregiver
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    style={{
                      width: "0.75rem",
                      height: "0.75rem",
                      borderRadius: "9999px",
                      backgroundColor: onlineStatus ? "#4ade80" : "#d1d5db",
                    }}
                  ></div>
                  <span>{onlineStatus ? "Online" : "Offline"}</span>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Email:</p>
                  <p>{caregiver.email || "Tidak tersedia"}</p>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No. Telepon:</p>
                  <p>{caregiver.no_telepon || "Tidak tersedia"}</p>
                </div>

                {/* Informasi tambahan (dummy) */}
                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Tempat Lahir:</p>
                  <p>{caregiver.id % 2 === 0 ? "Jakarta" : "Bandung"}</p>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Tanggal Lahir:</p>
                  <p>{formatDate(`1990-${caregiver.id}-01`)}</p>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Jenis Kelamin:</p>
                  <p>{caregiver.id % 2 === 0 ? "Perempuan" : "Laki-laki"}</p>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Pendidikan Terakhir:</p>
                  <p>{caregiver.id % 3 === 0 ? "S1 Keperawatan" : "D3 Keperawatan"}</p>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Pengalaman:</p>
                  <p>{caregiver.id + 2} tahun</p>
                </div>
              </div>
            </div>

            {/* Patients Info */}
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#7b42f6" }}>
                Pasien yang Ditangani
              </h2>

              {patients.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      style={{
                        padding: "1rem",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                      }}
                      onClick={() => router.push(`/patients/${patient.id}`)}
                    >
                      <p style={{ fontWeight: "medium" }}>{patient.nama}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                          {patient.penyakit || "Tidak ada penyakit"}
                        </p>
                        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Lihat Detail →</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Tidak ada pasien yang ditangani</p>
              )}
            </div>
          </div>
        </div>

        {/* Jadwal Section */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            padding: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#7b42f6" }}>
            Jadwal Kerja
          </h2>

          {jadwal.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {jadwal.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#f3f4f6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={{ fontWeight: "medium" }}>
                      {formatDate(item.tanggal)} ({item.jam_mulai} - {item.jam_selesai})
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      Pasien: {patients.find((p) => p.id === item.patient_id)?.nama || "Tidak diketahui"}
                    </p>
                  </div>
                  <span
                    style={{
                      backgroundColor:
                        item.status === "terjadwal" ? "#facc15" : item.status === "selesai" ? "#4ade80" : "#f87171",
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: "medium",
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "1rem",
                borderRadius: "0.5rem",
                backgroundColor: "#f3f4f6",
                textAlign: "center",
              }}
            >
              <p>Tidak ada jadwal yang tersedia</p>
            </div>
          )}
        </div>

        {/* Notifikasi Section */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            padding: "2rem",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#7b42f6" }}>
            Notifikasi Terbaru
          </h2>

          {notifikasi.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {notifikasi.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: item.status_baca ? "#f3f4f6" : "#f0f9ff",
                    borderLeft: item.status_baca ? "none" : "4px solid #7b42f6",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontWeight: item.status_baca ? "normal" : "medium" }}>{item.pesan}</p>
                    <span
                      style={{
                        backgroundColor:
                          item.jenis === "jadwal" ? "#4ade80" : item.jenis === "darurat" ? "#f87171" : "#facc15",
                        color: "white",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "medium",
                      }}
                    >
                      {item.jenis}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.5rem" }}>
                    {new Date(item.waktu_dikirim).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "1rem",
                borderRadius: "0.5rem",
                backgroundColor: "#f3f4f6",
                textAlign: "center",
              }}
            >
              <p>Tidak ada notifikasi</p>
            </div>
          )}
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
