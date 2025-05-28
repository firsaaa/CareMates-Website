"use client"
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export default function WebSocketMonitor() {
  const router = useRouter()
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [latestData, setLatestData] = useState(null)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [error, setError] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const messagesEndRef = useRef(null)
  
  // Auto-reconnect logic with exponential backoff
  const connect = () => {
    try {
      console.log(`Connecting to WebSocket... (attempt ${connectionAttempts + 1})`)
      
      if (wsRef.current) {
        wsRef.current.close()
      }
      
      wsRef.current = new WebSocket("wss://caremates-websocket.codebloop.my.id/")
      
      wsRef.current.onopen = () => {
        console.log("WebSocket connection established")
        setIsConnected(true)
        setConnectionAttempts(0)
        setError(null)
        
        // Add connection message
        addMessage({
          type: "system",
          text: "Connected to WebSocket server",
          timestamp: new Date().toISOString()
        })
      }
      
      wsRef.current.onmessage = async (event) => {
        try {
          // Log raw data
          console.log("Raw WebSocket data type:", typeof event.data, event.data instanceof Blob ? "Blob" : "")
          
          // Handle different types of data
          let dataStr = ""
          
          // If data is a Blob, read it as text
          if (event.data instanceof Blob) {
            try {
              dataStr = await event.data.text()
              console.log("Blob converted to text:", dataStr)
            } catch (blobError) {
              console.error("Error converting Blob to text:", blobError)
              throw new Error("Failed to read Blob data")
            }
          } else if (typeof event.data === 'string') {
            dataStr = event.data
          } else {
            // For other types, try to convert to string
            dataStr = String(event.data)
          }
          
          console.log("Data string for parsing:", dataStr)
          
          // Check if dataStr is empty or not a valid JSON start
          if (!dataStr || (!dataStr.trim().startsWith('{') && !dataStr.trim().startsWith('['))) {
            console.warn("Received non-JSON data:", dataStr)
            addMessage({
              type: "warning",
              text: "Received non-JSON data",
              rawData: dataStr,
              timestamp: new Date().toISOString()
            })
            return
          }
          
          // Try to parse the JSON
          let parsedData
          try {
            parsedData = JSON.parse(dataStr)
          } catch (parseError) {
            console.error("JSON parse error:", parseError.message)
            console.log("Attempting to fix JSON format...")
            
            // Try to fix common JSON issues
            let fixedStr = dataStr.trim()
            
            // If it doesn't start with {, add it
            if (!fixedStr.startsWith('{')) {
              fixedStr = '{' + fixedStr
            }
            
            // If it doesn't end with }, add it
            if (!fixedStr.endsWith('}')) {
              fixedStr = fixedStr + '}'
            }
            
            // Replace any invalid escape sequences
            fixedStr = fixedStr.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\')
            
            console.log("Fixed JSON string:", fixedStr)
            
            try {
              parsedData = JSON.parse(fixedStr)
            } catch (secondError) {
              console.error("Failed to parse even after fixes:", secondError.message)
              addMessage({
                type: "error",
                text: `Failed to parse JSON: ${parseError.message}`,
                rawData: dataStr,
                timestamp: new Date().toISOString()
              })
              return
            }
          }
          
          console.log("Successfully parsed data:", parsedData)
          
          // Update latest data state
          setLatestData(parsedData)
          
          // Add to messages history
          addMessage({
            type: "data",
            data: parsedData,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          console.error("Error processing WebSocket data:", error)
          
          // Add error message
          addMessage({
            type: "error",
            text: `Failed to process data: ${error.message}`,
            rawData: typeof event.data === 'string' 
              ? event.data 
              : event.data instanceof Blob 
                ? "Binary data (Blob)" 
                : String(event.data),
            timestamp: new Date().toISOString()
          })
        }
      }
      
      wsRef.current.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason)
        setIsConnected(false)
        
        // Add disconnection message
        addMessage({
          type: "system",
          text: `Disconnected from server (Code: ${event.code})`,
          timestamp: new Date().toISOString()
        })
        
        // Attempt to reconnect with exponential backoff
        if (connectionAttempts < 10) { // Limit max reconnection attempts
          const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000) // Max 30 second delay
          console.log(`Attempting to reconnect in ${delay}ms...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionAttempts(prev => prev + 1)
            connect()
          }, delay)
        } else {
          setError("Maximum reconnection attempts reached. Please try again later.")
        }
      }
      
      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error)
        setError("An error occurred with the WebSocket connection.")
      }
    } catch (error) {
      console.error("Error setting up WebSocket:", error)
      setError(`Failed to connect: ${error.message}`)
    }
  }
  
  // Function to add a message to the history
  const addMessage = (message) => {
    setMessages(prev => {
      // Keep only the last 100 messages to avoid memory issues
      const newMessages = [...prev, message].slice(-100)
      return newMessages
    })
  }
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    connect()
    
    // Cleanup function
    return () => {
      console.log("Cleaning up WebSocket connection")
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])
  
  // Handle manual reconnect
  const handleReconnect = () => {
    setConnectionAttempts(0)
    connect()
  }
  
  // Clear messages
  const handleClearMessages = () => {
    setMessages([])
  }
  
  // Navigate back to dashboard
  const handleBack = () => {
    router.push("/dashboard")
  }
  
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }
  
  // Get color based on value range
  const getValueColor = (value, baseColor = "#333") => {
    if (value === undefined || value === null) return baseColor
    
    if (typeof value === 'number') {
      if (Math.abs(value) > 5) return "#ef4444" // High values
      if (Math.abs(value) > 2) return "#f97316" // Medium values
      return "#10b981" // Low values
    }
    
    return baseColor
  }
  
  // Safely render JSON data
  const renderJsonValue = (value) => {
    if (value === undefined || value === null) return "N/A"
    if (typeof value === 'object') return JSON.stringify(value)
    if (typeof value === 'number') return value.toFixed(2)
    return String(value)
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-purple-600 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Use a placeholder image or comment out if logo is missing */}
            {/* <Image src="/logo.png" alt="CareMates Logo" width={40} height={40} /> */}
            <div style={{ width: 40, height: 40, background: "#40e0d0", borderRadius: "50%" }}></div>
            <h1 className="text-xl font-bold">CareMates WebSocket Monitor</h1>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Current Data */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-purple-600">Current Data</h2>
              <div className="text-xs text-gray-500">
                {latestData && <span>Last update: {new Date().toLocaleTimeString()}</span>}
              </div>
            </div>
            
            {latestData ? (
              <div className="space-y-6">
                {/* GPS Coordinates */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h3 className="text-md font-semibold text-gray-700 mb-2">GPS Coordinates</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded shadow-sm">
                      <div className="text-xs text-gray-500">Latitude</div>
                      <div className="text-md font-medium">
                        {latestData.lastLat !== undefined ? 
                          (typeof latestData.lastLat === 'number' ? 
                            latestData.lastLat.toFixed(6) : 
                            String(latestData.lastLat)
                          ) : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded shadow-sm">
                      <div className="text-xs text-gray-500">Longitude</div>
                      <div className="text-md font-medium">
                        {latestData.lastLon !== undefined ? 
                          (typeof latestData.lastLon === 'number' ? 
                            latestData.lastLon.toFixed(6) : 
                            String(latestData.lastLon)
                          ) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Accelerometer */}
                {(latestData.accelX !== undefined || latestData.accelY !== undefined || latestData.accelZ !== undefined) && (
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">Accelerometer (m/s²)</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="text-xs text-gray-500">X-axis</div>
                        <div className="text-md font-medium" style={{ color: getValueColor(latestData.accelX) }}>
                          {renderJsonValue(latestData.accelX)}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="text-xs text-gray-500">Y-axis</div>
                        <div className="text-md font-medium" style={{ color: getValueColor(latestData.accelY) }}>
                          {renderJsonValue(latestData.accelY)}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="text-xs text-gray-500">Z-axis</div>
                        <div className="text-md font-medium" style={{ color: getValueColor(latestData.accelZ) }}>
                          {renderJsonValue(latestData.accelZ)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Gyroscope */}
                {(latestData.gyroX !== undefined || latestData.gyroY !== undefined || latestData.gyroZ !== undefined) && (
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">Gyroscope (deg/s)</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="text-xs text-gray-500">X-axis</div>
                        <div className="text-md font-medium" style={{ color: getValueColor(latestData.gyroX) }}>
                          {renderJsonValue(latestData.gyroX)}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="text-xs text-gray-500">Y-axis</div>
                        <div className="text-md font-medium" style={{ color: getValueColor(latestData.gyroY) }}>
                          {renderJsonValue(latestData.gyroY)}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="text-xs text-gray-500">Z-axis</div>
                        <div className="text-md font-medium" style={{ color: getValueColor(latestData.gyroZ) }}>
                          {renderJsonValue(latestData.gyroZ)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Other Sensors */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h3 className="text-md font-semibold text-gray-700 mb-2">Other Sensors</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {latestData.temperature !== undefined && (
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="text-xs text-gray-500">Temperature</div>
                        <div className="text-md font-medium">
                          {typeof latestData.temperature === 'number' ? 
                            `${latestData.temperature.toFixed(2)}°C` : 
                            renderJsonValue(latestData.temperature)}
                        </div>
                      </div>
                    )}
                    
                    {latestData.buttonPressed !== undefined && (
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="text-xs text-gray-500">Button Status</div>
                        <div className={`text-md font-medium ${latestData.buttonPressed ? 'text-red-500' : 'text-green-500'}`}>
                          {latestData.buttonPressed ? 'Pressed' : 'Released'}
                        </div>
                      </div>
                    )}
                    
                    {latestData.buttonCount !== undefined && (
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="text-xs text-gray-500">Button Count</div>
                        <div className="text-md font-medium">
                          {renderJsonValue(latestData.buttonCount)}
                        </div>
                      </div>
                    )}
                    
                    {latestData.timestamp !== undefined && (
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="text-xs text-gray-500">Device Timestamp</div>
                        <div className="text-md font-medium">
                          {renderJsonValue(latestData.timestamp)}
                        </div>
                      </div>
                    )}
                    
                    {/* Display other fields dynamically */}
                    {Object.entries(latestData)
                      .filter(([key]) => !['lastLat', 'lastLon', 'accelX', 'accelY', 'accelZ', 
                                          'gyroX', 'gyroY', 'gyroZ', 'temperature', 
                                          'buttonPressed', 'buttonCount', 'timestamp'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="bg-white p-2 rounded shadow-sm">
                          <div className="text-xs text-gray-500">{key}</div>
                          <div className="text-md font-medium">{renderJsonValue(value)}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                {error ? (
                  <div className="text-red-500">{error}</div>
                ) : (
                  <div>Waiting for data...</div>
                )}
              </div>
            )}
            
            <div className="mt-4 space-x-2">
              <button
                onClick={handleReconnect}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                {isConnected ? 'Reconnect' : 'Connect'}
              </button>
              
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
        
        {/* Right column - Message History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-purple-600">Message History</h2>
              <button
                onClick={handleClearMessages}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-md border border-gray-200 p-2">
              {messages.length > 0 ? (
                <div className="space-y-2">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md ${
                        message.type === "system"
                          ? "bg-blue-50 border border-blue-200"
                          : message.type === "error"
                          ? "bg-red-50 border border-red-200"
                          : message.type === "warning"
                          ? "bg-yellow-50 border border-yellow-200"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <div>{message.type.toUpperCase()}</div>
                        <div>{formatTime(message.timestamp)}</div>
                      </div>
                      
                      {message.type === "system" || message.type === "error" || message.type === "warning" ? (
                        <div className={
                          message.type === "error" 
                            ? "text-red-500" 
                            : message.type === "warning"
                            ? "text-yellow-600"
                            : "text-blue-500"
                        }>
                          {message.text}
                        </div>
                      ) : (
                        <div className="text-xs font-mono whitespace-pre-wrap break-all">
                          {typeof message.data === 'object' 
                            ? JSON.stringify(message.data, null, 2)
                            : String(message.data)}
                        </div>
                      )}
                      
                      {message.rawData && (
                        <div className="mt-2 text-xs font-mono text-gray-500 whitespace-pre-wrap break-all">
                          Raw: {message.rawData}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No messages yet
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-purple-600 text-white p-4 text-center text-sm">
        <p>© 2025 CareMates - Real-time IoT Monitoring</p>
      </footer>
      
      {/* Styles */}
      <style jsx>{`
        .message-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
        }
        .message-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .message-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .message-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}