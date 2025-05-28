"use client"

const AHMAD_DISTANCE_KEY = "ahmad_distance"
const AHMAD_LAST_UPDATE_KEY = "ahmad_last_update"
const AHMAD_CONNECTION_STATUS_KEY = "ahmad_connection_status"
const AHMAD_COORDINATES_KEY = "ahmad_coordinates"

export function saveAhmadDistance(distance) {
  if (typeof window === "undefined") return

  try {
    const roundedDistance = Number(distance.toFixed(2))
    localStorage.setItem(AHMAD_DISTANCE_KEY, roundedDistance.toString())
    localStorage.setItem(AHMAD_LAST_UPDATE_KEY, new Date().toISOString())

    console.log(`[DistanceStore] Ahmad distance saved: ${roundedDistance}m`)

    const event = new CustomEvent("ahmad-distance-update", {
      detail: { distance: roundedDistance, timestamp: new Date().toISOString() },
    })
    window.dispatchEvent(event)
  } catch (error) {
    console.error("[DistanceStore] Error saving Ahmad distance:", error)
  }
}

export function getAhmadDistance() {
  if (typeof window === "undefined") return null

  try {
    const distance = localStorage.getItem(AHMAD_DISTANCE_KEY)

    if (distance) {
      const parsedDistance = Number.parseFloat(distance)
      return parsedDistance
    }

    return null
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

    if (distance) {
      const parsedDistance = Number.parseFloat(distance)
      return parsedDistance
    }

    return 50
  } catch (error) {
    console.error("[DistanceStore] Error in getAhmadDistanceSync:", error)
    return 50
  }
}

export function saveAhmadCoordinates(lastLat, lastLon) {
  if (typeof window === "undefined") return

  try {
    const coordinates = {
      lastLat: Number(lastLat.toFixed(6)),
      lastLon: Number(lastLon.toFixed(6)),
      timestamp: new Date().toISOString(),
    }

    localStorage.setItem(AHMAD_COORDINATES_KEY, JSON.stringify(coordinates))

    const event = new CustomEvent("ahmad-coordinates-update", {
      detail: {
        lastLat: coordinates.lastLat,
        lastLon: coordinates.lastLon,
        timestamp: coordinates.timestamp,
      },
    })
    window.dispatchEvent(event)

    console.log(`[DistanceStore] Ahmad coordinates saved: ${coordinates.lastLat}, ${coordinates.lastLon}`)
  } catch (error) {
    console.error("[DistanceStore] Error saving Ahmad coordinates:", error)
  }
}

export function getAhmadCoordinates() {
  if (typeof window === "undefined") return null

  try {
    const coordinates = localStorage.getItem(AHMAD_COORDINATES_KEY)

    if (coordinates) {
      const parsed = JSON.parse(coordinates)
      return parsed
    }

    return null
  } catch (error) {
    console.error("[DistanceStore] Error getting Ahmad coordinates:", error)
    return null
  }
}
