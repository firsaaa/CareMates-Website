"use client"

import { useState, useEffect, useRef } from "react"
import { useAdminLocation, useIoTWebSocket, calculateDistance } from "../../lib/distance-calculator"
import { saveAhmadDistance, saveIoTConnectionStatus, saveAhmadCoordinates } from "../../lib/distance-store"

export default function DistanceMonitor({ patientId, onDistanceUpdate, onConnectionStatusUpdate, onCoordinatesUpdate }) {
  const [distance, setDistance] = useState(null)
  const { location: adminLocation, isLoading: locationLoading } = useAdminLocation()
  const { iotData, connectionStatus } = useIoTWebSocket()
  const lastDistanceRef = useRef(null)
  const lastCalculationRef = useRef(null)
  const isAhmad = Number.parseInt(patientId) === 1

  useEffect(() => {
    if (!isAhmad) return
    
    if (locationLoading) {
      console.log("[DistanceMonitor] Waiting for admin location...")
      return
    }
    
    if (!adminLocation || !iotData || !iotData.latitude || !iotData.longitude) {
      console.log("[DistanceMonitor] Waiting for complete location data...")
      console.log("Admin location:", adminLocation)
      console.log("IoT data:", iotData)
      return
    }

    console.log("[DistanceMonitor] Calculating distance...")
    console.log("Admin coordinates:", adminLocation.latitude, adminLocation.longitude)
    console.log("Ahmad coordinates:", iotData.latitude, iotData.longitude)

    const calculatedDistance = calculateDistance(
      adminLocation.latitude,
      adminLocation.longitude,
      iotData.latitude,
      iotData.longitude
    )

    console.log(`[DistanceMonitor] Calculated distance: ${calculatedDistance}m`)

    // Update if distance changed by more than 0.5 meters or if it's the first calculation
    if (
      lastDistanceRef.current === null || 
      Math.abs(lastDistanceRef.current - calculatedDistance) > 0.5
    ) {
      console.log(`[DistanceMonitor] Distance updated from ${lastDistanceRef.current}m to ${calculatedDistance}m`)
      
      setDistance(calculatedDistance)
      lastDistanceRef.current = calculatedDistance
      lastCalculationRef.current = Date.now()
      
      // Save to storage
      saveAhmadDistance(calculatedDistance)
      saveAhmadCoordinates(iotData.latitude, iotData.longitude)
      
      // Notify parent components
      if (onDistanceUpdate) {
        onDistanceUpdate(patientId, calculatedDistance)
      }
      
      if (onCoordinatesUpdate) {
        onCoordinatesUpdate(patientId, {
          lastLat: iotData.latitude,
          lastLon: iotData.longitude
        })
      }
    }
  }, [adminLocation, iotData, isAhmad, patientId, onDistanceUpdate, onCoordinatesUpdate, locationLoading])

  useEffect(() => {
    if (!isAhmad) return
    
    console.log(`[DistanceMonitor] IoT connection status: ${connectionStatus}`)
    saveIoTConnectionStatus(connectionStatus)
    
    if (onConnectionStatusUpdate) {
      onConnectionStatusUpdate(connectionStatus)
    }
  }, [connectionStatus, isAhmad, onConnectionStatusUpdate])

  useEffect(() => {
    if (distance !== null) {
      console.log(`[DistanceMonitor] Current distance state: ${distance}m`)
    }
  }, [distance])

  return null
}

export function DistanceStatus({ patientId, connectionStatus, distance, coordinates }) {
  const isAhmad = Number.parseInt(patientId) === 1
  if (!isAhmad) return null

  return (
    <div
      style={{
        marginTop: "0.5rem",
        padding: "0.75rem",
        backgroundColor: "#f9fafb",
        borderRadius: "0.5rem",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <div
          style={{
            width: "0.5rem",
            height: "0.5rem",
            borderRadius: "9999px",
            backgroundColor: connectionStatus === "connected" ? "#4ade80" : "#f87171",
            transition: "background-color 0.5s ease",
          }}
        ></div>
        <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: "medium" }}>
          IoT Device: {connectionStatus === "connected" ? "Connected" : "Disconnected"}
        </span>
      </div>
      
      {connectionStatus === "connected" && (
        <div style={{ fontSize: "0.75rem", color: "#059669", fontWeight: "bold", marginBottom: "0.5rem" }}>
          ✓ Real-time GPS tracking active
          {distance !== null && ` • Distance: ${distance}m`}
        </div>
      )}
      
      {coordinates && coordinates.lastLat && coordinates.lastLon && (
        <div style={{ 
          fontSize: "0.7rem", 
          color: "#6b7280",
          backgroundColor: "#f0f9ff",
          padding: "0.5rem",
          borderRadius: "0.25rem",
          border: "1px solid #bae6fd"
        }}>
          📍 GPS: {coordinates.lastLat.toFixed(6)}, {coordinates.lastLon.toFixed(6)}
        </div>
      )}
    </div>
  )
}
