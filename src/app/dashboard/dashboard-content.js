// "use client"

// import { useState, useEffect, useCallback, useMemo } from "react"
// import Image from "next/image"
// import DistanceMonitor, { DistanceStatus } from "../components/distance-monitor"
// import { useRouter } from "next/navigation"
// import { getAhmadDistance, getIoTConnectionStatus, getAhmadDistanceSync } from "../../lib/distance-store"

// export default function DashboardContent() {
//   const router = useRouter()
//   const [careData, setCareData] = useState([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [filter, setFilter] = useState("all")
//   const [searchTerm, setSearchTerm] = useState("")
//   const [user, setUser] = useState(null)
//   const [realTimeDistances, setRealTimeDistances] = useState({
//     1: getAhmadDistanceSync(), // Initialize with current value
//   })
//   const [iotConnectionStatus, setIoTConnectionStatus] = useState(getIoTConnectionStatus())

//   // Subscribe ke event updates
//   useEffect(() => {
//     // Handler untuk update jarak
//     const handleDistanceUpdate = (event) => {
//       const { distance } = event.detail
//       console.log(`[Dashboard] Received distance update: ${distance}m`)
//       setRealTimeDistances((prev) => ({
//         ...prev,
//         1: distance,
//       }))

//       // Update careData juga untuk Ahmad
//       setCareData((prevData) =>
//         prevData.map((item) => {
//           if (item.role === "patient" && item.id === 1) {
//             return {
//               ...item,
//               distance: distance,
//             }
//           }
//           return item
//         }),
//       )
//     }

//     // Handler untuk update status koneksi
//     const handleStatusUpdate = (event) => {
//       const { status } = event.detail
//       console.log(`[Dashboard] Received IoT status update: ${status}`)
//       setIoTConnectionStatus(status)
//     }

//     // Register event listeners
//     window.addEventListener("ahmad-distance-update", handleDistanceUpdate)
//     window.addEventListener("iot-status-update", handleStatusUpdate)

//     // Cleanup
//     return () => {
//       window.removeEventListener("ahmad-distance-update", handleDistanceUpdate)
//       window.removeEventListener("iot-status-update", handleStatusUpdate)
//     }
//   }, [])

//   // Stabilized distance update function
//   const handleDistanceUpdate = useCallback((patientId, distance) => {
//     setRealTimeDistances((prev) => {
//       // Hanya update jika jarak benar-benar berubah
//       if (prev[patientId] !== distance) {
//         console.log(`Distance update for patient ${patientId}: ${distance}m`)
//         return {
//           ...prev,
//           [patientId]: distance,
//         }
//       }
//       return prev
//     })
//   }, [])

//   // Stabilized connection status update function
//   const handleConnectionStatusUpdate = useCallback((status) => {
//     setIoTConnectionStatus((prevStatus) => {
//       if (prevStatus !== status) {
//         console.log(`IoT connection status: ${status}`)
//         return status
//       }
//       return prevStatus
//     })
//   }, [])

//   // Memoized filtered data untuk menghindari re-calculation yang tidak perlu
//   const filteredData = useMemo(() => {
//     return careData.filter((item) => {
//       const roleMatch = filter === "all" || item.role === filter
//       const searchMatch =
//         item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (item.role === "patient" && item.caregiver.toLowerCase().includes(searchTerm.toLowerCase())) ||
//         (item.role === "caregiver" &&
//           item.patients &&
//           Array.isArray(item.patients) &&
//           item.patients.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase())))

//       return roleMatch && searchMatch
//     })
//   }, [careData, filter, searchTerm])

//   useEffect(() => {
//     console.log("=== DASHBOARD CONTENT: Memulai fetch data ===")

//     // Load saved distances dari centralized store
//     const savedDistance = getAhmadDistance()
//     const savedStatus = getIoTConnectionStatus()

//     if (savedDistance !== null) {
//       setRealTimeDistances((prev) => ({
//         ...prev,
//         1: savedDistance,
//       }))
//       console.log("[Dashboard] Loaded saved distance for Ahmad:", savedDistance)
//     }

//     if (savedStatus) {
//       setIoTConnectionStatus(savedStatus)
//       console.log("[Dashboard] Loaded saved IoT status:", savedStatus)
//     }

//     // Check authentication
//     const token = localStorage.getItem("token")
//     if (!token) {
//       console.log("DASHBOARD CONTENT: Token tidak ditemukan")
//       router.replace("/auth/login")
//       return
//     }

