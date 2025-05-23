import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(req, { params }) {
  try {
    const userId = parseInt(params.id);
    console.log(`GET /api/users/${userId} endpoint dipanggil`);
    
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
      const query = 'SELECT id, nama, email, no_telepon, role, patient_id FROM users WHERE id = $1';
      console.log(`Executing query for user ${userId}`);
      
      const result = await client.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'User tidak ditemukan' },
          { status: 404 }
        );
      }
      
      console.log(`User ${userId} found`);
      return NextResponse.json(result.rows[0]);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data user' },
      { status: 500 }
    );
  }
}