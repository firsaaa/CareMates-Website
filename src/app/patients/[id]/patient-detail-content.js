// "use client"

// import { useState, useEffect, useRef } from "react"
// import Image from "next/image"
// import { useRouter } from "next/navigation"
// import { getAhmadDistance, getIoTConnectionStatus, getAhmadDistanceSync } from "../../../lib/distance-store"

// export default function PatientDetailContent({ patientId }) {
//   const router = useRouter()
//   const [patient, setPatient] = useState(null)
//   const [caregiver, setCaregiver] = useState(null)
//   const [device, setDevice] = useState(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [error, setError] = useState(null)
//   const [distance, setDistance] = useState(0)
//   const [iotConnectionStatus, setIotConnectionStatus] = useState("disconnected")
//   const isAhmad = Number.parseInt(patientId) === 1

//   // Refs untuk mencegah re-renders berlebihan
//   const distanceRef = useRef(distance)
//   const statusRef = useRef(iotConnectionStatus)

//   // Subscribe ke event updates
//   useEffect(() => {
//     if (!isAhmad) return

//     // Handler untuk update jarak
//     const handleDistanceUpdate = (event) => {
//       const { distance } = event.detail
//       console.log(`[PatientDetail] Received distance update: ${distance}m`)
//       setDistance(distance)
//       distanceRef.current = distance
//     }

//     // Handler untuk update status koneksi
//     const handleStatusUpdate = (event) => {
//       const { status } = event.detail
//       console.log(`[PatientDetail] Received IoT status update: ${status}`)
//       setIotConnectionStatus(status)
//       statusRef.current = status
//     }

//     // Register event listeners
//     window.addEventListener("ahmad-distance-update", handleDistanceUpdate)
//     window.addEventListener("iot-status-update", handleStatusUpdate)

//     // Cleanup
//     return () => {
//       window.removeEventListener("ahmad-distance-update", handleDistanceUpdate)
//       window.removeEventListener("iot-status-update", handleStatusUpdate)
//     }
//   }, [isAhmad])

//   // Fetch patient data
//   useEffect(() => {
//     console.log("=== PATIENT DETAIL CONTENT: Memulai fetch data ===")
//     console.log("PATIENT DETAIL CONTENT: Patient ID:", patientId)

//     const token = localStorage.getItem("token")
//     if (!token) {
//       router.replace("/auth/login")
//       return
//     }

//     const fetchPatientData = async () => {
//       try {
//         // Fetch patient data
//         const patientRes = await fetch(`/api/patients/${patientId}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         })

//         if (!patientRes.ok) {
//           throw new Error("Failed to fetch patient data")
//         }

//         const patientData = await patientRes.json()
//         console.log("PATIENT DETAIL CONTENT: Patient data:", patientData)
//         setPatient(patientData)

//         // Fetch device data if available
//         if (patientData.device_id) {
//           const deviceRes = await fetch(`/api/devices/${patientData.device_id}`, {
//             headers: { Authorization: `Bearer ${token}` },
//           })

//           if (deviceRes.ok) {
//             const deviceData = await deviceRes.json()
//             console.log("PATIENT DETAIL CONTENT: Device data:", deviceData)
//             // Log the device status to verify
//             console.log("PATIENT DETAIL CONTENT: Device status:", deviceData.status)
//             console.log("PATIENT DETAIL CONTENT: Is status 'aktif'?", deviceData.status === "aktif")
//             setDevice(deviceData)
//           } else {
//             console.error("Failed to fetch device data:", await deviceRes.text())
//           }
//         } else {
//           console.log("PATIENT DETAIL CONTENT: No device_id available for patient")
//         }

//         // Fetch assignments to get caregiver
//         const assignmentRes = await fetch(`/api/assignments`, {
//           headers: { Authorization: `Bearer ${token}` },
//         })

//         if (assignmentRes.ok) {
//           const assignments = await assignmentRes.json()
//           const patientAssignment = assignments.find((a) => a.patient_id === Number.parseInt(patientId))

//           if (patientAssignment) {
//             // Fetch caregiver data
//             const caregiverRes = await fetch(`/api/users/${patientAssignment.caregiver_id}`, {
//               headers: { Authorization: `Bearer ${token}` },
//             })

//             if (caregiverRes.ok) {
//               const caregiverData = await caregiverRes.json()
//               console.log("PATIENT DETAIL CONTENT: Caregiver data:", caregiverData)
//               setCaregiver(caregiverData)
//             }
//           }
//         }

