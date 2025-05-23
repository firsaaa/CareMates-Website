import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(req) {
  try {
    console.log('GET /api/devices endpoint dipanggil');
    
    // Dapatkan token dari header
    const authorization = req.headers.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('Token tidak ditemukan dalam header');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Koneksi database dan eksekusi query
    const client = await pool.connect();
    try {
      const query = 'SELECT * FROM devices';
      console.log('Executing query for devices');
      
      const result = await client.query(query);
      console.log(`Found ${result.rows.length} devices`);
      
      return NextResponse.json(result.rows);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting devices:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data perangkat' },
      { status: 500 }
    );
  }
}