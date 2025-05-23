import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(req) {
  try {
    console.log('GET /api/users endpoint dipanggil');
    
    // Dapatkan token dari header
    const authorization = req.headers.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('Token tidak ditemukan dalam header');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse URL untuk mendapatkan parameter query
    const url = new URL(req.url);
    const roleParam = url.searchParams.get('role');
    
    // Buat query berdasarkan role
    let query = 'SELECT id, nama, email, no_telepon, role, patient_id FROM users';
    let params = [];
    
    if (roleParam) {
      query += ' WHERE role = $1';
      params.push(roleParam);
      console.log(`Mencari users dengan role: ${roleParam}`);
    }
    
    // Koneksi database dan eksekusi query
    const client = await pool.connect();
    try {
      console.log(`Executing query: ${query}`);
      const result = await client.query(query, params);
      console.log(`Found ${result.rows.length} users`);
      
      return NextResponse.json(result.rows);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data users' },
      { status: 500 }
    );
  }
}