//         // Untuk Ahmad (ID 1), ambil jarak dari centralized store
//         if (Number.parseInt(patientId) === 1) {
//           // Gunakan nilai dari centralized store
//           const savedDistance = getAhmadDistance()
//           const savedStatus = getIoTConnectionStatus()

//           if (savedDistance !== null) {
//             setDistance(savedDistance)
//             distanceRef.current = savedDistance
//             console.log("[PatientDetail] Loaded saved distance for Ahmad:", savedDistance)
//           } else {
//             // Fallback ke nilai default
//             setDistance(getAhmadDistanceSync())
//           }

//           if (savedStatus) {
//             setIotConnectionStatus(savedStatus)
//             statusRef.current = savedStatus
//             console.log("[PatientDetail] Loaded saved IoT status:", savedStatus)
//           }
//         } else {
//           // Generate consistent dummy distance data for other patients
//           // Menggunakan patientId sebagai seed untuk konsistensi
//           const dummyDistance = ((Number.parseInt(patientId) * 17) % 100) + 10
//           setDistance(dummyDistance)
//           console.log("[PatientDetail] Generated dummy distance:", dummyDistance)
//         }
//       } catch (error) {
//         console.error("PATIENT DETAIL CONTENT: Error fetching data:", error)
//         setError("Gagal memuat data pasien. Silakan coba lagi nanti.")
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchPatientData()
//   }, [patientId, router])

//   const formatDate = (dateString) => {
//     if (!dateString) return "Tidak tersedia"
//     const date = new Date(dateString)
//     return date.toLocaleDateString("id-ID", {
//       day: "numeric",
//       month: "long",
//       year: "numeric",
//     })
//   }

//   // Ensure this function matches dashboard implementation
//   const getStatusColor = (status) => {
//     return status ? "#4ade80" : "#f87171" // green for on, red for off
//   }

//   const getDistanceColor = (distance) => {
//     if (distance <= 10) return "#4ade80" // green for close
//     if (distance <= 50) return "#facc15" // yellow for medium distance
//     return "#f87171" // red for far
//   }

//   const handleBack = () => {
//     router.back()
//   }

//   // Compute bracelet status for more consistent usage
//   const braceletActive = device?.status === "aktif" || false;

//   if (isLoading) {
//     return (
//       <div
//         style={{
//           backgroundColor: "#7b42f6",
//           height: "100vh",
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           color: "white",
//         }}
//       >
//         <div style={{ textAlign: "center" }}>
//           <Image src="/logo.png" alt="CareMates Logo" width={60} height={60} />
//           <p style={{ marginTop: "1rem" }}>Loading Patient Data...</p>
//         </div>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           minHeight: "100vh",
//           backgroundColor: "#f9fafb",
//         }}
//       >
//         <header
//           style={{
//             backgroundColor: "#7b42f6",
//             padding: "1rem",
//             color: "white",
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//           }}
//         >
//           <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
//             <Image src="/logo.png" alt="CareMates Logo" width={40} height={40} />
//             <h1 style={{ fontWeight: "bold", fontSize: "1.5rem" }}>CareMates</h1>
//           </div>
//         </header>

//         <main style={{ flex: 1, padding: "2rem", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
//           <div
//             style={{
//               backgroundColor: "white",
//               borderRadius: "0.75rem",
//               boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
//               padding: "2rem",
//               textAlign: "center",
//             }}
//           >
//             <p style={{ color: "#f87171", marginBottom: "1rem" }}>{error}</p>
//             <button
//               onClick={handleBack}
//               style={{
//                 backgroundColor: "#7b42f6",
//                 color: "white",
//                 padding: "0.5rem 1rem",
//                 borderRadius: "0.5rem",
//                 border: "none",
//                 cursor: "pointer",
//               }}
//             >
//               Kembali
//             </button>
//           </div>
//         </main>

//         <footer
//           style={{
//             backgroundColor: "#7b42f6",
//             padding: "1rem",
//             color: "white",
//             textAlign: "center",
//           }}
//         >
//           <p>© 2025 CareMates - Connect with your loved ones</p>
//         </footer>
//       </div>
//     )
//   }

//   if (!patient) {
//     return (
//       <div
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           minHeight: "100vh",
//           backgroundColor: "#f9fafb",
//         }}
//       >
//         <header
//           style={{
//             backgroundColor: "#7b42f6",
//             padding: "1rem",
//             color: "white",
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//           }}
//         >
//           <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
//             <Image src="/logo.png" alt="CareMates Logo" width={40} height={40} />
//             <h1 style={{ fontWeight: "bold", fontSize: "1.5rem" }}>CareMates</h1>
//           </div>
//         </header>

