// "use client"

// import { useState, useEffect } from "react"
// import Image from "next/image"
// import { useRouter } from "next/navigation"

// export default function DashboardPage() {
//   const router = useRouter()
//   const [careData, setCareData] = useState([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [filter, setFilter] = useState("all") // "all", "caregiver", "patient"
//   const [searchTerm, setSearchTerm] = useState("")
//   const [user, setUser] = useState(null)

//   // Mock distance data untuk menggantikan API jarak
//   const mockDistanceData = [
//     { id_patient: 1, jarak_terakhir: 10 },
//     { id_patient: 2, jarak_terakhir: 5 },
//     { id_patient: 3, jarak_terakhir: 150 },
//     { id_patient: 4, jarak_terakhir: 25 },
//     { id_patient: 5, jarak_terakhir: 8 },
//   ]

//   useEffect(() => {
//     // Check authentication
//     const token = localStorage.getItem("token")
//     if (!token) {
//       router.push("/auth/login")
//       return
//     }

//     // Fetch user data
//     const fetchUserData = async () => {
//       try {
//         // Get user ID from token (you might need to decode JWT)
//         const userId = getUserIdFromToken(token)
//         const res = await fetch(`/api/users/${userId}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         })

//         if (!res.ok) {
//           throw new Error("Failed to fetch user data")
//         }

//         const userData = await res.json()
//         setUser(userData)
//       } catch (error) {
//         console.error("Error fetching user data:", error)
//         // Fallback to mock user data instead of redirecting
//         setUser({
//           nama: "Admin User",
//           email: "admin@caremates.com",
//           role: "admin",
//         })
//       }
//     }

//     // Fetch dashboard data
//     const fetchDashboardData = async () => {
//       try {
//         // Fetch caregivers
//         const caregiverRes = await fetch("/api/users?role=caregiver", {
//           headers: { Authorization: `Bearer ${token}` },
//         })

//         if (!caregiverRes.ok) {
//           throw new Error("Failed to fetch caregivers")
//         }

//         const caregivers = await caregiverRes.json()

//         // Fetch patients
//         const patientRes = await fetch("/api/patients", {
//           headers: { Authorization: `Bearer ${token}` },
//         })

//         if (!patientRes.ok) {
//           throw new Error("Failed to fetch patients")
//         }

//         const patients = await patientRes.json()

//         // Fetch assignments to link caregivers and patients
//         const assignmentRes = await fetch("/api/assignments", {
//           headers: { Authorization: `Bearer ${token}` },
//         })

//         if (!assignmentRes.ok) {
//           throw new Error("Failed to fetch assignments")
//         }

//         const assignments = await assignmentRes.json()

//         // Process data to match the expected format
//         const processedCaregivers = caregivers.map((caregiver) => {
//           // Find assignments for this caregiver
//           const caregiverAssignments = assignments.filter((a) => a.caregiver_id === caregiver.id)

//           // Get patient names for this caregiver
//           const patientIds = caregiverAssignments.map((a) => a.patient_id)
//           const assignedPatients = patients.filter((p) => patientIds.includes(p.id))

//           return {
//             id: caregiver.id,
//             name: caregiver.nama,
//             role: "caregiver",
//             patients: assignedPatients.map((p) => p.nama),
//             online: true, // Assuming all are online for now
//           }
//         })

//         const processedPatients = patients.map((patient) => {
//           // Find assignment for this patient
//           const patientAssignment = assignments.find((a) => a.patient_id === patient.id)

//           // Find caregiver for this patient
//           const caregiver = patientAssignment ? caregivers.find((c) => c.id === patientAssignment.caregiver_id) : null

//           // Find distance data from mock data instead of API
//           const distanceData = mockDistanceData.find((j) => j.id_patient === patient.id) || 
//             { jarak_terakhir: Math.floor(Math.random() * 100) }