//     console.log("DASHBOARD CONTENT: Token ditemukan, memulai fetch data")

//     // Fetch user data
//     const fetchUserData = async () => {
//       try {
//         const userId = getUserIdFromToken(token)
//         console.log("DASHBOARD CONTENT: User ID dari token:", userId)

//         if (!userId) {
//           throw new Error("Invalid token")
//         }

//         const res = await fetch(`/api/users/${userId}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         })

//         if (!res.ok) {
//           throw new Error("Failed to fetch user data")
//         }

//         const userData = await res.json()
//         console.log("DASHBOARD CONTENT: User data berhasil diambil:", userData)
//         setUser(userData)
//       } catch (error) {
//         console.error("DASHBOARD CONTENT: Error fetching user data:", error)
//       }
//     }

//     // Fetch dashboard data
//     const fetchDashboardData = async () => {
//       try {
//         console.log("DASHBOARD CONTENT: Memulai fetch dashboard data")

//         // Fetch all required data
//         const [usersRes, patientRes, assignmentRes, devicesRes] = await Promise.all([
//           fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } }),
//           fetch("/api/patients", { headers: { Authorization: `Bearer ${token}` } }),
//           fetch("/api/assignments", { headers: { Authorization: `Bearer ${token}` } }),
//           fetch("/api/devices", { headers: { Authorization: `Bearer ${token}` } }),
//         ])

//         if (!usersRes.ok || !patientRes.ok || !assignmentRes.ok || !devicesRes.ok) {
//           throw new Error("Failed to fetch data")
//         }

//         const [users, patients, assignments, devices] = await Promise.all([
//           usersRes.json(),
//           patientRes.json(),
//           assignmentRes.json(),
//           devicesRes.json(),
//         ])

//         console.log("DASHBOARD CONTENT: All data fetched successfully")
//         console.log("DASHBOARD CONTENT: Devices data:", devices)

//         // Filter caregivers from users
//         const caregivers = users.filter((user) => user.role === "caregiver")

//         // Process caregiver data
//         const processedCaregivers = caregivers.map((caregiver) => {
//           const caregiverAssignments = assignments.filter((a) => a.caregiver_id === caregiver.id)
//           const patientIds = caregiverAssignments.map((a) => a.patient_id)
//           const assignedPatients = patients.filter((p) => patientIds.includes(p.id))

//           return {
//             id: caregiver.id,
//             name: caregiver.nama,
//             role: "caregiver",
//             patients: assignedPatients.map((p) => p.nama),
//             online: true,
//           }
//         })

//         // Process patient data
//         const processedPatients = patients.map((patient) => {
//           const patientAssignment = assignments.find((a) => a.patient_id === patient.id)
//           const caregiver = patientAssignment ? caregivers.find((c) => c.id === patientAssignment.caregiver_id) : null
//           const device = devices.find((d) => d.id === patient.device_id)
//           const braceletStatus = device ? device.status === "aktif" : false

//           // Gunakan real-time distance untuk Ahmad (id: 1), dummy untuk yang lain
//           let distance
//           if (patient.id === 1) {
//             // Gunakan jarak dari centralized store untuk Ahmad
//             distance = realTimeDistances[1] || getAhmadDistanceSync()
//             console.log(`Using real-time distance for Ahmad: ${distance}m`)
//           } else {
//             // Generate consistent dummy data berdasarkan patient ID
//             distance = ((patient.id * 17) % 100) + 10 // Consistent dummy data
//           }

//           return {
//             id: patient.id,
//             name: patient.nama,
//             role: "patient",
//             caregiver: caregiver ? caregiver.nama : "Unassigned",
//             braceletStatus: braceletStatus,
//             distance: distance,
//             device_id: patient.device_id, // Tambahkan device_id
//           }
//         })

//         // Combine data
//         const combinedData = [...processedCaregivers, ...processedPatients]
//         console.log("DASHBOARD CONTENT: Combined data:", combinedData.length, "items")
//         setCareData(combinedData)
//       } catch (error) {
//         console.error("DASHBOARD CONTENT: Error fetching dashboard data:", error)
//         setCareData([]) // Set empty data if there's an error
//       } finally {
//         console.log("DASHBOARD CONTENT: Selesai loading data")
//         setIsLoading(false)
//       }
//     }

//     fetchUserData()
//     fetchDashboardData()
//   }, [router, realTimeDistances])

//   // Helper function to extract user ID from JWT token
//   const getUserIdFromToken = (token) => {
//     try {
//       const base64Url = token.split(".")[1]
//       const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
//       const jsonPayload = decodeURIComponent(
//         atob(base64)
//           .split("")
//           .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
//           .join(""),
//       )