//         <main style={{ flex: 1, padding: "2rem", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
//           <div
//             style={{
//               backgroundColor: "white",
//               borderRadius: "0.75rem",
//               boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
//               padding: "2rem",
//               textAlign: "center",
//             }}
//           >
//             <p style={{ marginBottom: "1rem" }}>Pasien tidak ditemukan</p>
//             <button
//               onClick={handleBack}
//               style={{
//                 backgroundColor: "#7b42f6",
//                 color: "white",
//                 padding: "0.5rem 1rem",
//                 borderRadius: "0.5rem",
//                 border: "none",
//                 cursor: "pointer",
//               }}
//             >
//               Kembali
//             </button>
//           </div>
//         </main>

//         <footer
//           style={{
//             backgroundColor: "#7b42f6",
//             padding: "1rem",
//             color: "white",
//             textAlign: "center",
//           }}
//         >
//           <p>© 2025 CareMates - Connect with your loved ones</p>
//         </footer>
//       </div>
//     )
//   }

//   return (
//     <div
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         minHeight: "100vh",
//         backgroundColor: "#f9fafb",
//       }}
//     >
//       {/* Header */}
//       <header
//         style={{
//           backgroundColor: "#7b42f6",
//           padding: "1rem",
//           color: "white",
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
//           <Image src="/logo.png" alt="CareMates Logo" width={40} height={40} />
//           <h1 style={{ fontWeight: "bold", fontSize: "1.5rem" }}>CareMates</h1>
//         </div>

//         <button
//           onClick={() => router.push("/dashboard")}
//           style={{
//             backgroundColor: "#40e0d0",
//             padding: "0.5rem 1rem",
//             borderRadius: "0.5rem",
//             border: "none",
//             fontWeight: "bold",
//             color: "#333",
//             cursor: "pointer",
//           }}
//         >
//           Dashboard
//         </button>
//       </header>

//       {/* Main Content */}
//       <main style={{ flex: 1, padding: "2rem", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
//         {/* Back Button */}
//         <button
//           onClick={handleBack}
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: "0.5rem",
//             backgroundColor: "transparent",
//             border: "none",
//             color: "#6b7280",
//             marginBottom: "1rem",
//             cursor: "pointer",
//             padding: "0.5rem",
//             borderRadius: "0.25rem",
//           }}
//         >
//           ← Kembali
//         </button>

//         {/* Patient Card */}
//         <div
//           style={{
//             backgroundColor: "white",
//             borderRadius: "0.75rem",
//             boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
//             padding: "2rem",
//             border: "2px solid #40e0d0",
//             marginBottom: "1.5rem",
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginBottom: "1.5rem",
//             }}
//           >
//             <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{patient?.nama}</h1>
//             <span
//               style={{
//                 backgroundColor: "#40e0d0",
//                 color: "white",
//                 padding: "0.25rem 0.75rem",
//                 borderRadius: "9999px",
//                 fontSize: "0.875rem",
//                 fontWeight: "medium",
//               }}
//             >
//               Patient
//             </span>
//           </div>

//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
//               gap: "1.5rem",
//             }}
//           >
//             {/* Patient Info */}
//             <div>
//               <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#7b42f6" }}>
//                 Informasi Pasien
//               </h2>

//               <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
//                 <div>
//                   <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Alamat:</p>
//                   <p>{patient?.alamat || "Tidak tersedia"}</p>
//                 </div>

//                 <div>
//                   <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Tanggal Lahir:</p>
//                   <p>{formatDate(patient?.tanggal_lahir)}</p>
//                 </div>

//                 <div>
//                   <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Jenis Kelamin:</p>
//                   <p>{patient?.jenis_kelamin || "Tidak tersedia"}</p>
//                 </div>

//                 <div>
//                   <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Penyakit:</p>
//                   <p>{patient?.penyakit || "Tidak tersedia"}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Caregiver & Device Info */}
//             <div>
//               <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#7b42f6" }}>
//                 Informasi Perawatan
//               </h2>

//               <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
//                 <div>
//                   <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Caregiver:</p>
//                   <p>{caregiver ? caregiver.nama : "Tidak tersedia"}</p>
//                 </div>

//                 <div>
//                   <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Bracelet Status:</p>
//                   <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//                     <div
//                       style={{
//                         width: "0.75rem",
//                         height: "0.75rem",
//                         borderRadius: "9999px",
//                         backgroundColor: getStatusColor(braceletActive),
//                         transition: "background-color 0.3s ease",
//                       }}
//                     ></div>
//                     <span>{braceletActive ? "Active" : "Inactive"}</span>
//                   </div>
//                 </div>

