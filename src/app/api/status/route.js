import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
  let databaseStatus = "disconnected";
  
  // Cek status database
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    client.release();
    
    databaseStatus = "connected";
  } catch (dbError) {
    console.error('Database status check failed:', dbError.message);
  }
  
  return NextResponse.json({
    status: databaseStatus === "connected" ? "operational" : "degraded",
    timestamp: new Date().toISOString(),
    services: {
      database: databaseStatus
    },
    message: databaseStatus === "connected" 
      ? "Sistem berjalan normal" 
      : "Sistem berjalan dalam mode terbatas"
  });
}