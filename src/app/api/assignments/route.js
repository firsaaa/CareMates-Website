import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(req) {
  try {
    console.log('GET /api/assignments endpoint dipanggil');
    
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
      // Query untuk mengambil assignment dengan nama caregiver dan patient
      const query = `
        SELECT ca.*, 
               u.nama as caregiver_nama, 
               p.nama as patient_nama 
        FROM caregiver_assignments ca
        JOIN users u ON ca.caregiver_id = u.id
        JOIN patients p ON ca.patient_id = p.id
      `;
      console.log('Executing query for assignments');
      
      const result = await client.query(query);
      console.log(`Found ${result.rows.length} assignments`);
      
      return NextResponse.json(result.rows);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting assignments:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data assignment' },
      { status: 500 }
    );
  }
}