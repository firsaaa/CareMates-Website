"use client"

import { useState, useEffect, useRef } from "react"
import { useAdminLocation, useIoTWebSocket, calculateDistance } from "../../lib/distance-calculator"
import { saveAhmadDistance, saveIoTConnectionStatus } from "../../lib/distance-store"

// Komponen untuk monitoring jarak secara real-time
export default function DistanceMonitor({ patientId, onDistanceUpdate, onConnectionStatusUpdate }) {
  const [distance, setDistance] = useState(null)
  const { location: adminLocation, error: locationError } = useAdminLocation()
  const { iotData, connectionStatus } = useIoTWebSocket()
  const lastDistanceRef = useRef(null)

  // Hanya Ahmad (ID 1) yang menggunakan real-time distance
  const isAhmad = Number.parseInt(patientId) === 1

  // Effect untuk menghitung jarak real-time
  useEffect(() => {
    if (!isAhmad) return

    // Jika tidak ada data lokasi atau IoT, tidak bisa menghitung jarak
    if (!adminLocation || !iotData || !iotData.latitude || !iotData.longitude) {
      console.log("[DistanceMonitor] Waiting for location data...")
      return
    }

    // Hitung jarak antara admin dan IoT device
    const calculatedDistance = calculateDistance(
      adminLocation.latitude,
      adminLocation.longitude,
      iotData.latitude,
      iotData.longitude,
    )

    // Bulatkan jarak ke integer
    const roundedDistance = Math.round(calculatedDistance)

    // Hanya update jika jarak berubah signifikan (> 2 meter)
    if (lastDistanceRef.current === null || Math.abs(lastDistanceRef.current - roundedDistance) > 2) {
      console.log(`[DistanceMonitor] Distance updated: ${roundedDistance}m`)
      setDistance(roundedDistance)
      lastDistanceRef.current = roundedDistance

      // Simpan ke centralized store
      saveAhmadDistance(roundedDistance)

      // Callback untuk parent component
      if (onDistanceUpdate) {
        onDistanceUpdate(patientId, roundedDistance)
      }
    }
  }, [adminLocation, iotData, isAhmad, patientId, onDistanceUpdate])

  // Effect untuk update status koneksi
  useEffect(() => {
    if (!isAhmad) return

    console.log(`[DistanceMonitor] Connection status: ${connectionStatus}`)

    // Simpan ke centralized store
    saveIoTConnectionStatus(connectionStatus)

    // Callback untuk parent component
    if (onConnectionStatusUpdate) {
      onConnectionStatusUpdate(connectionStatus)
    }
  }, [connectionStatus, isAhmad, onConnectionStatusUpdate])

  // Komponen ini tidak merender UI
  return null
}

// Komponen untuk menampilkan status jarak
export function DistanceStatus({ patientId, connectionStatus }) {
  const isAhmad = Number.parseInt(patientId) === 1

  // Jika bukan Ahmad, tidak perlu menampilkan status
  if (!isAhmad) return null

  return (
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
            backgroundColor: connectionStatus === "connected" ? "#4ade80" : "#f87171",
            transition: "background-color 0.5s ease",
          }}
        ></div>
        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
          IoT Device: {connectionStatus === "connected" ? "Connected" : "Disconnected"}
          {connectionStatus === "connected" && (
            <span style={{ fontWeight: "bold", color: "#059669" }}>{" • "}Real-time GPS tracking active</span>
          )}
        </span>
      </div>
    </div>
  )
}