//       const decoded = JSON.parse(jsonPayload)
//       return decoded.sub ? decoded.sub : decoded.id
//     } catch (error) {
//       console.error("Error decoding token:", error)
//       return null
//     }
//   }

//   const handleLogout = () => {
//     console.log("DASHBOARD CONTENT: Logout dipanggil")
//     localStorage.removeItem("token")
//     localStorage.removeItem("user")
//     router.replace("/auth/login")
//   }

//   const getStatusColor = (status) => {
//     return status ? "#4ade80" : "#f87171"
//   }

//   const getDistanceColor = (distance) => {
//     if (distance <= 10) return "#4ade80"
//     if (distance <= 50) return "#facc15"
//     return "#f87171"
//   }

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
//           <p style={{ marginTop: "1rem" }}>Loading Dashboard Data...</p>
//         </div>
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
//       {/* Distance Monitor Component - Berjalan di background */}
//       <DistanceMonitor
//         patientId={1}
//         onDistanceUpdate={handleDistanceUpdate}
//         onConnectionStatusUpdate={handleConnectionStatusUpdate}
//       />

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
//           <h1 style={{ fontWeight: "bold", fontSize: "1.5rem" }}>CareMates Dashboard</h1>
//         </div>

//         <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
//           {user && <span>{user.nama}</span>}
//           <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//             <div
//               style={{
//                 width: "0.5rem",
//                 height: "0.5rem",
//                 borderRadius: "9999px",
//                 backgroundColor: iotConnectionStatus === "connected" ? "#4ade80" : "#f87171",
//                 transition: "background-color 0.5s ease", // Smooth transition
//               }}
//             />
//             <span style={{ fontSize: "0.75rem" }}>
//               IoT {iotConnectionStatus === "connected" ? "Connected" : "Disconnected"}
//             </span>
//           </div>
//           <button
//             onClick={handleLogout}
//             style={{
//               backgroundColor: "#40e0d0",
//               padding: "0.5rem 1rem",
//               borderRadius: "0.5rem",
//               border: "none",
//               fontWeight: "bold",
//               color: "#333",
//               cursor: "pointer",
//             }}
//           >
//             Logout
//           </button>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main style={{ flex: 1, padding: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
//         {/* Filters and Search */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: "2rem",
//             flexWrap: "wrap",
//             gap: "1rem",
//           }}
//         >
//           <div style={{ display: "flex", gap: "1rem" }}>
//             <button
//               onClick={() => setFilter("all")}
//               style={{
//                 backgroundColor: filter === "all" ? "#7b42f6" : "#e5e7eb",
//                 color: filter === "all" ? "white" : "#374151",
//                 padding: "0.5rem 1rem",
//                 borderRadius: "0.5rem",
//                 border: "none",
//                 fontWeight: filter === "all" ? "bold" : "normal",
//                 cursor: "pointer",
//               }}
//             >
//               All
//             </button>
//             <button
//               onClick={() => setFilter("caregiver")}
//               style={{
//                 backgroundColor: filter === "caregiver" ? "#7b42f6" : "#e5e7eb",
//                 color: filter === "caregiver" ? "white" : "#374151",
//                 padding: "0.5rem 1rem",
//                 borderRadius: "0.5rem",
//                 border: "none",
//                 fontWeight: filter === "caregiver" ? "bold" : "normal",
//                 cursor: "pointer",
//               }}
//             >
//               Caregivers
//             </button>
//             <button
//               onClick={() => setFilter("patient")}
//               style={{
//                 backgroundColor: filter === "patient" ? "#7b42f6" : "#e5e7eb",
//                 color: filter === "patient" ? "white" : "#374151",
//                 padding: "0.5rem 1rem",
//                 borderRadius: "0.5rem",
//                 border: "none",
//                 fontWeight: filter === "patient" ? "bold" : "normal",
//                 cursor: "pointer",
//               }}
//             >
//               Patients
//             </button>
//           </div>

//           <div>
//             <input
//               type="text"
//               placeholder="Search name..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               style={{
//                 padding: "0.5rem 1rem",
//                 borderRadius: "0.5rem",
//                 border: "1px solid #d1d5db",
//                 width: "200px",
//               }}
//             />
//           </div>
//         </div>