//                 <div>
//                   <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Distance:</p>
//                   <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//                     <div
//                       style={{
//                         width: "0.75rem",
//                         height: "0.75rem",
//                         borderRadius: "9999px",
//                         backgroundColor: getDistanceColor(distance),
//                         transition: "background-color 0.3s ease",
//                       }}
//                     ></div>
//                     <span>
//                       {distance} meters
//                       {isAhmad && <span style={{ fontSize: "0.75rem", color: "#6b7280" }}> (Real-time)</span>}
//                     </span>
//                   </div>
//                 </div>

//                 <div>
//                   <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Device ID:</p>
//                   <p>{patient?.device_id || "Tidak tersedia"}</p>
//                 </div>

//                 {/* IoT Status - hanya untuk Ahmad */}
//                 {isAhmad && (
//                   <div
//                     style={{
//                       marginTop: "0.5rem",
//                       padding: "0.5rem",
//                       backgroundColor: "#f9fafb",
//                       borderRadius: "0.375rem",
//                       border: "1px solid #e5e7eb",
//                     }}
//                   >
//                     <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//                       <div
//                         style={{
//                           width: "0.5rem",
//                           height: "0.5rem",
//                           borderRadius: "9999px",
//                           backgroundColor: iotConnectionStatus === "connected" ? "#4ade80" : "#f87171",
//                           transition: "background-color 0.5s ease",
//                         }}
//                       ></div>
//                       <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
//                         IoT Device: {iotConnectionStatus === "connected" ? "Connected" : "Disconnected"}
//                         {iotConnectionStatus === "connected" && (
//                           <span style={{ fontWeight: "bold", color: "#059669" }}>
//                             {" • "}Real-time GPS tracking active
//                           </span>
//                         )}
//                       </span>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Activity Section */}
//         <div
//           style={{
//             backgroundColor: "white",
//             borderRadius: "0.75rem",
//             boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
//             padding: "2rem",
//           }}
//         >
//           <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "#7b42f6" }}>
//             Aktivitas Terbaru
//           </h2>

//           <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
//             {/* Dummy activity data */}
//             {[1, 2, 3].map((item) => (
//               <div
//                 key={item}
//                 style={{
//                   padding: "1rem",
//                   borderRadius: "0.5rem",
//                   backgroundColor: "#f3f4f6",
//                   display: "flex",
//                   justifyContent: "space-between",
//                 }}
//               >
//                 <div>
//                   <p style={{ fontWeight: "medium" }}>
//                     {item === 1 ? "Pemeriksaan rutin" : item === 2 ? "Pemberian obat" : "Pengukuran tekanan darah"}
//                   </p>
//                   <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
//                     {item === 1
//                       ? "Dilakukan oleh " + (caregiver?.nama || "Caregiver")
//                       : item === 2
//                         ? "Obat: Paracetamol 500mg"
//                         : "Hasil: 120/80 mmHg"}
//                   </p>
//                 </div>
//                 <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
//                   {item === 1 ? "Hari ini" : item === 2 ? "Kemarin" : "3 hari yang lalu"}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </main>

//       {/* Footer */}
//       <footer
//         style={{
//           backgroundColor: "#7b42f6",
//           padding: "1rem",
//           color: "white",
//           textAlign: "center",
//         }}
//       >
//         <p>© 2025 CareMates - Connect with your loved ones</p>
//       </footer>
//     </div>
//   )
// }
"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { getAhmadDistance, getIoTConnectionStatus, getAhmadDistanceSync } from "../../../lib/distance-store"

