"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [careData, setCareData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all", "caregiver", "patient"
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);

  // Mock data untuk contoh tampilan
  const mockData = [
    {
      id: 1,
      name: "Budi Santoso",
      role: "caregiver",
      patients: ["Ahmad Rizki", "Siti Nur"],
      online: true
    },
    {
      id: 2,
      name: "Ahmad Rizki",
      role: "patient",
      caregiver: "Budi Santoso",
      braceletStatus: true,
      distance: 10 // meter
    },
    {
      id: 3,
      name: "Dewi Putri",
      role: "caregiver",
      patients: ["Linda Wati"],
      online: true
    },
    {
      id: 4,
      name: "Linda Wati",
      role: "patient",
      caregiver: "Dewi Putri",
      braceletStatus: false,
      distance: 150 // meter
    },
    {
      id: 5,
      name: "Siti Nur",
      role: "patient",
      caregiver: "Budi Santoso",
      braceletStatus: true,
      distance: 5 // meter
    }
  ];

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Fetch user data
    // Normally would fetch from API
    setUser({
      name: "Admin User",
      email: "admin@caremates.com",
      role: "admin"
    });

    // Fetch data
    // Normally would fetch from API with:
    // const fetchData = async () => {
    //   try {
    //     const res = await fetch("/api/dashboard", {
    //       headers: { Authorization: `Bearer ${token}` },
    //     });
    //     const data = await res.json();
    //     setCareData(data);
    //   } catch (error) {
    //     console.error("Error fetching dashboard data:", error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchData();

    // Using mock data instead
    setTimeout(() => {
      setCareData(mockData);
      setIsLoading(false);
    }, 1000);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  const getFilteredData = () => {
    return careData.filter(item => {
      // Filter by role
      const roleMatch = filter === "all" || item.role === filter;
      
      // Filter by search term
      const searchMatch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.role === "patient" && item.caregiver.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.role === "caregiver" && 
          item.patients.some(p => p.toLowerCase().includes(searchTerm.toLowerCase())));
      
      return roleMatch && searchMatch;
    });
  };

  const getStatusColor = (status) => {
    return status ? "#4ade80" : "#f87171"; // green for on, red for off
  };

  const getDistanceColor = (distance) => {
    if (distance <= 10) return "#4ade80"; // green for close
    if (distance <= 50) return "#facc15"; // yellow for medium distance
    return "#f87171"; // red for far
  };

  if (isLoading) {
    return (
      <div style={{
        backgroundColor: "#7b42f6",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white"
      }}>
        <div style={{ textAlign: "center" }}>
          <Image src="/logo.png" alt="CareMates Logo" width={60} height={60} />
          <p style={{ marginTop: "1rem" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: "#f9fafb"
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: "#7b42f6",
        padding: "1rem",
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Image src="/logo.png" alt="CareMates Logo" width={40} height={40} />
          <h1 style={{ fontWeight: "bold", fontSize: "1.5rem" }}>CareMates Dashboard</h1>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user && (
            <span>{user.name}</span>
          )}
          <button 
            onClick={handleLogout}
            style={{
              backgroundColor: "#40e0d0",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              fontWeight: "bold",
              color: "#333",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        {/* Filters and Search */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
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
                cursor: "pointer"
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
                cursor: "pointer"
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
                cursor: "pointer"
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
                width: "200px"
              }}
            />
          </div>
        </div>

        {/* Dashboard Cards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
          gap: "1.5rem" 
        }}>
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
                border: item.role === "caregiver" ? "2px solid #7b42f6" : "2px solid #40e0d0"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{item.name}</h2>
                <span style={{ 
                  backgroundColor: item.role === "caregiver" ? "#7b42f6" : "#40e0d0",
                  color: "white",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.875rem",
                  fontWeight: "medium"
                }}>
                  {item.role === "caregiver" ? "Caregiver" : "Patient"}
                </span>
              </div>

              {item.role === "caregiver" ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ 
                      width: "0.75rem", 
                      height: "0.75rem", 
                      borderRadius: "9999px", 
                      backgroundColor: item.online ? "#4ade80" : "#d1d5db" 
                    }}></div>
                    <span>{item.online ? "Online" : "Offline"}</span>
                  </div>
                  
                  <div>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>Assigned Patients:</p>
                    {item.patients.length > 0 ? (
                      <ul style={{ paddingLeft: "1.5rem" }}>
                        {item.patients.map((patient, index) => (
                          <li key={index} style={{ marginBottom: "0.25rem" }}>{patient}</li>
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
                        <div style={{ 
                          width: "0.75rem", 
                          height: "0.75rem", 
                          borderRadius: "9999px", 
                          backgroundColor: getStatusColor(item.braceletStatus) 
                        }}></div>
                        <span>{item.braceletStatus ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Distance:</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ 
                          width: "0.75rem", 
                          height: "0.75rem", 
                          borderRadius: "9999px", 
                          backgroundColor: getDistanceColor(item.distance) 
                        }}></div>
                        <span>{item.distance} meters</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <button
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
                  color: "#4b5563"
                }}
              >
                View Details
              </button>
            </div>
          ))}
        </div>

        {getFilteredData().length === 0 && (
          <div style={{ 
            textAlign: "center", 
            padding: "3rem", 
            backgroundColor: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          }}>
            <p style={{ color: "#6b7280" }}>No data found. Try adjusting your filters.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: "#7b42f6",
        padding: "1rem",
        color: "white",
        textAlign: "center"
      }}>
        <p>© 2025 CareMates - Connect with your loved ones</p>
      </footer>
    </div>
  );
}