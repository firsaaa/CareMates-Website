"use client"

const AHMAD_DISTANCE_KEY = "ahmad_distance"
const AHMAD_LAST_UPDATE_KEY = "ahmad_last_update"
const AHMAD_CONNECTION_STATUS_KEY = "ahmad_connection_status"

export function saveAhmadDistance(distance) {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(AHMAD_DISTANCE_KEY, distance.toString())
    localStorage.setItem(AHMAD_LAST_UPDATE_KEY, new Date().toISOString())

    const event = new CustomEvent("ahmad-distance-update", {
      detail: { distance, timestamp: new Date().toISOString() },
    })
    window.dispatchEvent(event)

    console.log(`[DistanceStore] Ahmad distance saved: ${distance}m`)
  } catch (error) {
    console.error("[DistanceStore] Error saving Ahmad distance:", error)
  }
}

export function getAhmadDistance() {
  if (typeof window === "undefined") return null

  try {
    const distance = localStorage.getItem(AHMAD_DISTANCE_KEY)
    return distance ? Number.parseInt(distance, 10) : null
  } catch (error) {
    console.error("[DistanceStore] Error getting Ahmad distance:", error)
    return null
  }
}

export function saveIoTConnectionStatus(status) {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(AHMAD_CONNECTION_STATUS_KEY, status)

    const event = new CustomEvent("iot-status-update", {
      detail: { status, timestamp: new Date().toISOString() },
    })
    window.dispatchEvent(event)

    console.log(`[DistanceStore] IoT connection status saved: ${status}`)
  } catch (error) {
    console.error("[DistanceStore] Error saving IoT status:", error)
  }
}

export function getIoTConnectionStatus() {
  if (typeof window === "undefined") return "disconnected"

  try {
    return localStorage.getItem(AHMAD_CONNECTION_STATUS_KEY) || "disconnected"
  } catch (error) {
    console.error("[DistanceStore] Error getting IoT status:", error)
    return "disconnected"
  }
}

export function getAhmadDistanceSync() {
  if (typeof window === "undefined") return 50

  try {
    const distance = localStorage.getItem(AHMAD_DISTANCE_KEY)
    return distance ? Number.parseInt(distance, 10) : 50
  } catch {
    return 50
  }
}
