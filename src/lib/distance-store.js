"use client"

// Centralized store untuk data jarak Ahmad
// File ini berfungsi sebagai "single source of truth" untuk jarak Ahmad

// Key untuk localStorage
const AHMAD_DISTANCE_KEY = "ahmad_distance"
const AHMAD_LAST_UPDATE_KEY = "ahmad_last_update"
const AHMAD_CONNECTION_STATUS_KEY = "ahmad_connection_status"

// Fungsi untuk menyimpan jarak Ahmad
export function saveAhmadDistance(distance) {
  if (typeof window === "undefined") return

  try {
    // Simpan jarak dan timestamp
    localStorage.setItem(AHMAD_DISTANCE_KEY, distance.toString())
    localStorage.setItem(AHMAD_LAST_UPDATE_KEY, new Date().toISOString())

    // Dispatch custom event untuk notifikasi komponen lain
    const event = new CustomEvent("ahmad-distance-update", {
      detail: { distance, timestamp: new Date().toISOString() },
    })
    window.dispatchEvent(event)

    console.log(`[DistanceStore] Ahmad distance saved: ${distance}m`)
  } catch (error) {
    console.error("[DistanceStore] Error saving Ahmad distance:", error)
  }
}

// Fungsi untuk mengambil jarak Ahmad
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

// Fungsi untuk menyimpan status koneksi IoT
export function saveIoTConnectionStatus(status) {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(AHMAD_CONNECTION_STATUS_KEY, status)

    // Dispatch custom event untuk notifikasi komponen lain
    const event = new CustomEvent("iot-status-update", {
      detail: { status, timestamp: new Date().toISOString() },
    })
    window.dispatchEvent(event)

    console.log(`[DistanceStore] IoT connection status saved: ${status}`)
  } catch (error) {
    console.error("[DistanceStore] Error saving IoT status:", error)
  }
}

// Fungsi untuk mengambil status koneksi IoT
export function getIoTConnectionStatus() {
  if (typeof window === "undefined") return "disconnected"

  try {
    return localStorage.getItem(AHMAD_CONNECTION_STATUS_KEY) || "disconnected"
  } catch (error) {
    console.error("[DistanceStore] Error getting IoT status:", error)
    return "disconnected"
  }
}

// Fungsi untuk mendapatkan jarak Ahmad secara sinkron
export function getAhmadDistanceSync() {
  // Untuk digunakan dalam render, tidak dalam useEffect
  if (typeof window === "undefined") return 50 // Default value

  try {
    const distance = localStorage.getItem(AHMAD_DISTANCE_KEY)
    return distance ? Number.parseInt(distance, 10) : 50
  } catch (error) {
    return 50 // Default value
  }
}
