import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { getUserFromRequest, isAuthorized } from '../../../lib/auth';
import { UserRole } from '../../../lib/constants';

export async function GET(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const notifikasiId = parseInt(params.id);
    
    // Check if user has access to this notification
    let query;
    let queryParams = [notifikasiId];
    
    if (isAuthorized(user, [UserRole.ADMIN])) {
      query = `
        SELECT n.*, p.nama as pasien_nama, u.nama as caregiver_nama 
        FROM notifikasi n
        JOIN patients p ON n.pasien_id = p.id
        JOIN users u ON n.caregiver_id = u.id
        WHERE n.id = $1
      `;
    } else if (isAuthorized(user, [UserRole.CAREGIVER])) {
      query = `
        SELECT n.*, p.nama as pasien_nama, u.nama as caregiver_nama 
        FROM notifikasi n
        JOIN patients p ON n.pasien_id = p.id
        JOIN users u ON n.caregiver_id = u.id
        WHERE n.id = $1 AND n.caregiver_id = $2
      `;
      queryParams.push(user.id);
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const result = await pool.query(query, queryParams);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const notifikasiId = parseInt(params.id);
    
    // Get current notification
    const currentNotification = await pool.query(
      'SELECT * FROM notifikasi WHERE id = $1',
      [notifikasiId]
    );
    
    if (currentNotification.rows.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update this notification
    if (user.role === UserRole.CAREGIVER && user.id !== currentNotification.rows[0].caregiver_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // If caregiver is updating, they can only update status_baca
    if (user.role === UserRole.CAREGIVER) {
      const { status_baca } = body;
      
      if (status_baca === undefined) {
        return NextResponse.json(
          { error: 'Status baca harus disertakan' },
          { status: 400 }
        );
      }
      
      // Update notification status
      const result = await pool.query(
        'UPDATE notifikasi SET status_baca = $1 WHERE id = $2 RETURNING *',
        [status_baca, notifikasiId]
      );
      
      return NextResponse.json(result.rows[0]);
    }
    
    // Admin can update all fields
    const { pasien_id, caregiver_id, jenis, pesan, waktu_dikirim, status_baca } = body;
    
    // Update notification
    const result = await pool.query(
      'UPDATE notifikasi SET pasien_id = $1, caregiver_id = $2, jenis = $3, pesan = $4, waktu_dikirim = $5, status_baca = $6 WHERE id = $7 RETURNING *',
      [pasien_id, caregiver_id, jenis, pesan, waktu_dikirim, status_baca, notifikasiId]
    );
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromRequest(req);
    const notifikasiId = parseInt(params.id);
    
    // Only admin can delete notifications
    if (!isAuthorized(user, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete notification
    const result = await pool.query(
      'DELETE FROM notifikasi WHERE id = $1 RETURNING id',
      [notifikasiId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}