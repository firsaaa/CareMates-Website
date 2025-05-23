"use client"

import { useState, useEffect, useRef } from "react"
import { useAdminLocation, useIoTWebSocket, calculateDistance } from "../../lib/distance-calculator"
import { saveAhmadDistance, saveIoTConnectionStatus } from "../../lib/distance-store"

export default function DistanceMonitor({ patientId, onDistanceUpdate, onConnectionStatusUpdate }) {
  const [distance, setDistance] = useState(null)
  const { location: adminLocation } = useAdminLocation()
  const { iotData, connectionStatus } = useIoTWebSocket()
  const lastDistanceRef = useRef(null)
  const isAhmad = Number.parseInt(patientId) === 1

  useEffect(() => {
    if (!isAhmad) return
    if (!adminLocation || !iotData || !iotData.latitude || !iotData.longitude) return

    const calculatedDistance = calculateDistance(
      adminLocation.latitude,
      adminLocation.longitude,
      iotData.latitude,
      iotData.longitude
    )

    const roundedDistance = Math.round(calculatedDistance)

    if (lastDistanceRef.current === null || Math.abs(lastDistanceRef.current - roundedDistance) > 2) {
      setDistance(roundedDistance)
      lastDistanceRef.current = roundedDistance
      saveAhmadDistance(roundedDistance)
      if (onDistanceUpdate) onDistanceUpdate(patientId, roundedDistance)
    }
  }, [adminLocation, iotData, isAhmad, patientId, onDistanceUpdate])

  useEffect(() => {
    if (!isAhmad) return
    saveIoTConnectionStatus(connectionStatus)
    if (onConnectionStatusUpdate) onConnectionStatusUpdate(connectionStatus)
  }, [connectionStatus, isAhmad, onConnectionStatusUpdate])

  useEffect(() => {
    if (distance !== null) {
      console.log(`[DistanceMonitor] Current distance state: ${distance}m`)
    }
  }, [distance])

  return null
}

export function DistanceStatus({ patientId, connectionStatus }) {
  const isAhmad = Number.parseInt(patientId) === 1
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