export default function PatientDetailContent({ patientId }) {
  const router = useRouter()
  const [patient, setPatient] = useState(null)
  const [caregiver, setCaregiver] = useState(null)
  const [device, setDevice] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [distance, setDistance] = useState(0)
  const [iotConnectionStatus, setIotConnectionStatus] = useState("disconnected")
  const isAhmad = Number.parseInt(patientId) === 1

  // Refs untuk mencegah re-renders berlebihan
  const distanceRef = useRef(distance)
  const statusRef = useRef(iotConnectionStatus)

  // Subscribe ke event updates
  useEffect(() => {
    if (!isAhmad) return

    // Handler untuk update jarak
    const handleDistanceUpdate = (event) => {
      const { distance } = event.detail
      console.log(`[PatientDetail] Received distance update: ${distance}m`)
      setDistance(distance)
      distanceRef.current = distance
    }

    // Handler untuk update status koneksi
    const handleStatusUpdate = (event) => {
      const { status } = event.detail
      console.log(`[PatientDetail] Received IoT status update: ${status}`)
      setIotConnectionStatus(status)
      statusRef.current = status
    }

    // Register event listeners
    window.addEventListener("ahmad-distance-update", handleDistanceUpdate)
    window.addEventListener("iot-status-update", handleStatusUpdate)

    // Cleanup
    return () => {
      window.removeEventListener("ahmad-distance-update", handleDistanceUpdate)
      window.removeEventListener("iot-status-update", handleStatusUpdate)
    }
  }, [isAhmad])

  // Fetch patient data
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

        // Fetch all devices to match dashboard logic
        const devicesRes = await fetch(`/api/devices`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (devicesRes.ok) {
          const devices = await devicesRes.json()
          console.log("PATIENT DETAIL CONTENT: All devices:", devices)
          
          // Find device by patient's device_id
          if (patientData.device_id) {
            const deviceData = devices.find((d) => d.id === patientData.device_id)
            if (deviceData) {
              console.log("PATIENT DETAIL CONTENT: Found device data:", deviceData)
              console.log("PATIENT DETAIL CONTENT: Device status:", deviceData.status)
              console.log("PATIENT DETAIL CONTENT: Is status 'aktif'?", deviceData.status === "aktif")
              setDevice(deviceData)
            } else {
              console.log("PATIENT DETAIL CONTENT: Device not found in devices list")
            }
          } else {
            console.log("PATIENT DETAIL CONTENT: No device_id available for patient")
          }
        } else {
          console.error("Failed to fetch devices data:", await devicesRes.text())
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

        // Untuk Ahmad (ID 1), ambil jarak dari centralized store
        if (Number.parseInt(patientId) === 1) {
          // Gunakan nilai dari centralized store
          const savedDistance = getAhmadDistance()
          const savedStatus = getIoTConnectionStatus()

          if (savedDistance !== null) {
            setDistance(savedDistance)
            distanceRef.current = savedDistance
            console.log("[PatientDetail] Loaded saved distance for Ahmad:", savedDistance)
          } else {
            // Fallback ke nilai default
            setDistance(getAhmadDistanceSync())
          }

          if (savedStatus) {
            setIotConnectionStatus(savedStatus)
            statusRef.current = savedStatus
            console.log("[PatientDetail] Loaded saved IoT status:", savedStatus)
          }
        } else {
          // Generate consistent dummy distance data for other patients
          // Menggunakan patientId sebagai seed untuk konsistensi
          const dummyDistance = ((Number.parseInt(patientId) * 17) % 100) + 10
          setDistance(dummyDistance)
          console.log("[PatientDetail] Generated dummy distance:", dummyDistance)
        }
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

  // Ensure this function matches dashboard implementation
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

  // FIXED: Compute bracelet status correctly to match dashboard logic
  const braceletStatus = device ? device.status === "aktif" : false

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
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{patient?.nama}</h1>
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
                  <p>{patient?.alamat || "Tidak tersedia"}</p>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Tanggal Lahir:</p>
                  <p>{formatDate(patient?.tanggal_lahir)}</p>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Jenis Kelamin:</p>
                  <p>{patient?.jenis_kelamin || "Tidak tersedia"}</p>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Penyakit:</p>
                  <p>{patient?.penyakit || "Tidak tersedia"}</p>
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
                        backgroundColor: getStatusColor(braceletStatus),
                        transition: "background-color 0.3s ease",
                      }}
                    ></div>
                    <span>{braceletStatus ? "Active" : "Inactive"}</span>
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
                        transition: "background-color 0.3s ease",
                      }}
                    ></div>
                    <span>
                      {distance} meters
                      {isAhmad && <span style={{ fontSize: "0.75rem", color: "#6b7280" }}> (Real-time)</span>}
                    </span>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Device ID:</p>
                  <p>{patient?.device_id || "Tidak tersedia"}</p>
                </div>

                {/* IoT Status - hanya untuk Ahmad */}
                {isAhmad && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.5rem",
                      backgroundColor: "#f9fafb",
                      borderRadius: "0.375rem",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div
                        style={{
                          width: "0.5rem",
                          height: "0.5rem",
                          borderRadius: "9999px",
                          backgroundColor: iotConnectionStatus === "connected" ? "#4ade80" : "#f87171",
                          transition: "background-color 0.5s ease",
                        }}
                      ></div>
                      <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        IoT Device: {iotConnectionStatus === "connected" ? "Connected" : "Disconnected"}
                        {iotConnectionStatus === "connected" && (
                          <span style={{ fontWeight: "bold", color: "#059669" }}>
                            {" • "}Real-time GPS tracking active
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
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