//           return {
//             id: patient.id,
//             name: patient.nama,
//             role: "patient",
//             caregiver: caregiver ? caregiver.nama : "Unassigned",
//             braceletStatus: patient.device_id ? true : false, // If device_id exists, bracelet is active
//             distance: distanceData.jarak_terakhir,
//           }
//         })

//         // Combine data
//         const combinedData = [...processedCaregivers, ...processedPatients]
//         setCareData(combinedData)
//       } catch (error) {
//         console.error("Error fetching dashboard data:", error)
//         // Fallback to mock data if API calls fail
//         const mockData = [
//           {
//             id: 1,
//             name: "Budi Santoso",
//             role: "caregiver",
//             patients: ["Ahmad Rizki", "Siti Nur"],
//             online: true,
//           },
//           {
//             id: 2,
//             name: "Ahmad Rizki",
//             role: "patient",
//             caregiver: "Budi Santoso",
//             braceletStatus: true,
//             distance: 10, // meter
//           },
//           {
//             id: 3,
//             name: "Dewi Putri",
//             role: "caregiver",
//             patients: ["Linda Wati"],
//             online: true,
//           },
//           {
//             id: 4,
//             name: "Linda Wati",
//             role: "patient",
//             caregiver: "Dewi Putri",
//             braceletStatus: false,
//             distance: 150, // meter
//           },
//           {
//             id: 5,
//             name: "Siti Nur",
//             role: "patient",
//             caregiver: "Budi Santoso",
//             braceletStatus: true,
//             distance: 5, // meter
//           },
//         ]
//         setCareData(mockData)
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchUserData()
//     fetchDashboardData()
//   }, [router])

//   // Helper function to extract user ID from JWT token
//   const getUserIdFromToken = (token) => {
//     try {
//       // Basic JWT parsing (in production, use a proper JWT library)
//       const base64Url = token.split(".")[1]
//       const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
//       const jsonPayload = decodeURIComponent(
//         atob(base64)
//           .split("")
//           .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
//           .join(""),
//       )

//       return JSON.parse(jsonPayload).id
//     } catch (error) {
//       console.error("Error decoding token:", error)
//       return null
//     }
//   }

//   const handleLogout = () => {
//     localStorage.removeItem("token")
//     router.push("/auth/login")
//   }

//   const getFilteredData = () => {
//     return careData.filter((item) => {
//       // Filter by role
//       const roleMatch = filter === "all" || item.role === filter

//       // Filter by search term
//       const searchMatch =
//         item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (item.role === "patient" && item.caregiver.toLowerCase().includes(searchTerm.toLowerCase())) ||
//         (item.role === "caregiver" && 
//           item.patients && 
//           Array.isArray(item.patients) && 
//           item.patients.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase())))

//       return roleMatch && searchMatch
//     })
//   }

//   const getStatusColor = (status) => {
//     return status ? "#4ade80" : "#f87171" // green for on, red for off
//   }

//   const getDistanceColor = (distance) => {
//     if (distance <= 10) return "#4ade80" // green for close
//     if (distance <= 50) return "#facc15" // yellow for medium distance
//     return "#f87171" // red for far
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
//           <p style={{ marginTop: "1rem" }}>Loading...</p>
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
//           {getFilteredData().map((item) => (
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
//                         <span>{item.distance} meters</span>
//                       </div>
//                     </div>
//                   </div>
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