//         {/* Dashboard Cards */}
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
//             gap: "1.5rem",
//           }}
//         >
//           {filteredData.map((item) => (
//             <div
//               key={item.id}
//               style={{
//                 backgroundColor: "white",
//                 borderRadius: "0.75rem",
//                 boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
//                 padding: "1.5rem",
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: "1rem",
//                 border: item.role === "caregiver" ? "2px solid #7b42f6" : "2px solid #40e0d0",
//               }}
//             >
//               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                 <h2 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{item.name}</h2>
//                 <span
//                   style={{
//                     backgroundColor: item.role === "caregiver" ? "#7b42f6" : "#40e0d0",
//                     color: "white",
//                     padding: "0.25rem 0.75rem",
//                     borderRadius: "9999px",
//                     fontSize: "0.875rem",
//                     fontWeight: "medium",
//                   }}
//                 >
//                   {item.role === "caregiver" ? "Caregiver" : "Patient"}
//                 </span>
//               </div>

//               {item.role === "caregiver" ? (
//                 <>
//                   <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//                     <div
//                       style={{
//                         width: "0.75rem",
//                         height: "0.75rem",
//                         borderRadius: "9999px",
//                         backgroundColor: item.online ? "#4ade80" : "#d1d5db",
//                       }}
//                     ></div>
//                     <span>{item.online ? "Online" : "Offline"}</span>
//                   </div>

//                   <div>
//                     <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>Assigned Patients:</p>
//                     {item.patients && item.patients.length > 0 ? (
//                       <ul style={{ paddingLeft: "1.5rem" }}>
//                         {item.patients.map((patient, index) => (
//                           <li key={index} style={{ marginBottom: "0.25rem" }}>
//                             {patient}
//                           </li>
//                         ))}
//                       </ul>
//                     ) : (
//                       <p style={{ fontSize: "0.875rem" }}>No patients assigned</p>
//                     )}
//                   </div>
//                 </>
//               ) : (
//                 <>
//                   <div>
//                     <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Caregiver:</p>
//                     <p>{item.caregiver}</p>
//                   </div>

//                   <div style={{ display: "flex", justifyContent: "space-between" }}>
//                     <div>
//                       <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Bracelet Status:</p>
//                       <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//                         <div
//                           style={{
//                             width: "0.75rem",
//                             height: "0.75rem",
//                             borderRadius: "9999px",
//                             backgroundColor: getStatusColor(item.braceletStatus),
//                           }}
//                         ></div>
//                         <span>{item.braceletStatus ? "Active" : "Inactive"}</span>
//                       </div>
//                     </div>

//                     <div>
//                       <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Distance:</p>
//                       <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//                         <div
//                           style={{
//                             width: "0.75rem",
//                             height: "0.75rem",
//                             borderRadius: "9999px",
//                             backgroundColor: getDistanceColor(item.distance),
//                           }}
//                         ></div>
//                         <span>
//                           {item.distance} meters
//                           {item.id === 1 && <span style={{ fontSize: "0.75rem", color: "#6b7280" }}> (Real-time)</span>}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   <div>
//                     <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Device ID:</p>
//                     <p>{item.device_id || "Tidak tersedia"}</p>
//                   </div>

//                   {/* Status IoT untuk Ahmad */}
//                   {item.id === 1 && <DistanceStatus patientId={item.id} connectionStatus={iotConnectionStatus} />}
//                 </>
//               )}

//               <button
//                 onClick={() => router.push(`/${item.role}s/${item.id}`)}
//                 style={{
//                   backgroundColor: "#f3f4f6",
//                   padding: "0.5rem",
//                   borderRadius: "0.5rem",
//                   border: "none",
//                   marginTop: "auto",
//                   cursor: "pointer",
//                   display: "flex",
//                   justifyContent: "center",
//                   alignItems: "center",
//                   fontWeight: "medium",
//                   color: "#4b5563",
//                 }}
//               >
//                 View Details
//               </button>
//             </div>
//           ))}
//         </div>

//         {filteredData.length === 0 && (
//           <div
//             style={{
//               textAlign: "center",
//               padding: "3rem",
//               backgroundColor: "white",
//               borderRadius: "0.75rem",
//               boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
//             }}
//           >
//             <p style={{ color: "#6b7280" }}>No data found. Try adjusting your filters.</p>
//           </div>
//         )}
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
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Image from "next/image"
import DistanceMonitor, { DistanceStatus } from "../components/distance-monitor"
import { useRouter } from "next/navigation"
import {
  getAhmadDistance,
  getIoTConnectionStatus,
  getAhmadDistanceSync,
  getAhmadCoordinates,
} from "../../lib/distance-store"
import { WebSocketConnectionTest } from "../components/websocket-test"

