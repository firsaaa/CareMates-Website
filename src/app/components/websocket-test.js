"use client"

import { useState, useEffect, useRef } from "react"

export function WebSocketConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  const [lastMessage, setLastMessage] = useState(null)
  const [messageCount, setMessageCount] = useState(0)
  const wsRef = useRef(null)

  useEffect(() => {
    console.log("[WebSocket Test] Starting connection test...")
    
    const connect = () => {
      try {
        wsRef.current = new WebSocket("wss://caremates-websocket.codebloop.my.id/")
        
        wsRef.current.onopen = () => {
          console.log("[WebSocket Test] Connection opened")
          setConnectionStatus("connected")
        }
        
        wsRef.current.onmessage = (event) => {
          console.log("[WebSocket Test] Raw message received:", event.data)
          console.log("[WebSocket Test] Message type:", typeof event.data)
          console.log("[WebSocket Test] Is Blob:", event.data instanceof Blob)
          setMessageCount(prev => prev + 1)
          
          try {
            // Handle Blob data (binary data that needs to be read)
            if (event.data instanceof Blob) {
              console.log("[WebSocket Test] Processing Blob data, size:", event.data.size)
              
              const reader = new FileReader()
              reader.onload = () => {
                try {
                  const blobText = reader.result
                  console.log("[WebSocket Test] Blob content as text:", blobText)
                  
                  // Try to parse the blob content as JSON
                  let data
                  try {
                    data = JSON.parse(blobText)
                  } catch (parseError) {
                    // If direct parsing fails, try to fix the JSON string
                    let dataStr = blobText
                    
                    if (dataStr && typeof dataStr === 'string') {
                      // Clean up the string
                      dataStr = dataStr.trim()
                      
                      // Add opening brace if missing
                      if (!dataStr.startsWith("{") && !dataStr.startsWith("[")) {
                        if (dataStr.includes(":") || dataStr.includes(",")) {
                          dataStr = "{" + dataStr
                        }
                      }
                      // Add closing brace if missing
                      if (!dataStr.endsWith("}") && !dataStr.endsWith("]")) {
                        if (dataStr.includes(":") || dataStr.includes(",")) {
                          dataStr = dataStr + "}"
                        }
                      }
                      
                      try {
                        data = JSON.parse(dataStr)
                      } catch (fixedParseError) {
                        data = {
                          rawBlobText: blobText,
                          parseError: fixedParseError.message,
                          attemptedFix: dataStr
                        }
                      }
                    } else {
                      data = {
                        rawBlobText: blobText,
                        parseError: "Blob content is not a valid string"
                      }
                    }
                  }
                  
                  console.log("[WebSocket Test] Processed blob data:", data)
                  setLastMessage(data)
                  
                  // Check for coordinates and dispatch event
                  if (data && data.lastLat && data.lastLon) {
                    console.log("[WebSocket Test] Dispatching coordinates:", data.lastLat, data.lastLon)
                    const coordEvent = new CustomEvent("iot-coordinates-update", {
                      detail: { 
                        lastLat: Number.parseFloat(data.lastLat),
                        lastLon: Number.parseFloat(data.lastLon),
                        latitude: Number.parseFloat(data.lastLat),
                        longitude: Number.parseFloat(data.lastLon),
                        timestamp: new Date().toISOString() 
                      },
                    })
                    window.dispatchEvent(coordEvent)
                  } else {
                    console.log("[WebSocket Test] No coordinates found in blob data:", data)
                  }
                } catch (error) {
                  console.error("[WebSocket Test] Error processing blob:", error)
                  setLastMessage({
                    error: "Failed to process blob: " + error.message,
                    blobSize: event.data.size
                  })
                }
              }
              
              reader.onerror = () => {
                console.error("[WebSocket Test] FileReader error")
                setLastMessage({
                  error: "Failed to read blob data",
                  blobSize: event.data.size
                })
              }
              
              // Read the blob as text
              reader.readAsText(event.data)
              
            } else if (typeof event.data === 'string') {
              // Handle string data
              let data
              try {
                data = JSON.parse(event.data)
              } catch (parseError) {
                let dataStr = event.data
                
                if (dataStr && typeof dataStr === 'string') {
                  dataStr = dataStr.trim()
                  
                  if (!dataStr.startsWith("{") && !dataStr.startsWith("[")) {
                    if (dataStr.includes(":") || dataStr.includes(",")) {
                      dataStr = "{" + dataStr
                    }
                  }
                  if (!dataStr.endsWith("}") && !dataStr.endsWith("]")) {
                    if (dataStr.includes(":") || dataStr.includes(",")) {
                      dataStr = dataStr + "}"
                    }
                  }
                  
                  try {
                    data = JSON.parse(dataStr)
                  } catch (fixedParseError) {
                    data = {
                      rawString: event.data,
                      parseError: fixedParseError.message,
                      attemptedFix: dataStr
                    }
                  }
                } else {
                  data = {
                    rawString: event.data,
                    parseError: "Data is not a valid JSON string"
                  }
                }
              }
              
              console.log("[WebSocket Test] Processed string data:", data)
              setLastMessage(data)
              
              if (data && data.lastLat && data.lastLon) {
                console.log("[WebSocket Test] Dispatching coordinates:", data.lastLat, data.lastLon)
                const coordEvent = new CustomEvent("iot-coordinates-update", {
                  detail: { 
                    lastLat: Number.parseFloat(data.lastLat),
                    lastLon: Number.parseFloat(data.lastLon),
                    latitude: Number.parseFloat(data.lastLat),
                    longitude: Number.parseFloat(data.lastLon),
                    timestamp: new Date().toISOString() 
                  },
                })
                window.dispatchEvent(coordEvent)
              }
              
            } else if (typeof event.data === 'object') {
              // Already an object
              const data = event.data
              console.log("[WebSocket Test] Processed object data:", data)
              setLastMessage(data)
              
              if (data && data.lastLat && data.lastLon) {
                console.log("[WebSocket Test] Dispatching coordinates:", data.lastLat, data.lastLon)
                const coordEvent = new CustomEvent("iot-coordinates-update", {
                  detail: { 
                    lastLat: Number.parseFloat(data.lastLat),
                    lastLon: Number.parseFloat(data.lastLon),
                    latitude: Number.parseFloat(data.lastLat),
                    longitude: Number.parseFloat(data.lastLon),
                    timestamp: new Date().toISOString() 
                  },
                })
                window.dispatchEvent(coordEvent)
              }
              
            } else {
              // Other types
              const data = { 
                rawData: String(event.data),
                type: typeof event.data
              }
              console.log("[WebSocket Test] Processed other type data:", data)
              setLastMessage(data)
            }
            
          } catch (error) {
            console.error("[WebSocket Test] Parse error:", error)
            setLastMessage({ 
              error: error.message, 
              raw: event.data,
              rawType: typeof event.data,
              rawString: String(event.data)
            })
          }
        }
        
        wsRef.current.onclose = (event) => {
          console.log("[WebSocket Test] Connection closed:", event.code, event.reason)
          setConnectionStatus("disconnected")
        }
        
        wsRef.current.onerror = (error) => {
          console.error("[WebSocket Test] Connection error:", error)
          setConnectionStatus("error")
        }
      } catch (error) {
        console.error("[WebSocket Test] Failed to create connection:", error)
        setConnectionStatus("error")
      }
    }
    
    connect()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return (
    <div style={{
      position: "fixed",
      top: "10px",
      right: "10px",
      background: "white",
      border: "2px solid #ccc",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "12px",
      maxWidth: "350px",
      zIndex: 9999,
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }}>
      <div style={{ fontWeight: "bold", marginBottom: "5px" }}>WebSocket Test</div>
      <div>Status: <span style={{ 
        color: connectionStatus === "connected" ? "green" : connectionStatus === "error" ? "red" : "orange" 
      }}>{connectionStatus}</span></div>
      <div>Messages: {messageCount}</div>
      {lastMessage && (
        <div style={{ marginTop: "5px", maxHeight: "150px", overflow: "auto" }}>
          <div style={{ fontWeight: "bold" }}>Last Message:</div>
          {lastMessage.lastLat && lastMessage.lastLon && (
            <div style={{ color: "green", fontWeight: "bold", marginBottom: "5px" }}>
              ✅ Lat: {lastMessage.lastLat}<br/>
              ✅ Lon: {lastMessage.lastLon}
            </div>
          )}
          {lastMessage.accelX && (
            <div style={{ color: "blue", fontSize: "10px", marginBottom: "5px" }}>
              📊 Accel: X:{lastMessage.accelX}, Y:{lastMessage.accelY}, Z:{lastMessage.accelZ}<br/>
              🌡️ Temp: {lastMessage.temperature}°C
            </div>
          )}
          {lastMessage.error && (
            <div style={{ color: "red", fontSize: "10px" }}>
              ❌ Error: {lastMessage.error}<br/>
              Raw Type: {lastMessage.rawType}<br/>
              Raw String: {lastMessage.rawString}
            </div>
          )}
          <pre style={{ fontSize: "9px", margin: "2px 0", maxHeight: "80px", overflow: "auto" }}>
            {JSON.stringify(lastMessage, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}