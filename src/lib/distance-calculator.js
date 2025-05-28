"use client"

import { useState, useEffect, useRef, useCallback } from "react"

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  const distance = R * c
  return Number(distance.toFixed(2))
}

export function useAdminLocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const watchIdRef = useRef(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung oleh browser ini")
      setIsLoading(false)
      // Fallback to Jakarta coordinates
      setLocation({
        latitude: -6.2088,
        longitude: 106.8456,
      })
      return
    }

    console.log("[AdminLocation] Requesting geolocation permission...")

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        setLocation((prevLocation) => {
          if (!prevLocation) {
            console.log("[AdminLocation] Initial geolocation set:", newLocation)
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

          // Update if moved more than 5 meters for better accuracy
          if (distance > 5) {
            console.log("[AdminLocation] Location updated, moved:", distance, "meters")
            return newLocation
          }

          return prevLocation
        })
      },
      (error) => {
        console.error("[AdminLocation] Geolocation error:", error)
        setError(`Gagal mendapatkan lokasi admin: ${error.message}`)
        setIsLoading(false)
        // Fallback to Jakarta coordinates
        setLocation({
          latitude: -6.2088,
          longitude: 106.8456,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000, // Cache for 1 minute
      },
    )

    return () => {
      if (watchIdRef.current) {
        console.log("[AdminLocation] Clearing geolocation watch")
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { location, error, isLoading }
}

export function useIoTWebSocket() {
  const [iotData, setIoTData] = useState(null)
  const [fullIoTData, setFullIoTData] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const lastDataRef = useRef(null)

  const connect = useCallback(() => {
    try {
      console.log(`[IoTWebSocket] Connecting... (attempt ${reconnectAttemptsRef.current + 1})`)

      if (wsRef.current) {
        wsRef.current.close()
      }

      wsRef.current = new WebSocket("wss://caremates-websocket.codebloop.my.id/")

      wsRef.current.onopen = () => {
        console.log("[IoTWebSocket] Connected successfully")
        setConnectionStatus("connected")
        reconnectAttemptsRef.current = 0
      }

      wsRef.current.onmessage = (event) => {
        try {
          let data

          // Handle Blob data
          if (event.data instanceof Blob) {
            const reader = new FileReader()
            reader.onload = () => {
              try {
                const blobText = reader.result
                data = JSON.parse(blobText)
                processIoTData(data)
              } catch (error) {
                console.error("[IoTWebSocket] Error parsing blob data:", error)
              }
            }
            reader.readAsText(event.data)
            return
          }

          // Handle string data
          if (typeof event.data === "string") {
            let dataStr = event.data.trim()

            // Fix malformed JSON
            if (!dataStr.startsWith("{") && dataStr.includes(":")) {
              dataStr = "{" + dataStr
            }
            if (!dataStr.endsWith("}") && dataStr.includes(":")) {
              dataStr = dataStr + "}"
            }

            data = JSON.parse(dataStr)
          } else {
            data = event.data
          }

          processIoTData(data)
        } catch (error) {
          console.error("[IoTWebSocket] Error processing message:", error, "Raw data:", event.data)
        }
      }

      const processIoTData = (data) => {
        console.log("[IoTWebSocket] Processing data:", data)

        setFullIoTData(data)

        if (data.lastLat && data.lastLon) {
          const latitude = Number.parseFloat(data.lastLat)
          const longitude = Number.parseFloat(data.lastLon)

          console.log(`[IoTWebSocket] GPS coordinates - Lat: ${latitude}, Lon: ${longitude}`)

          const newIoTData = {
            latitude: latitude,
            longitude: longitude,
            lastLat: latitude,
            lastLon: longitude,
            timestamp: new Date().toISOString(),
            deviceId: data.deviceId || 1,
            accelX: data.accelX,
            accelY: data.accelY,
            accelZ: data.accelZ,
            gyroX: data.gyroX,
            gyroY: data.gyroY,
            gyroZ: data.gyroZ,
            temperature: data.temperature,
            buttonPressed: data.buttonPressed,
            buttonCount: data.buttonCount,
            originalTimestamp: data.timestamp,
          }

          // Dispatch coordinate update event
          const coordEvent = new CustomEvent("iot-coordinates-update", {
            detail: {
              latitude: latitude,
              longitude: longitude,
              lastLat: latitude,
              lastLon: longitude,
              timestamp: new Date().toISOString(),
            },
          })
          window.dispatchEvent(coordEvent)

          // Only update if coordinates changed significantly
          if (
            !lastDataRef.current ||
            Math.abs(lastDataRef.current.latitude - newIoTData.latitude) > 0.00001 ||
            Math.abs(lastDataRef.current.longitude - newIoTData.longitude) > 0.00001
          ) {
            console.log(`[IoTWebSocket] Coordinates updated: ${latitude}, ${longitude}`)
            setIoTData(newIoTData)
            lastDataRef.current = newIoTData
          }
        } else {
          console.warn("[IoTWebSocket] No GPS coordinates in data:", data)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log("[IoTWebSocket] Connection closed:", event.code, event.reason)
        setConnectionStatus("disconnected")

        if (reconnectAttemptsRef.current < 10) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`[IoTWebSocket] Reconnecting in ${delay}ms...`)

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1
            connect()
          }, delay)
        } else {
          console.error("[IoTWebSocket] Max reconnection attempts reached")
          setConnectionStatus("error")
        }
      }

      wsRef.current.onerror = (error) => {
        console.error("[IoTWebSocket] Connection error:", error)
        setConnectionStatus("error")
      }
    } catch (error) {
      console.error("[IoTWebSocket] Error creating connection:", error)
      setConnectionStatus("error")
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      console.log("[IoTWebSocket] Cleaning up connection")
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return { iotData, fullIoTData, connectionStatus }
}