//         {getFilteredData().length === 0 && (
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

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()
  const [careData, setCareData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all") // "all", "caregiver", "patient"
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/auth/login")
      return
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        // Decode token to get user ID
        const userId = getUserIdFromToken(token)
        
        if (!userId) {
          throw new Error("Invalid token")
        }
        
        const res = await fetch(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          throw new Error("Failed to fetch user data")
        }

        const userData = await res.json()
        setUser(userData)
      } catch (error) {
        console.error("Error fetching user data:", error)
        localStorage.removeItem("token")
        router.push("/auth/login")
      }
    }

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // Fetch all users to get caregivers
        const usersRes = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!usersRes.ok) {
          throw new Error("Failed to fetch users")
        }

        const users = await usersRes.json()
        
        // Filter caregivers from users
        const caregivers = users.filter(user => user.role === 'caregiver')

        // Fetch patients
        const patientRes = await fetch("/api/patients", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!patientRes.ok) {
          throw new Error("Failed to fetch patients")
        }

        const patients = await patientRes.json()

        // Fetch assignments to link caregivers and patients
        const assignmentRes = await fetch("/api/assignments", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!assignmentRes.ok) {
          throw new Error("Failed to fetch assignments")
        }

        const assignments = await assignmentRes.json()

        // Fetch devices to check bracelet status
        const devicesRes = await fetch("/api/devices", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!devicesRes.ok) {
          throw new Error("Failed to fetch devices")
        }

        const devices = await devicesRes.json()

        // Fetch jarak (distance) data
        const jarakRes = await fetch("/api/jarak", {
          headers: { Authorization: `Bearer ${token}` },
        })

        let jarak = []
        if (jarakRes.ok) {
          jarak = await jarakRes.json()
        }

        // Process caregiver data
        const processedCaregivers = caregivers.map((caregiver) => {
          // Find assignments for this caregiver
          const caregiverAssignments = assignments.filter((a) => a.caregiver_id === caregiver.id)

          // Get patient details for this caregiver
          const patientIds = caregiverAssignments.map((a) => a.patient_id)
          const assignedPatients = patients.filter((p) => patientIds.includes(p.id))

          return {
            id: caregiver.id,
            name: caregiver.nama,
            role: "caregiver",
            patients: assignedPatients.map((p) => p.nama),
            online: true, // Default to true as we don't have online status in our API
          }
        })

        // Process patient data
        const processedPatients = patients.map((patient) => {
          // Find assignment for this patient
          const patientAssignment = assignments.find((a) => a.patient_id === patient.id)

          // Find caregiver for this patient
          const caregiver = patientAssignment 
            ? caregivers.find((c) => c.id === patientAssignment.caregiver_id) 
            : null

          // Find patient's device
          const device = devices.find(d => d.id === patient.device_id)
          
          // Get device status
          const braceletStatus = device ? device.status === 'aktif' : false

          // Find distance data for this patient
          const distanceData = jarak.find((j) => j.id_patient === patient.id)
          
          // Default distance to 0 if no data found
          const distance = distanceData ? distanceData.jarak_terakhir : 0

          return {
            id: patient.id,
            name: patient.nama,
            role: "patient",
            caregiver: caregiver ? caregiver.nama : "Unassigned",
            braceletStatus: braceletStatus,
            distance: distance,
          }
        })

        // Combine data
        const combinedData = [...processedCaregivers, ...processedPatients]
        setCareData(combinedData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setCareData([]) // Set empty data if there's an error
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
    fetchDashboardData()
  }, [router])

  // Helper function to extract user ID from JWT token
  const getUserIdFromToken = (token) => {
    try {
      // Basic JWT parsing 
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )

      return JSON.parse(jsonPayload).id
    } catch (error) {
      console.error("Error decoding token:", error)
      return null
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/auth/login")
  }

  const getFilteredData = () => {
    return careData.filter((item) => {
      // Filter by role
      const roleMatch = filter === "all" || item.role === filter

      // Filter by search term
      const searchMatch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.role === "patient" && item.caregiver.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.role === "caregiver" && 
          item.patients && 
          Array.isArray(item.patients) && 
          item.patients.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase())))

      return roleMatch && searchMatch
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
          <p style={{ marginTop: "1rem" }}>Loading...</p>
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
          <h1 style={{ fontWeight: "bold", fontSize: "1.5rem" }}>CareMates Dashboard</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user && <span>{user.nama}</span>}
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

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        {/* Filters and Search */}
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

        {/* Dashboard Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {getFilteredData().map((item) => (
            <div
              key={item.id}
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
                        <span>{item.distance} meters</span>
                      </div>
                    </div>
                  </div>
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

        {getFilteredData().length === 0 && (
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