export default function DashboardContent() {
  const router = useRouter()
  const [careData, setCareData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState(null)
  const [realTimeDistances, setRealTimeDistances] = useState({
    1: getAhmadDistanceSync(),
  })
  const [iotConnectionStatus, setIoTConnectionStatus] = useState(getIoTConnectionStatus())
  const [ahmadCoordinates, setAhmadCoordinates] = useState({
    lastLat: null,
    lastLon: null,
  })
  const [error, setError] = useState(null)
  const wsRef = useRef(null)
  const fetchingRef = useRef(false) // Prevent multiple simultaneous fetches

  // Direct WebSocket connection
  useEffect(() => {
    const connectDirectWebSocket = () => {
      try {
        console.log("[Dashboard] Connecting direct WebSocket...")
        wsRef.current = new WebSocket("wss://caremates-websocket.codebloop.my.id/")

        wsRef.current.onopen = () => {
          console.log("[Dashboard] Direct WebSocket connected")
          setIoTConnectionStatus("connected")
        }

        wsRef.current.onmessage = (event) => {
          try {
            console.log("[Dashboard] Direct WebSocket received:", event.data)

            let data

            if (typeof event.data === "string") {
              let dataStr = event.data
              if (!dataStr.startsWith("{")) {
                dataStr = "{" + dataStr
              }
              if (!dataStr.endsWith("}")) {
                dataStr = dataStr + "}"
              }
              data = JSON.parse(dataStr)
            } else if (typeof event.data === "object") {
              data = event.data
            } else {
              data = JSON.parse(event.data.toString())
            }

            console.log("[Dashboard] Direct WebSocket processed:", data)

            if (data && data.lastLat && data.lastLon) {
              const lat = Number.parseFloat(data.lastLat)
              const lon = Number.parseFloat(data.lastLon)

              console.log("[Dashboard] Direct WebSocket updating coordinates:", lat, lon)

              setAhmadCoordinates({ lastLat: lat, lastLon: lon })

              setCareData((prevData) =>
                prevData.map((item) => {
                  if (item.role === "patient" && item.id === 1) {
                    return {
                      ...item,
                      lastLat: lat,
                      lastLon: lon,
                    }
                  }
                  return item
                }),
              )
            }
          } catch (error) {
            console.error("[Dashboard] Direct WebSocket parse error:", error)
          }
        }

        wsRef.current.onclose = () => {
          console.log("[Dashboard] Direct WebSocket closed")
          setIoTConnectionStatus("disconnected")
        }

        wsRef.current.onerror = (error) => {
          console.error("[Dashboard] Direct WebSocket error:", error)
          setIoTConnectionStatus("error")
        }
      } catch (error) {
        console.error("[Dashboard] Failed to create direct WebSocket:", error)
      }
    }

    connectDirectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    const handleDistanceUpdate = (event) => {
      const { distance } = event.detail
      console.log(`[Dashboard] Received distance update: ${distance.toFixed(2)}m`)
      setRealTimeDistances((prev) => ({
        ...prev,
        1: distance,
      }))

      setCareData((prevData) =>
        prevData.map((item) => {
          if (item.role === "patient" && item.id === 1) {
            return {
              ...item,
              distance: distance,
            }
          }
          return item
        }),
      )
    }

    const handleStatusUpdate = (event) => {
      const { status } = event.detail
      console.log(`[Dashboard] Received IoT status update: ${status}`)
      setIoTConnectionStatus(status)
    }

    const handleCoordinatesUpdate = (event) => {
      const { lastLat, lastLon, latitude, longitude } = event.detail
      const lat = lastLat || latitude
      const lon = lastLon || longitude
      console.log(`[Dashboard] Received coordinates update - lastLat: ${lat}, lastLon: ${lon}`)

      setAhmadCoordinates({ lastLat: lat, lastLon: lon })

      setCareData((prevData) =>
        prevData.map((item) => {
          if (item.role === "patient" && item.id === 1) {
            return {
              ...item,
              lastLat: lat,
              lastLon: lon,
            }
          }
          return item
        }),
      )
    }

    window.addEventListener("ahmad-distance-update", handleDistanceUpdate)
    window.addEventListener("iot-status-update", handleStatusUpdate)
    window.addEventListener("ahmad-coordinates-update", handleCoordinatesUpdate)
    window.addEventListener("iot-coordinates-update", handleCoordinatesUpdate)

    return () => {
      window.removeEventListener("ahmad-distance-update", handleDistanceUpdate)
      window.removeEventListener("iot-status-update", handleStatusUpdate)
      window.removeEventListener("ahmad-coordinates-update", handleCoordinatesUpdate)
      window.removeEventListener("iot-coordinates-update", handleCoordinatesUpdate)
    }
  }, [])

  const handleDistanceUpdate = useCallback((patientId, distance) => {
    setRealTimeDistances((prev) => {
      if (prev[patientId] !== distance) {
        console.log(`Distance update for patient ${patientId}: ${distance.toFixed(2)}m`)
        return {
          ...prev,
          [patientId]: distance,
        }
      }
      return prev
    })
  }, [])

  const handleConnectionStatusUpdate = useCallback((status) => {
    setIoTConnectionStatus((prevStatus) => {
      if (prevStatus !== status) {
        console.log(`IoT connection status: ${status}`)
        return status
      }
      return prevStatus
    })
  }, [])

  const handleCoordinatesUpdate = useCallback((patientId, coordinates) => {
    if (patientId === 1) {
      setAhmadCoordinates(coordinates)
    }
  }, [])

  const filteredData = useMemo(() => {
    return careData.filter((item) => {
      const roleMatch = filter === "all" || item.role === filter
      const searchMatch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.role === "patient" && item.caregiver.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.role === "caregiver" &&
          item.patients &&
          Array.isArray(item.patients) &&
          item.patients.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase())))

      return roleMatch && searchMatch
    })
  }, [careData, filter, searchTerm])

  useEffect(() => {
    console.log("=== DASHBOARD CONTENT: Starting data fetch ===")

    // Load saved data immediately
    const savedDistance = getAhmadDistance()
    const savedStatus = getIoTConnectionStatus()
    const savedCoordinates = getAhmadCoordinates()

    if (savedDistance !== null) {
      setRealTimeDistances((prev) => ({
        ...prev,
        1: savedDistance,
      }))
    }

    if (savedStatus) {
      setIoTConnectionStatus(savedStatus)
    }

    if (savedCoordinates) {
      setAhmadCoordinates({
        lastLat: savedCoordinates.lastLat,
        lastLon: savedCoordinates.lastLon,
      })
    }

    const token = localStorage.getItem("token")
    if (!token) {
      console.log("DASHBOARD CONTENT: No token found")
      router.replace("/auth/login")
      return
    }

    const fetchData = async () => {
      // Prevent multiple simultaneous fetches
      if (fetchingRef.current) {
        console.log("[Dashboard] Fetch already in progress, skipping...")
        return
      }

      fetchingRef.current = true
      setError(null)

      try {
        console.log("DASHBOARD CONTENT: Starting data fetch with token")

        // Fetch user data first
        const userId = getUserIdFromToken(token)
        if (!userId) {
          throw new Error("Invalid token")
        }

        const userRes = await fetch(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!userRes.ok) {
          throw new Error(`Failed to fetch user data: ${userRes.status}`)
        }

        const userData = await userRes.json()
        setUser(userData)

        // Fetch all required data in parallel
        const [usersRes, patientRes, assignmentRes, devicesRes] = await Promise.all([
          fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/patients", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/assignments", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/devices", { headers: { Authorization: `Bearer ${token}` } }),
        ])

        // Check all responses
        if (!usersRes.ok) throw new Error(`Users API failed: ${usersRes.status}`)
        if (!patientRes.ok) throw new Error(`Patients API failed: ${patientRes.status}`)
        if (!assignmentRes.ok) throw new Error(`Assignments API failed: ${assignmentRes.status}`)
        if (!devicesRes.ok) throw new Error(`Devices API failed: ${devicesRes.status}`)

        const [users, patients, assignments, devices] = await Promise.all([
          usersRes.json(),
          patientRes.json(),
          assignmentRes.json(),
          devicesRes.json(),
        ])

        console.log("DASHBOARD CONTENT: All data fetched successfully")

        // Process data
        const caregivers = users.filter((user) => user.role === "caregiver")

        const processedCaregivers = caregivers.map((caregiver) => {
          const caregiverAssignments = assignments.filter((a) => a.caregiver_id === caregiver.id)
          const patientIds = caregiverAssignments.map((a) => a.patient_id)
          const assignedPatients = patients.filter((p) => patientIds.includes(p.id))

          return {
            id: caregiver.id,
            name: caregiver.nama,
            role: "caregiver",
            patients: assignedPatients.map((p) => p.nama),
            online: true,
          }
        })

        const processedPatients = patients.map((patient) => {
          const patientAssignment = assignments.find((a) => a.patient_id === patient.id)
          const caregiver = patientAssignment ? caregivers.find((c) => c.id === patientAssignment.caregiver_id) : null
          const device = devices.find((d) => d.id === patient.device_id)
          const braceletStatus = device ? device.status === "aktif" : false

          let distance
          let lastLat = null
          let lastLon = null

          if (patient.id === 1) {
            distance = savedDistance || 50
            lastLat = savedCoordinates?.lastLat || null
            lastLon = savedCoordinates?.lastLon || null
          } else {
            distance = ((patient.id * 17) % 100) + 10
          }

          return {
            id: patient.id,
            name: patient.nama,
            role: "patient",
            caregiver: caregiver ? caregiver.nama : "Unassigned",
            braceletStatus: braceletStatus,
            distance: distance,
            device_id: patient.device_id,
            lastLat: lastLat,
            lastLon: lastLon,
          }
        })

        const combinedData = [...processedCaregivers, ...processedPatients]
        setCareData(combinedData)
        console.log("DASHBOARD CONTENT: Data processing completed, setting isLoading to false")
      } catch (error) {
        console.error("DASHBOARD CONTENT: Error fetching data:", error)
        setError(error.message)
        setCareData([])
      } finally {
        setIsLoading(false)
        fetchingRef.current = false
      }
    }

    // Only fetch if not already loading and no data
    if (isLoading && careData.length === 0) {
      fetchData()
    }
  }, []) // Empty dependency array

  const getUserIdFromToken = (token) => {
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
      return decoded.sub ? decoded.sub : decoded.id
    } catch (error) {
      console.error("Error decoding token:", error)
      return null
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.replace("/auth/login")
  }

  const getStatusColor = (status) => {
    return status ? "#4ade80" : "#f87171"
  }

  const getDistanceColor = (distance) => {
    if (distance <= 10) return "#4ade80"
    if (distance <= 50) return "#facc15"
    return "#f87171"
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
          <p style={{ marginTop: "1rem" }}>Loading Dashboard Data...</p>
        </div>
      </div>
    )
  }

  if (error) {
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
          <p style={{ marginTop: "1rem", color: "#f87171" }}>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#40e0d0",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
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
      <WebSocketConnectionTest />

      <DistanceMonitor
        patientId={1}
        onDistanceUpdate={handleDistanceUpdate}
        onConnectionStatusUpdate={handleConnectionStatusUpdate}
        onCoordinatesUpdate={handleCoordinatesUpdate}
      />

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
          <h1 style={{ fontWeight: "bold", fontSize: "1.5rem" }}>CareMates Dashboard</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user && <span>{user.nama}</span>}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "0.5rem",
                height: "0.5rem",
                borderRadius: "9999px",
                backgroundColor: iotConnectionStatus === "connected" ? "#4ade80" : "#f87171",
                transition: "background-color 0.5s ease",
              }}
            />
            <span style={{ fontSize: "0.75rem" }}>
              IoT {iotConnectionStatus === "connected" ? "Connected" : "Disconnected"}
            </span>
          </div>
          <button
            onClick={handleLogout}
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
            Logout
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => setFilter("all")}
              style={{
                backgroundColor: filter === "all" ? "#7b42f6" : "#e5e7eb",
                color: filter === "all" ? "white" : "#374151",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                fontWeight: filter === "all" ? "bold" : "normal",
                cursor: "pointer",
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter("caregiver")}
              style={{
                backgroundColor: filter === "caregiver" ? "#7b42f6" : "#e5e7eb",
                color: filter === "caregiver" ? "white" : "#374151",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                fontWeight: filter === "caregiver" ? "bold" : "normal",
                cursor: "pointer",
              }}
            >
              Caregivers
            </button>
            <button
              onClick={() => setFilter("patient")}
              style={{
                backgroundColor: filter === "patient" ? "#7b42f6" : "#e5e7eb",
                color: filter === "patient" ? "white" : "#374151",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                fontWeight: filter === "patient" ? "bold" : "normal",
                cursor: "pointer",
              }}
            >
              Patients
            </button>
          </div>

          <div>
            <input
              type="text"
              placeholder="Search name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                width: "200px",
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {filteredData.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              style={{
                backgroundColor: "white",
                borderRadius: "0.75rem",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                border: item.role === "caregiver" ? "2px solid #7b42f6" : "2px solid #40e0d0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{item.name}</h2>
                <span
                  style={{
                    backgroundColor: item.role === "caregiver" ? "#7b42f6" : "#40e0d0",
                    color: "white",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.875rem",
                    fontWeight: "medium",
                  }}
                >
                  {item.role === "caregiver" ? "Caregiver" : "Patient"}
                </span>
              </div>

              {item.role === "caregiver" ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div
                      style={{
                        width: "0.75rem",
                        height: "0.75rem",
                        borderRadius: "9999px",
                        backgroundColor: item.online ? "#4ade80" : "#d1d5db",
                      }}
                    ></div>
                    <span>{item.online ? "Online" : "Offline"}</span>
                  </div>

                  <div>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>Assigned Patients:</p>
                    {item.patients && item.patients.length > 0 ? (
                      <ul style={{ paddingLeft: "1.5rem" }}>
                        {item.patients.map((patient, index) => (
                          <li key={index} style={{ marginBottom: "0.25rem" }}>
                            {patient}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ fontSize: "0.875rem" }}>No patients assigned</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Caregiver:</p>
                    <p>{item.caregiver}</p>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Bracelet Status:</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div
                          style={{
                            width: "0.75rem",
                            height: "0.75rem",
                            borderRadius: "9999px",
                            backgroundColor: getStatusColor(item.braceletStatus),
                          }}
                        ></div>
                        <span>{item.braceletStatus ? "Active" : "Inactive"}</span>
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
                            backgroundColor: getDistanceColor(item.distance),
                          }}
                        ></div>
                        <span>
                          {typeof item.distance === "number" ? item.distance.toFixed(2) : item.distance} meters
                          {item.id === 1 && <span style={{ fontSize: "0.75rem", color: "#6b7280" }}> (Real-time)</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  {item.id === 1 && (
                    <div>
                      <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>GPS Coordinates:</p>
                      <div
                        style={{
                          padding: "0.75rem",
                          backgroundColor: "#f8fafc",
                          borderRadius: "0.5rem",
                          fontSize: "0.8rem",
                          border: "2px solid #e2e8f0",
                          fontFamily: "monospace",
                        }}
                      >
                        <div style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center" }}>
                          <span style={{ fontWeight: "bold", color: "#1e293b", minWidth: "60px" }}>Latitude:</span>
                          <span
                            style={{
                              color: "#0f766e",
                              backgroundColor: "#f0fdfa",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "0.25rem",
                              border: "1px solid #5eead4",
                              fontWeight: "medium",
                              fontSize: "0.85rem",
                            }}
                          >
                            {item.lastLat !== null && item.lastLat !== undefined
                              ? item.lastLat.toString()
                              : "Waiting for GPS data..."}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{ fontWeight: "bold", color: "#1e293b", minWidth: "60px" }}>Longitude:</span>
                          <span
                            style={{
                              color: "#0f766e",
                              backgroundColor: "#f0fdfa",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "0.25rem",
                              border: "1px solid #5eead4",
                              fontWeight: "medium",
                              fontSize: "0.85rem",
                            }}
                          >
                            {item.lastLon !== null && item.lastLon !== undefined
                              ? item.lastLon.toString()
                              : "Waiting for GPS data..."}
                          </span>
                        </div>
                        {item.lastLat !== null && item.lastLon !== null && (
                          <div
                            style={{
                              marginTop: "0.5rem",
                              paddingTop: "0.5rem",
                              borderTop: "1px solid #e2e8f0",
                              fontSize: "0.7rem",
                              color: "#64748b",
                              fontStyle: "italic",
                            }}
                          >
                            🌍 Real-time GPS coordinates from IoT device
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Device ID:</p>
                    <p>{item.device_id || "Tidak tersedia"}</p>
                  </div>

                  {item.id === 1 && (
                    <DistanceStatus
                      patientId={item.id}
                      connectionStatus={iotConnectionStatus}
                      distance={item.distance}
                      coordinates={{
                        lastLat: item.lastLat,
                        lastLon: item.lastLon,
                      }}
                    />
                  )}
                </>
              )}

              <button
                onClick={() => router.push(`/${item.role}s/${item.id}`)}
                style={{
                  backgroundColor: "#f3f4f6",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  marginTop: "auto",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontWeight: "medium",
                  color: "#4b5563",
                }}
              >
                View Details
              </button>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              backgroundColor: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            }}
          >
            <p style={{ color: "#6b7280" }}>No data found. Try adjusting your filters.</p>
          </div>
        )}
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
