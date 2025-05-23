"use client"

import { useState, useEffect, useRef, useCallback } from "react"

// Fungsi untuk menghitung jarak antara dua koordinat GPS menggunakan formula Haversine
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180 // φ, λ dalam radian
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  const distance = R * c // Jarak dalam meter
  return Math.round(distance)
}

// Hook untuk mendapatkan lokasi admin saat ini
export function useAdminLocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const watchIdRef = useRef(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung oleh browser ini")
      setIsLoading(false)
      // Fallback ke lokasi default (Jakarta)
      setLocation({
        latitude: -6.2088,
        longitude: 106.8456,
      })
      return
    }

    console.log("Requesting geolocation permission...")

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        // Hanya update jika lokasi berubah signifikan (> 10 meter)
        setLocation((prevLocation) => {
          if (!prevLocation) {
            console.log("Initial geolocation set:", newLocation)
            setIsLoading(false)
            setError(null)
            return newLocation
          }

          const distance = calculateDistance(
            prevLocation.latitude,
            prevLocation.longitude,
            newLocation.latitude,
            newLocation.longitude,
          )

          if (distance > 10) {
            // Hanya update jika bergerak > 10 meter
            console.log("Location updated, moved:", distance, "meters")
            return newLocation
          }

          return prevLocation // Tidak update jika pergerakan kecil
        })
      },
      (error) => {
        console.error("Geolocation error:", error)
        setError(`Gagal mendapatkan lokasi admin: ${error.message}`)
        setIsLoading(false)
        // Fallback ke lokasi default (Jakarta)
        setLocation({
          latitude: -6.2088,
          longitude: 106.8456,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000, // Cache lokasi selama 5 menit
      },
    )

    return () => {
      if (watchIdRef.current) {
        console.log("Clearing geolocation watch")
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { location, error, isLoading }
}

// Hook untuk koneksi WebSocket IoT dengan stabilitas yang lebih baik
export function useIoTWebSocket() {
  const [iotData, setIoTData] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const lastDataRef = useRef(null)

  const connect = useCallback(() => {
    try {
      console.log(`Connecting to IoT WebSocket... (attempt ${reconnectAttemptsRef.current + 1})`)

      // Cleanup existing connection
      if (wsRef.current) {
        wsRef.current.close()
      }

      wsRef.current = new WebSocket("wss://caremates-websocket.codebloop.my.id/")

      wsRef.current.onopen = () => {
        console.log("IoT WebSocket connected successfully")
        setConnectionStatus("connected")
        reconnectAttemptsRef.current = 0 // Reset counter on successful connection
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Pastikan data memiliki koordinat GPS
          if (data.lastLat && data.lastLon) {
            const newIoTData = {
              latitude: Number.parseFloat(data.lastLat),
              longitude: Number.parseFloat(data.lastLon),
              timestamp: new Date().toISOString(),
              deviceId: data.deviceId || 1,
            }

            // Hanya update jika data berubah signifikan
            if (
              !lastDataRef.current ||
              Math.abs(lastDataRef.current.latitude - newIoTData.latitude) > 0.0001 ||
              Math.abs(lastDataRef.current.longitude - newIoTData.longitude) > 0.0001
            ) {
              console.log(`GPS Coordinates updated: ${newIoTData.latitude}, ${newIoTData.longitude}`)
              setIoTData(newIoTData)
              lastDataRef.current = newIoTData
            }
          }
        } catch (error) {
          console.error("Error parsing IoT data:", error)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log("IoT WebSocket disconnected:", event.code, event.reason)
        setConnectionStatus("disconnected")

        // Reconnect dengan exponential backoff
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`Attempting to reconnect in ${delay}ms...`)

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1
            connect()
          }, delay)
        } else {
          console.error("Max reconnection attempts reached")
          setConnectionStatus("error")
        }
      }

      wsRef.current.onerror = (error) => {
        console.error("IoT WebSocket error:", error)
        setConnectionStatus("error")
      }
    } catch (error) {
      console.error("Error creating WebSocket connection:", error)
      setConnectionStatus("error")
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      console.log("Cleaning up WebSocket connection")
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return { iotData, connectionStatus }
}
